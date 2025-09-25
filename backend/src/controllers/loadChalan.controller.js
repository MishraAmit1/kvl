import { LoadChalan } from "../models/loadChalan.model.js";
import { Consignment } from "../models/consignment.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateLoadChalanPDF } from "../utils/loadChalanPdf.js";

const createLoadChalan = asyncHandler(async (req, res) => {
  const {
    chalanNumber, // Add this to accept manual input
    bookingBranch,
    destinationHub,
    dispatchTime,
    vehicle,
    ownerName,
    ownerAddress,
    driver,
    consignments,
    lorryFreight,
    loadingCharges,
    unloadingCharges,
    otherCharges,
    advancePaid,
    tdsDeduction,
    frtPayableAt,
    remarks,
    riskNote,
    postingBy,
  } = req.body;

  // Validate required fields including chalanNumber
  if (
    !chalanNumber ||
    !bookingBranch ||
    !destinationHub ||
    !consignments ||
    consignments.length === 0
  ) {
    throw throwApiError(400, "Missing required fields");
  }

  // Check if chalan number already exists
  const existingChalan = await LoadChalan.findOne({
    chalanNumber: chalanNumber.toUpperCase(),
  });
  if (existingChalan) {
    throw throwApiError(
      400,
      "Chalan number already exists. Please use a unique chalan number."
    );
  }

  // Validate consignments exist
  const consignmentIds = consignments.map((c) => c.consignmentId);
  const existingConsignments = await Consignment.find({
    _id: { $in: consignmentIds },
  });

  if (existingConsignments.length !== consignments.length) {
    throw throwApiError(400, "Some consignments not found");
  }

  // Create consignments array with snapshot data
  const consignmentsWithSnapshot = consignments.map((consignment) => {
    const existing = existingConsignments.find(
      (c) => c._id.toString() === consignment.consignmentId
    );
    return {
      consignmentId: consignment.consignmentId,
      consignmentNumber: existing.consignmentNumber,
      packages: existing.packages,
      packageType: existing.packageType,
      description: existing.description,
      weight: existing.actualWeight,
      freightAmount: existing.freightAmount || 0,
      destination: existing.toCity,
    };
  });

  // Create load chalan with manual chalan number
  const loadChalan = await LoadChalan.create({
    chalanNumber: chalanNumber.toUpperCase(), // Ensure uppercase
    date: new Date(),
    bookingBranch,
    destinationHub,
    dispatchTime,
    vehicle,
    ownerName,
    ownerAddress,
    driver,
    consignments: consignmentsWithSnapshot,
    lorryFreight: lorryFreight || 0,
    loadingCharges: loadingCharges || 0,
    unloadingCharges: unloadingCharges || 0,
    otherCharges: otherCharges || 0,
    advancePaid: advancePaid || 0,
    tdsDeduction: tdsDeduction || 0,
    frtPayableAt,
    remarks,
    riskNote,
    postingBy,
    createdBy: req.user._id,
  });

  // Populate references
  await loadChalan.populate([
    { path: "vehicle.vehicleId", model: "Vehicle" },
    { path: "driver.driverId", model: "Driver" },
    { path: "consignments.consignmentId", model: "Consignment" },
  ]);

  return sendResponse(res, 201, loadChalan, "Load Chalan created successfully");
});

// Get all load chalans with pagination and filters
const getAllLoadChalans = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    date,
    vehicleNumber,
    driverName,
  } = req.query;

  const query = {};

  // Apply filters
  if (status) query.status = status;
  if (date) {
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query.date = { $gte: searchDate, $lt: nextDay };
  }
  if (vehicleNumber)
    query["vehicle.vehicleNumber"] = { $regex: vehicleNumber, $options: "i" };
  if (driverName)
    query["driver.driverName"] = { $regex: driverName, $options: "i" };

  const skip = (page - 1) * limit;

  const loadChalans = await LoadChalan.find(query)
    .populate("vehicle.vehicleId")
    .populate("driver.driverId")
    .populate("consignments.consignmentId")
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await LoadChalan.countDocuments(query);

  return sendResponse(
    res,
    200,
    {
      loadChalans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Load Chalans retrieved successfully"
  );
});

// Get single load chalan by ID
const getLoadChalanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loadChalan = await LoadChalan.findById(id)
    .populate("vehicle.vehicleId")
    .populate("driver.driverId")
    .populate("consignments.consignmentId")
    .populate("createdBy", "fullname username");

  if (!loadChalan) {
    throw throwApiError(404, "Load Chalan not found");
  }

  return sendResponse(
    res,
    200,
    loadChalan,
    "Load Chalan retrieved successfully"
  );
});

// Update load chalan status
const updateLoadChalanStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!status) {
    throw throwApiError(400, "Status is required");
  }

  const validStatuses = [
    "CREATED",
    "DISPATCHED",
    "IN_TRANSIT",
    "ARRIVED",
    "CLOSED",
  ];
  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const loadChalan = await LoadChalan.findById(id);
  if (!loadChalan) {
    throw new ApiError(404, "Load Chalan not found");
  }

  // Status transition validation
  const currentStatus = loadChalan.status;
  const statusOrder = [
    "CREATED",
    "DISPATCHED",
    "IN_TRANSIT",
    "ARRIVED",
    "CLOSED",
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const newIndex = statusOrder.indexOf(status);

  if (newIndex < currentIndex) {
    throw throwApiError(
      400,
      `Cannot move back from ${currentStatus} to ${status}`
    );
  }

  // Update status
  loadChalan.status = status;
  if (remarks) loadChalan.remarks = remarks;
  loadChalan.updatedBy = req.user._id;

  // Auto-update dispatch time when status becomes DISPATCHED
  if (status === "DISPATCHED" && !loadChalan.dispatchTime) {
    loadChalan.dispatchTime = new Date().toLocaleTimeString();
  }

  await loadChalan.save();

  return sendResponse(
    res,
    200,
    loadChalan,
    "Load Chalan status updated successfully"
  );
});

// Update load chalan details
const updateLoadChalan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated
  // delete updateData.chalanNumber;
  delete updateData.date;
  delete updateData.status;
  delete updateData.createdBy;

  const loadChalan = await LoadChalan.findByIdAndUpdate(
    id,
    {
      ...updateData,
      updatedBy: req.user._id,
    },
    { new: true, runValidators: true }
  ).populate([
    { path: "vehicle.vehicleId", model: "Vehicle" },
    { path: "driver.driverId", model: "Driver" },
    { path: "consignments.consignmentId", model: "Consignment" },
  ]);

  if (!loadChalan) {
    throw throwApiError(404, "Load Chalan not found");
  }

  return sendResponse(res, 200, loadChalan, "Load Chalan updated successfully");
});

// Delete load chalan
const deleteLoadChalan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loadChalan = await LoadChalan.findById(id);
  if (!loadChalan) {
    throw throwApiError(404, "Load Chalan not found");
  }

  // Only allow deletion if status is CREATED
  if (loadChalan.status !== "CREATED") {
    throw throwApiError(400, "Cannot delete chalan once dispatched");
  }

  await LoadChalan.findByIdAndDelete(id);

  return sendResponse(res, 200, {}, "Load Chalan deleted successfully");
});

// Get load chalan statistics
const getLoadChalanStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  const stats = await LoadChalan.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalFreight: { $sum: "$totalFreight" },
        totalWeight: { $sum: "$totalWeight" },
      },
    },
  ]);

  const totalChalans = await LoadChalan.countDocuments(dateFilter);
  const totalRevenue = await LoadChalan.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: "$totalFreight" } } },
  ]);

  return sendResponse(
    res,
    200,
    {
      statusBreakdown: stats,
      totalChalans,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
    "Statistics retrieved successfully"
  );
});

// Generate PDF for load chalan
const generateLoadChalanPDFController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loadChalan = await LoadChalan.findById(id).populate([
    { path: "vehicle.vehicleId", model: "Vehicle" },
    { path: "driver.driverId", model: "Driver" },
    { path: "consignments.consignmentId", model: "Consignment" },
  ]);

  if (!loadChalan) {
    throw throwApiError(404, "Load Chalan not found");
  }

  console.log("📄 PDF Generation - Load Chalan data:", {
    id: loadChalan._id,
    chalanNumber: loadChalan.chalanNumber,
    vehicle: loadChalan.vehicle,
    driver: loadChalan.driver,
    consignmentsCount: loadChalan.consignments?.length || 0,
  });

  try {
    console.log("📄 Starting PDF generation...");
    const pdfBuffer = await generateLoadChalanPDF(loadChalan);

    console.log(
      "📄 PDF generated successfully, buffer size:",
      pdfBuffer.length
    );

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty or invalid");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=load-chalan-${loadChalan.chalanNumber}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw throwApiError(500, `Failed to generate PDF: ${error.message}`);
  }
});

export {
  createLoadChalan,
  getAllLoadChalans,
  getLoadChalanById,
  updateLoadChalanStatus,
  updateLoadChalan,
  deleteLoadChalan,
  getLoadChalanStats,
  generateLoadChalanPDFController,
};
