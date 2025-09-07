import { FreightBill } from "../models/freightbill.model.js";
import { Consignment } from "../models/consignment.model.js";
import { Customer } from "../models/customer.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateFreightBillNumber } from "../utils/generateNumbers.js";
import { generateFreightBillPDF } from "../utils/freightpdf.js";
import { sendEmail } from "../utils/emailService.js";
import mongoose from "mongoose";

const createFreightBill = asyncHandler(async (req, res) => {
  const { customerId, billingBranch, consignmentIds, adjustments } = req.body;

  // Input validation
  if (
    !customerId ||
    !billingBranch ||
    !consignmentIds ||
    consignmentIds.length === 0
  ) {
    const error = throwApiError(400, "Please provide all required fields");
    throw error;
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    const error = throwApiError(400, "Invalid customer ID format");
    throw error;
  }

  // Validate consignmentIds array
  if (
    !Array.isArray(consignmentIds) ||
    consignmentIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    const error = throwApiError(400, "Invalid consignment IDs");
    throw error;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Verify customer exists
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      const error = throwApiError(404, "Customer not found");
      throw error;
    }

    // Get all consignments - Updated query to handle missing customerIds
    const consignments = await Consignment.find({
      _id: { $in: consignmentIds },
      $or: [
        // Priority 1: Direct customer ID match
        { "consignor.customerId": customerId },
        { "consignee.customerId": customerId },
        // Priority 2: Match by name + mobile (to avoid duplicate name issues)
        {
          $and: [
            { "consignor.name": customer.name },
            { "consignor.mobile": customer.mobile },
          ],
        },
        {
          $and: [
            { "consignee.name": customer.name },
            { "consignee.mobile": customer.mobile },
          ],
        },
      ],
      status: "DELIVERED",
      isDeleted: false,
    }).session(session);

    console.log("Found consignments for billing:", consignments.length);
    console.log("Customer name:", customer.name);
    console.log("Consignment IDs requested:", consignmentIds);

    if (consignments.length === 0) {
      const error = throwApiError(
        400,
        `No delivered consignments found for customer ${customer.name}. Please ensure consignments are delivered and belong to this customer.`
      );
      throw error;
    }

    // Check if any consignments are already billed
    const alreadyBilledConsignments = await FreightBill.find({
      "consignments.consignmentId": { $in: consignmentIds },
    }).session(session);

    if (alreadyBilledConsignments.length > 0) {
      const error = throwApiError(400, "Some consignments are already billed");
      throw error;
    }

    // Rest of your code remains the same...
    // Generate bill number
    const billNumber = await generateFreightBillNumber();

    // Prepare consignment details for bill with proper validation
    const billConsignments = consignments.map((consignment) => {
      const chargedWeight = consignment.chargedWeight || 0;
      const freight = consignment.freight || 0;

      return {
        consignmentId: consignment._id,
        consignmentNumber: consignment.consignmentNumber,
        consignmentDate: consignment.bookingDate,
        destination: consignment.toCity,
        chargedWeight: chargedWeight,
        rate:
          chargedWeight > 0 ? Number((freight / chargedWeight).toFixed(2)) : 0,
        freight: freight,
        hamali: consignment.hamali || 0,
        stCharges: consignment.stCharges || 0,
        doorDelivery: consignment.doorDelivery || 0,
        otherCharges: consignment.otherCharges || 0,
        grandTotal: consignment.grandTotal || 0,
      };
    });

    // Calculate total amount
    const totalAmount = billConsignments.reduce(
      (sum, item) => sum + (item.grandTotal || 0),
      0
    );

    // Validate and process adjustments
    let validatedAdjustments = [];
    if (adjustments && Array.isArray(adjustments)) {
      validatedAdjustments = adjustments.filter(
        (adj) =>
          adj.type &&
          adj.description &&
          adj.amount !== undefined &&
          adj.amount !== 0
      );
    }

    // Calculate final amount with adjustments
    let finalAmount = totalAmount;
    if (validatedAdjustments.length > 0) {
      validatedAdjustments.forEach((adjustment) => {
        if (adjustment.type === "DISCOUNT") {
          finalAmount -= Math.abs(adjustment.amount || 0);
        } else {
          finalAmount += Math.abs(adjustment.amount || 0);
        }
      });
    }

    // Ensure final amount is not negative
    finalAmount = Math.max(0, finalAmount);

    // Create freight bill
    const freightBill = await FreightBill.create(
      [
        {
          billNumber,
          billDate: new Date(),
          party: {
            customerId: customer._id,
            name: customer.name,
            address: customer.address,
            gstNumber: customer.gstNumber,
          },
          consignments: billConsignments,
          totalAmount,
          adjustments: validatedAdjustments,
          finalAmount,
          billingBranch,
          status: "GENERATED",
          createdBy: req.user._id,
        },
      ],
      { session }
    );
    await Consignment.updateMany(
      { _id: { $in: consignmentIds } },
      {
        $set: {
          billedIn: freightBill[0]._id,
          billedDate: new Date(),
          paymentStatus: "BILLED",
        },
      },
      { session }
    );
    await session.commitTransaction();

    return sendResponse(
      res,
      201,
      freightBill[0],
      "Freight bill created successfully"
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
// Get all freight bills - IMPROVED
const getAllFreightBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, fromDate, toDate } = req.query;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { billNumber: { $regex: search, $options: "i" } },
      { "party.name": { $regex: search, $options: "i" } },
      { billingBranch: { $regex: search, $options: "i" } },
    ];
  }

  const validStatuses = [
    "DRAFT",
    "GENERATED",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
  ];
  if (status && validStatuses.includes(status)) {
    query.status = status;
  }

  if (fromDate || toDate) {
    query.billDate = {};
    if (fromDate) {
      const from = new Date(fromDate);
      if (!isNaN(from.getTime())) {
        query.billDate.$gte = from;
      }
    }
    if (toDate) {
      const to = new Date(toDate);
      if (!isNaN(to.getTime())) {
        query.billDate.$lte = to;
      }
    }
  }
  const skip = (page - 1) * limit;

  try {
    const freightBills = await FreightBill.find(query)
      .populate("party.customerId", "name mobile email")
      .populate("createdBy", "username")
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FreightBill.countDocuments(query);

    return sendResponse(
      res,
      200,
      {
        freightBills,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Freight bills fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching freight bills:", error);
    throw throwApiError(500, "Failed to fetch freight bills");
  }
});

// Get freight bill by ID - IMPROVED
const getFreightBillById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  try {
    const freightBill = await FreightBill.findById(id)
      .populate("party.customerId")
      .populate("consignments.consignmentId")
      .populate("createdBy", "username");

    if (!freightBill) {
      throw throwApiError(404, "Freight bill not found");
    }

    return sendResponse(
      res,
      200,
      freightBill,
      "Freight bill fetched successfully"
    );
  } catch (error) {
    if (error instanceof throwApiError) throw error;
    console.error("Error fetching freight bill:", error);
    throw throwApiError(500, "Failed to fetch freight bill");
  }
});

// Update freight bill - IMPROVED
const updateFreightBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adjustments } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  try {
    const freightBill = await FreightBill.findById(id);
    if (!freightBill) {
      throw throwApiError(404, "Freight bill not found");
    }

    // FIX: Check all non-editable statuses
    if (["PAID", "PARTIALLY_PAID", "CANCELLED"].includes(freightBill.status)) {
      const error = throwApiError(
        400,
        `Cannot update ${freightBill.status
          .toLowerCase()
          .replace("_", " ")} freight bill`
      );
      throw error;
    }

    // Validate and update adjustments
    if (adjustments) {
      // Validate adjustments structure
      if (!Array.isArray(adjustments)) {
        throw throwApiError(400, "Adjustments must be an array");
      }

      const validatedAdjustments = adjustments.filter((adj) => {
        return (
          adj &&
          adj.type &&
          ["DISCOUNT", "EXTRA_CHARGE", "FUEL_SURCHARGE", "OTHER"].includes(
            adj.type
          ) &&
          adj.description &&
          adj.description.trim().length >= 3 &&
          adj.amount !== undefined &&
          adj.amount !== 0 &&
          !isNaN(adj.amount)
        );
      });

      freightBill.adjustments = validatedAdjustments;

      // Recalculate final amount
      let finalAmount = freightBill.totalAmount || 0;
      validatedAdjustments.forEach((adjustment) => {
        if (adjustment.type === "DISCOUNT") {
          finalAmount -= Math.abs(adjustment.amount);
        } else {
          finalAmount += Math.abs(adjustment.amount);
        }
      });

      // Ensure final amount is not negative
      freightBill.finalAmount = Math.max(0, finalAmount);
    }

    await freightBill.save();

    return sendResponse(
      res,
      200,
      freightBill,
      "Freight bill updated successfully"
    );
  } catch (error) {
    if (error instanceof throwApiError) throw error;
    console.error("Error updating freight bill:", error);
    throw throwApiError(500, "Failed to update freight bill");
  }
});

// Delete freight bill - IMPROVED
const deleteFreightBill = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  try {
    const freightBill = await FreightBill.findById(id);
    if (!freightBill) {
      throw throwApiError(404, "Freight bill not found");
    }

    if (["PAID", "PARTIALLY_PAID"].includes(freightBill.status)) {
      const error = throwApiError(
        400,
        `Cannot delete ${freightBill.status
          .toLowerCase()
          .replace("_", " ")} freight bill`
      );
      throw error;
    }
    // ✅ ADD THIS - Remove billing reference from consignments
    const consignmentIds = freightBill.consignments.map((c) => c.consignmentId);
    await Consignment.updateMany(
      { _id: { $in: consignmentIds } },
      {
        $unset: {
          billedIn: "",
          billedDate: "",
        },
        $set: {
          paymentStatus: "UNBILLED",
        },
      }
    );

    await FreightBill.findByIdAndDelete(id);

    return sendResponse(res, 200, null, "Freight bill deleted successfully");
  } catch (error) {
    if (error instanceof throwApiError) throw error;
    console.error("Error deleting freight bill:", error);
    throw throwApiError(500, "Failed to delete freight bill");
  }
});

// Get unbilled consignments for a customer - FIXED
const getUnbilledConsignments = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID format",
    });
  }

  try {
    // Get customer details first
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    console.log("Customer Details:", {
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
    });

    // First, let's check if there are ANY consignments for this customer
    const allConsignmentsForCustomer = await Consignment.find({
      $or: [
        { "consignor.customerId": customerId },
        { "consignee.customerId": customerId },
        { "consignor.name": customer.name },
        { "consignee.name": customer.name },
      ],
    });

    console.log(
      "Total consignments for customer (any status):",
      allConsignmentsForCustomer.length
    );

    // Now check for delivered consignments
    const deliveredConsignments = await Consignment.find({
      $or: [
        // Priority 1: Direct customer ID match
        { "consignor.customerId": customerId },
        { "consignee.customerId": customerId },
        // Priority 2: Match by name + mobile combination
        {
          $and: [
            { "consignor.name": customer.name },
            { "consignor.mobile": customer.mobile },
          ],
        },
        {
          $and: [
            { "consignee.name": customer.name },
            { "consignee.mobile": customer.mobile },
          ],
        },
      ],
      status: "DELIVERED",
      isDeleted: false,
    });

    console.log("Delivered consignments found:", deliveredConsignments.length);

    // Get all billed consignment IDs
    const billedConsignmentIds = await FreightBill.distinct(
      "consignments.consignmentId"
    );

    console.log("Already billed consignment IDs:", billedConsignmentIds.length);

    // Filter out already billed consignments
    const unbilledConsignments = deliveredConsignments.filter(
      (consignment) =>
        !billedConsignmentIds.some(
          (billedId) => billedId.toString() === consignment._id.toString()
        )
    );

    console.log(
      "Unbilled consignments after filtering:",
      unbilledConsignments.length
    );

    const totalUnbilledAmount = unbilledConsignments.reduce(
      (sum, consignment) => sum + (consignment.grandTotal || 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        consignments: unbilledConsignments,
        totalUnbilledAmount,
        totalConsignments: unbilledConsignments.length,
      },
      message: "Unbilled consignments fetched successfully",
    });
  } catch (error) {
    console.error("Error in getUnbilledConsignments:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch unbilled consignments",
    });
  }
});

// Update freight bill status - IMPROVED
const updateFreightBillStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  const validStatuses = [
    "DRAFT",
    "GENERATED",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) {
    const error = throwApiError(
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    );
    throw error;
  }
  try {
    const freightBill = await FreightBill.findById(id);
    if (!freightBill) {
      throw throwApiError(404, "Freight bill not found");
    }
    const currentStatus = freightBill.status;
    if (
      (currentStatus === "PAID" || currentStatus === "CANCELLED") &&
      status !== currentStatus
    ) {
      const error = throwApiError(
        400,
        `Cannot change status from ${currentStatus}`
      );
      throw error;
    }
    // Only allow forward progression (except for CANCELLED)
    const statusOrder = [
      "DRAFT",
      "GENERATED",
      "SENT",
      "PARTIALLY_PAID",
      "PAID",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(status);

    if (status !== "CANCELLED" && newIndex < currentIndex) {
      const error = throwApiError(
        400,
        `Cannot move status backward from ${currentStatus} to ${status}`
      );
      throw error;
    }

    freightBill.status = status;
    await freightBill.save();
    return sendResponse(res, 200, freightBill, "Status updated successfully");
  } catch (error) {
    if (error instanceof throwApiError) throw error;
    console.error("Error updating freight bill status:", error);
    throw throwApiError(500, "Failed to update freight bill status");
  }
});

// Mark freight bill as paid - IMPROVED
const markFreightBillAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = throwApiError(400, "Invalid freight bill ID format");
    throw error;
  }

  try {
    const freightBill = await FreightBill.findById(id);
    if (!freightBill) {
      const error = throwApiError(404, "Freight bill not found");
      throw error;
    }

    if (freightBill.status === "PAID") {
      const error = throwApiError(
        400,
        "Freight bill is already marked as paid"
      );
      throw error;
    }

    // FIX: Can't mark cancelled bills as paid
    if (freightBill.status === "CANCELLED") {
      const error = throwApiError(
        400,
        "Cannot mark cancelled freight bill as paid"
      );
      throw error;
    }

    freightBill.status = "PAID";
    await freightBill.save();
    const consignmentIds = freightBill.consignments.map((c) => c.consignmentId);
    await Consignment.updateMany(
      { _id: { $in: consignmentIds } },
      {
        $set: {
          paymentStatus: "PAID",
        },
      }
    );

    return sendResponse(res, 200, freightBill, "Freight bill marked as paid");
  } catch (error) {
    console.error("Error marking freight bill as paid:", error);
    throw error;
  }
});

// Get freight bill statistics - IMPROVED
const getFreightBillStatistics = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  const query = {};

  if (fromDate || toDate) {
    query.billDate = {};
    if (fromDate) {
      const from = new Date(fromDate);
      if (!isNaN(from.getTime())) {
        query.billDate.$gte = from;
      }
    }
    if (toDate) {
      const to = new Date(toDate);
      if (!isNaN(to.getTime())) {
        query.billDate.$lte = to;
      }
    }
  }

  try {
    const [totalBills, paidBills, pendingBills, totalAmount, paidAmount] =
      await Promise.all([
        FreightBill.countDocuments(query),
        FreightBill.countDocuments({ ...query, status: "PAID" }),
        FreightBill.countDocuments({ ...query, status: { $ne: "PAID" } }),
        FreightBill.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]),
        FreightBill.aggregate([
          { $match: { ...query, status: "PAID" } },
          { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]),
      ]);

    const statistics = {
      totalBills,
      paidBills,
      pendingBills,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: (totalAmount[0]?.total || 0) - (paidAmount[0]?.total || 0),
    };

    return sendResponse(
      res,
      200,
      statistics,
      "Statistics fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching freight bill statistics:", error);
    throw throwApiError(500, "Failed to fetch freight bill statistics");
  }
});

// Search freight bills - IMPROVED
const searchFreightBills = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length === 0) {
    throw throwApiError(400, "Search query is required");
  }

  const searchQuery = q.trim();
  const searchLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 results

  try {
    const freightBills = await FreightBill.find({
      $or: [
        { billNumber: { $regex: searchQuery, $options: "i" } },
        { "party.name": { $regex: searchQuery, $options: "i" } },
        { billingBranch: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .populate("party.customerId", "name mobile")
      .limit(searchLimit)
      .sort({ billDate: -1 });

    return sendResponse(
      res,
      200,
      freightBills,
      "Freight bills fetched successfully"
    );
  } catch (error) {
    console.error("Error searching freight bills:", error);
    throw throwApiError(500, "Failed to search freight bills");
  }
});

// Generate freight bill PDF - FIXED VERSION
const generateFreightBillPDFController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  const freightBill = await FreightBill.findById(id)
    .populate("party.customerId")
    .populate("consignments.consignmentId")
    .populate("createdBy", "username");

  if (!freightBill) {
    throw throwApiError(404, "Freight bill not found");
  }

  // Validate required data before PDF generation
  if (!freightBill.party || !freightBill.party.name) {
    throw throwApiError(400, "Freight bill missing required party information");
  }

  if (!freightBill.consignments || freightBill.consignments.length === 0) {
    throw throwApiError(400, "Freight bill has no consignments");
  }

  console.log("Freight Bill Data for PDF:", {
    billNumber: freightBill.billNumber,
    partyName: freightBill.party?.name,
    consignmentsCount: freightBill.consignments?.length,
    finalAmount: freightBill.finalAmount,
  });

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateFreightBillPDF(freightBill);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw throwApiError(500, "Failed to generate PDF - empty buffer");
    }

    // Set response headers
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="FreightBill-${freightBill.billNumber}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw throwApiError(500, "Failed to generate PDF. Please try again later.");
  }
});

// Get freight bills by status
const getFreightBillsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validStatuses = [
    "DRAFT",
    "GENERATED",
    "SENT",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) {
    const error = throwApiError(
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    );
    throw error;
  }

  const skip = (page - 1) * limit;

  const freightBills = await FreightBill.find({ status })
    .populate("party.customerId", "name mobile")
    .sort({ billDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FreightBill.countDocuments({ status });

  return sendResponse(
    res,
    200,
    {
      freightBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Freight bills fetched successfully"
  );
});

// Get freight bills by customer
const getFreightBillsByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const freightBills = await FreightBill.find({
    "party.customerId": customerId,
  })
    .sort({ billDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FreightBill.countDocuments({
    "party.customerId": customerId,
  });

  return sendResponse(
    res,
    200,
    {
      freightBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Freight bills fetched successfully"
  );
});

// Get freight bills by date range
const getFreightBillsByDateRange = asyncHandler(async (req, res) => {
  const { fromDate, toDate, page = 1, limit = 10 } = req.query;

  if (!fromDate || !toDate) {
    throw throwApiError(400, "Please provide both fromDate and toDate");
  }

  const skip = (page - 1) * limit;

  const freightBills = await FreightBill.find({
    billDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
  })
    .populate("party.customerId", "name mobile")
    .sort({ billDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FreightBill.countDocuments({
    billDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
  });

  return sendResponse(
    res,
    200,
    {
      freightBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Freight bills fetched successfully"
  );
});

const sendFreightBillEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw throwApiError(400, "Invalid freight bill ID format");
  }

  const freightBill = await FreightBill.findById(id).populate(
    "party.customerId"
  );

  if (!freightBill) {
    throw throwApiError(404, "Freight bill not found");
  }

  // Validate party data
  if (!freightBill.party || !freightBill.party.name) {
    throw throwApiError(400, "Freight bill missing party information");
  }

  console.log("Customer details:", freightBill.party.customerId);
  console.log("Email from request:", email);

  const customerEmail = email || freightBill.party.customerId?.email;

  if (!customerEmail) {
    throw throwApiError(
      400,
      "No email address available. Please provide an email address."
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    throw throwApiError(400, "Invalid email format");
  }

  try {
    const pdfBuffer = await generateFreightBillPDF(freightBill);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw throwApiError(500, "Failed to generate PDF for email");
    }

    await sendEmail(
      customerEmail,
      `Freight Bill - ${freightBill.billNumber}`,
      `Dear ${freightBill.party.name},\n\nPlease find attached your freight bill.\n\nBill Number: ${freightBill.billNumber}\nAmount: ₹${freightBill.finalAmount}\n\nThank you for your business.\n\nKVL Logistics`,
      [
        {
          filename: `FreightBill-${freightBill.billNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ]
    );

    freightBill.status = "SENT";
    await freightBill.save();

    return sendResponse(res, 200, null, "Freight bill sent successfully");
  } catch (error) {
    console.error("Email sending error:", error);
    if (error.message.includes("PDF")) {
      throw throwApiError(500, "Failed to generate PDF for email");
    }
    throw throwApiError(
      500,
      "Failed to send email. Please check email configuration."
    );
  }
});

// Get pending payments
const getPendingPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // FIX: Include all non-paid statuses
  const pendingStatuses = ["DRAFT", "GENERATED", "SENT", "PARTIALLY_PAID"];

  const pendingBills = await FreightBill.find({
    status: { $in: pendingStatuses },
  })
    .populate("party.customerId", "name mobile email")
    .sort({ billDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FreightBill.countDocuments({
    status: { $in: pendingStatuses },
  });

  const totalPendingAmount = await FreightBill.aggregate([
    { $match: { status: { $in: pendingStatuses } } },
    { $group: { _id: null, total: { $sum: "$finalAmount" } } },
  ]);

  return sendResponse(
    res,
    200,
    {
      pendingBills,
      totalPendingAmount: totalPendingAmount[0]?.total || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Pending payments fetched successfully"
  );
});

export {
  createFreightBill,
  getAllFreightBills,
  getFreightBillById,
  updateFreightBill,
  deleteFreightBill,
  searchFreightBills,
  getUnbilledConsignments,
  getFreightBillsByStatus,
  getFreightBillsByCustomer,
  getFreightBillsByDateRange,
  updateFreightBillStatus,
  generateFreightBillPDFController,
  sendFreightBillEmail,
  getFreightBillStatistics,
  getPendingPayments,
  markFreightBillAsPaid,
};
