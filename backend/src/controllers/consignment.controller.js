import { Consignment } from "../models/consignment.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Driver } from "../models/driver.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/emailService.js";
import { Customer } from "../models/customer.model.js";
import { generateConsignmentPDF } from "../utils/pdfGenerator.js";

// Create new consignment
const createConsignment = asyncHandler(async (req, res) => {
  const {
    bookingBranch,
    consignor,
    consignee,
    fromCity,
    toCity,
    description,
    packages,
    actualWeight,
    chargedWeight,
    value,
    rate,
    freight,
    hamali,
    stCharges,
    doorDelivery,
    otherCharges,
    riskCharges,
    serviceTax,
    insurance,
    typeOfPickup,
    typeOfDelivery,
    pan,
    invoiceNumber,
    eWayBillNumber,
    gstPayableBy,
    risk,
    toPay,
  } = req.body;

  // Validate required fields
  // if (
  //   !bookingBranch ||
  //   !fromCity ||
  //   !toCity ||
  //   !description ||
  //   !packages ||
  //   !actualWeight ||
  //   !chargedWeight ||
  //   !value ||
  //   !freight
  // ) {
  //   throw throwApiError(400, "Please provide all required fields");
  // }

  // Validate consignor
  // if (!consignor.name || !consignor.address || !consignor.mobile) {
  //   throw throwApiError(400, "Please provide complete consignor details");
  // }

  // Validate consignee
  // if (!consignee.name || !consignee.address || !consignee.mobile) {
  //   throw throwApiError(400, "Please provide complete consignee details");
  // }

  // ✅ ENHANCED VALIDATION
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  // // Validate emails if provided
  // if (consignor.email && !emailRegex.test(consignor.email)) {
  //   throw throwApiError(400, "Invalid consignor email format");
  // }

  // if (consignee.email && !emailRegex.test(consignee.email)) {
  //   throw throwApiError(400, "Invalid consignee email format");
  // }

  // Validate GST if provided
  // if (consignor.gstNumber && !gstRegex.test(consignor.gstNumber)) {
  //   throw throwApiError(400, "Invalid consignor GST number format");
  // }

  // if (consignee.gstNumber && !gstRegex.test(consignee.gstNumber)) {
  //   throw throwApiError(400, "Invalid consignee GST number format");
  // }

  // Validate weight logic
  if (Number(chargedWeight) < Number(actualWeight)) {
    throw throwApiError(
      400,
      "Charged weight cannot be less than actual weight"
    );
  }

  // Generate consignment number
  // if (!req.body.consignmentNumber) {
  //   throw throwApiError(400, "Consignment number is required");
  // }
  const consignmentNumber = req.body.consignmentNumber;

  // Calculate grand total
  const grandTotal =
    (freight || 0) +
    (hamali || 0) +
    (stCharges || 0) +
    (doorDelivery || 0) +
    (otherCharges || 0) +
    (riskCharges || 0) +
    (serviceTax || 0);

  // Create consignment
  const consignmentData = {
    consignmentNumber,
    bookingDate: new Date(),
    bookingBranch,
    consignor,
    consignee,
    fromCity,
    rate,
    toCity,
    description,
    packages,
    actualWeight,
    chargedWeight,
    value,
    freight,
    hamali,
    stCharges,
    doorDelivery,
    otherCharges,
    riskCharges,
    serviceTax,
    grandTotal,
    insurance,
    typeOfPickup,
    typeOfDelivery,
    pan,
    invoiceNumber,
    eWayBillNumber,
    gstPayableBy: gstPayableBy || "CONSIGNER",
    risk: risk || "OWNER_RISK",
    toPay: toPay || "TO-PAY",
    status: "BOOKED",
    createdBy: req.user?._id || null,
  };

  // If vehicle and driver are provided, assign them and update status
  if (req.body.vehicle && req.body.driver) {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    const driver = await Driver.findById(req.body.driver);
    // console.log("Vehicle and driver provided:", {
    //   vehicle: req.body.vehicle,
    //   driver: req.body.driver,
    // });

    // // Get vehicle and driver details
    // const vehicle = await Vehicle.findById(req.body.vehicle);
    // const driver = await Driver.findById(req.body.driver);

    // console.log("Found vehicle:", vehicle);
    // console.log("Found driver:", driver);

    if (vehicle && driver) {
      consignmentData.vehicle = {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        driverId: driver._id,
        driverName: driver.name,
        driverMobile: driver.mobile,
      };
      consignmentData.status = "ASSIGNED";

      console.log("Updated consignment data:", consignmentData);

      // Update vehicle and driver status
      // vehicle.status = "ON_TRIP";
      // driver.status = "ON_TRIP";
      // driver.currentVehicle = vehicle._id;

      // await Promise.all([vehicle.save(), driver.save()]);
    } else {
      console.log("Vehicle or driver not found");
    }
  } else {
    console.log("No vehicle or driver provided");
  }

  const consignment = await Consignment.create(consignmentData);

  // Send SMS to consignor
  const smsMessage = `Dear ${consignor.name}, Your booking is confirmed. Consignment No: ${consignmentNumber}. From: ${fromCity} → To: ${toCity}. Material: ${description}. - KVL Logistics`;
  // await sendSMS(consignor.mobile, smsMessage);

  // Send email to consignor
  if (consignor.email) {
    try {
      await sendEmail(consignor.email, "Consignment Notification", smsMessage);
      console.log("Email sent to consignor");
    } catch (e) {
      console.warn("Email send failed (ignored):", e.message);
    }
  }

  return sendResponse(
    res,
    201,
    consignment,
    "Consignment created successfully"
  );
});

// Get all consignments with pagination and filters
// Get all consignments with pagination and filters
const getAllConsignments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    fromDate,
    toDate,
    fromCity,
    toCity,
    gstPayableBy,
    risk,
    toPay,
    paymentReceiptStatus,
  } = req.query;

  console.log("=== PAYMENT FILTER DEBUG ===");
  console.log("paymentReceiptStatus param:", paymentReceiptStatus);

  const query = { isDeleted: false };

  // Add search filter
  if (search) {
    query.$or = [
      { consignmentNumber: { $regex: search, $options: "i" } },
      { "consignor.name": { $regex: search, $options: "i" } },
      { "consignee.name": { $regex: search, $options: "i" } },
      { "consignor.mobile": { $regex: search, $options: "i" } },
      { "consignee.mobile": { $regex: search, $options: "i" } },
      { "consignor.gstNumber": { $regex: search, $options: "i" } },
      { "consignee.gstNumber": { $regex: search, $options: "i" } },
      { fromCity: { $regex: search, $options: "i" } },
      { toCity: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { bookingBranch: { $regex: search, $options: "i" } },
      { "vehicle.vehicleNumber": { $regex: search, $options: "i" } },
      { "vehicle.driverName": { $regex: search, $options: "i" } },
    ];
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // FIXED Payment Receipt Filter
  if (paymentReceiptStatus === "true") {
    // Payment Done - only those with paymentReceiptStatus = true
    query.paymentReceiptStatus = true;
  } else if (paymentReceiptStatus === "false") {
    // Payment Pending - those with false OR field doesn't exist
    query.$or = [
      { paymentReceiptStatus: false },
      { paymentReceiptStatus: { $exists: false } },
      { paymentReceiptStatus: null },
    ];
  }

  console.log("Payment filter query:", JSON.stringify(query, null, 2));

  // Add other filters
  if (gstPayableBy) {
    query.gstPayableBy = gstPayableBy;
  }

  if (risk) {
    query.risk = risk;
  }

  if (toPay) {
    query.toPay = toPay;
  }

  // Add date range filter
  if (fromDate || toDate) {
    query.bookingDate = {};
    if (fromDate) {
      query.bookingDate.$gte = new Date(fromDate);
    }
    if (toDate) {
      query.bookingDate.$lte = new Date(toDate + "T23:59:59.999Z");
    }
  }

  // Add city filters
  if (fromCity) {
    query.fromCity = { $regex: fromCity, $options: "i" };
  }
  if (toCity) {
    query.toCity = { $regex: toCity, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find(query)
    .populate("vehicle.vehicleId", "vehicleNumber vehicleType")
    .populate("vehicle.driverId", "name mobile")
    .populate("createdBy", "username")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments(query);

  console.log("Found consignments:", consignments.length);
  console.log("Total count:", total);
  console.log("=== END PAYMENT FILTER DEBUG ===");

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Get consignment by ID
const getConsignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false })
    .populate("vehicle.vehicleId")
    .populate("vehicle.driverId")
    .populate("createdBy", "username")
    .populate("updatedBy", "username");

  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  return sendResponse(
    res,
    200,
    consignment,
    "Consignment fetched successfully"
  );
});

// Update consignment
const updateConsignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  // Cannot edit after delivery
  // if (consignment.status === "DELIVERED") {
  //   throw throwApiError(400, "Cannot edit delivered consignment");
  // }
  if (updateData.bookingDate) {
    updateData.bookingDate = new Date(updateData.bookingDate);
  }
  // ✅ VALIDATE UPDATES IF PROVIDED
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  // // Validate consignor updates
  // if (updateData.consignor) {
  //   if (
  //     updateData.consignor.mobile &&
  //     !phoneRegex.test(updateData.consignor.mobile)
  //   ) {
  //     throw throwApiError(400, "Invalid consignor mobile number");
  //   }
  //   if (
  //     updateData.consignor.email &&
  //     !emailRegex.test(updateData.consignor.email)
  //   ) {
  //     throw throwApiError(400, "Invalid consignor email");
  //   }
  //   if (
  //     updateData.consignor.gstNumber &&
  //     !gstRegex.test(updateData.consignor.gstNumber)
  //   ) {
  //     throw throwApiError(400, "Invalid consignor GST number");
  //   }
  // }

  // // Validate consignee updates
  // if (updateData.consignee) {
  //   if (updateData.consignee.mobile) {
  //     throw throwApiError(400, "Invalid consignee mobile number");
  //   }
  //   if (
  //     updateData.consignee.email &&
  //     !emailRegex.test(updateData.consignee.email)
  //   ) {
  //     throw throwApiError(400, "Invalid consignee email");
  //   }
  //   if (
  //     updateData.consignee.gstNumber &&
  //     !gstRegex.test(updateData.consignee.gstNumber)
  //   ) {
  //     throw throwApiError(400, "Invalid consignee GST number");
  //   }
  // }
  // if (updateData.consignmentNumber) {
  //   // Optional: check if number already exists for another consignment
  //   const exists = await Consignment.findOne({
  //     consignmentNumber: updateData.consignmentNumber,
  //     _id: { $ne: id },
  //   });
  //   if (exists) {
  //     throw throwApiError(400, "Consignment number already in use");
  //   }
  // }
  // Validate weight logic if updating
  if (updateData.chargedWeight && updateData.actualWeight) {
    if (Number(updateData.chargedWeight) < Number(updateData.actualWeight)) {
      throw throwApiError(
        400,
        "Charged weight cannot be less than actual weight"
      );
    }
  } else if (updateData.chargedWeight) {
    if (Number(updateData.chargedWeight) < Number(consignment.actualWeight)) {
      throw throwApiError(
        400,
        "Charged weight cannot be less than actual weight"
      );
    }
  }

  // Validate new fields if provided
  if (updateData.gstPayableBy) {
    const validGstPayableBy = ["CONSIGNER", "CONSIGNEE", "TRANSPORTER"];
    if (!validGstPayableBy.includes(updateData.gstPayableBy)) {
      throw throwApiError(400, "Invalid GST Payable By value");
    }
  }

  if (updateData.risk) {
    const validRisk = ["OWNER_RISK", "CARRIER_RISK"];
    if (!validRisk.includes(updateData.risk)) {
      throw throwApiError(400, "Invalid Risk value");
    }
  }

  if (updateData.toPay) {
    const validToPay = ["TO-PAY", "TBB", "PAID"];
    if (!validToPay.includes(updateData.toPay)) {
      throw throwApiError(400, "Invalid To Pay value");
    }
  }

  // Recalculate grand total if charges are updated
  if (
    updateData.freight !== undefined ||
    updateData.hamali !== undefined ||
    updateData.stCharges !== undefined ||
    updateData.doorDelivery !== undefined ||
    updateData.otherCharges !== undefined ||
    updateData.riskCharges !== undefined ||
    updateData.serviceTax !== undefined
  ) {
    updateData.grandTotal =
      (updateData.freight || consignment.freight || 0) +
      (updateData.hamali || consignment.hamali || 0) +
      (updateData.stCharges || consignment.stCharges || 0) +
      (updateData.doorDelivery || consignment.doorDelivery || 0) +
      (updateData.otherCharges || consignment.otherCharges || 0) +
      (updateData.riskCharges || consignment.riskCharges || 0) +
      (updateData.serviceTax || consignment.serviceTax || 0);
  }
  updateData.updatedBy = req.user?._id || null;

  const updatedConsignment = await Consignment.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return sendResponse(
    res,
    200,
    updatedConsignment,
    "Consignment updated successfully"
  );
});

// Delete consignment (soft delete)
const deleteConsignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  // // Cannot delete after delivery
  // if (consignment.status === "DELIVERED") {
  //   throw throwApiError(400, "Cannot delete delivered consignment");
  // }

  await Consignment.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user?._id || null,
  });

  return sendResponse(res, 200, null, "Consignment deleted successfully");
});

// Search consignments
const searchConsignments = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw throwApiError(400, "Search query is required");
  }

  const consignments = await Consignment.find({
    isDeleted: false,
    $or: [
      { consignmentNumber: { $regex: q, $options: "i" } },
      { "consignor.name": { $regex: q, $options: "i" } },
      { "consignee.name": { $regex: q, $options: "i" } },
      { fromCity: { $regex: q, $options: "i" } },
      { toCity: { $regex: q, $options: "i" } },
    ],
  })
    .limit(parseInt(limit))
    .sort({ bookingDate: -1 });

  return sendResponse(
    res,
    200,
    consignments,
    "Consignments fetched successfully"
  );
});

// Get consignments by status
const getConsignmentsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validStatuses = [
    "BOOKED",
    "ASSIGNED",
    "SCHEDULED",
    "IN_TRANSIT",
    "DELIVERED_UNCONFIRMED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({ status, isDeleted: false })
    .populate("vehicle.vehicleId", "vehicleNumber")
    .populate("vehicle.driverId", "name")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({ status, isDeleted: false });

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Get consignments by customer
const getConsignmentsByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({
    $or: [
      { "consignor.customerId": customerId },
      { "consignee.customerId": customerId },
    ],
    isDeleted: false,
  })
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({
    $or: [
      { "consignor.customerId": customerId },
      { "consignee.customerId": customerId },
    ],
    isDeleted: false,
  });
  console.log(
    `Fetched ${
      consignments.length
    } consignments for customer ${customerId} with status ${status || "all"}`
  ); // For debugging
  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Get consignments by date range
const getConsignmentsByDateRange = asyncHandler(async (req, res) => {
  const { fromDate, toDate, page = 1, limit = 10 } = req.query;

  if (!fromDate || !toDate) {
    throw throwApiError(400, "Please provide both fromDate and toDate");
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({
    bookingDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    isDeleted: false,
  })
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({
    bookingDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    isDeleted: false,
  });

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Update consignment status
// Update consignment status
const updateConsignmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    actualPickupDate,
    actualPickupTime,
    transitNotes,
    proofOfDelivery,
  } = req.body;

  const validStatuses = [
    "BOOKED",
    "ASSIGNED",
    "SCHEDULED",
    "IN_TRANSIT",
    "DELIVERED_UNCONFIRMED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  const statusFlow = {
    BOOKED: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["SCHEDULED", "CANCELLED"],
    SCHEDULED: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["DELIVERED_UNCONFIRMED", "DELIVERED", "CANCELLED"],
    DELIVERED_UNCONFIRMED: ["DELIVERED", "IN_TRANSIT"],
    DELIVERED: [],
    CANCELLED: ["BOOKED"],
  };

  if (!statusFlow[consignment.status].includes(status)) {
    throw throwApiError(
      400,
      `Cannot change status from ${consignment.status} to ${status}`
    );
  }

  // Previous status for checking
  const previousStatus = consignment.status;

  // Update status
  consignment.status = status;
  consignment.updatedBy = req.user?._id || null;

  // Handle DELIVERED_UNCONFIRMED
  if (status === "DELIVERED_UNCONFIRMED") {
    consignment.deliveryDate = new Date();
    consignment.deliveryTime = new Date().toLocaleTimeString();
  }

  // Handle DELIVERED status
  if (status === "DELIVERED") {
    // Only update delivery date if not already set
    if (!consignment.deliveryDate) {
      consignment.deliveryDate = new Date();
      consignment.deliveryTime = new Date().toLocaleTimeString();
    }

    // If coming from DELIVERED_UNCONFIRMED, require POD
    if (previousStatus === "DELIVERED_UNCONFIRMED" && !proofOfDelivery) {
      throw throwApiError(
        400,
        "Proof of delivery is required to confirm delivery"
      );
    }

    if (proofOfDelivery) {
      consignment.proofOfDelivery = proofOfDelivery;
    }

    // ✅ FREE UP VEHICLE AND DRIVER WHEN DELIVERED
    if (consignment.vehicle?.vehicleId) {
      // Check if this vehicle has other active consignments
      const activeConsignments = await Consignment.find({
        "vehicle.vehicleId": consignment.vehicle.vehicleId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      // Only free vehicle if no other active consignments
      if (activeConsignments.length === 0) {
        await Vehicle.findByIdAndUpdate(consignment.vehicle.vehicleId, {
          status: "AVAILABLE",
        });
      }
    }

    if (consignment.vehicle?.driverId) {
      // Check if this driver has other active consignments
      const activeConsignments = await Consignment.find({
        "vehicle.driverId": consignment.vehicle.driverId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      // Only free driver if no other active consignments
      if (activeConsignments.length === 0) {
        await Driver.findByIdAndUpdate(consignment.vehicle.driverId, {
          status: "AVAILABLE",
          currentVehicle: null,
        });
      }
    }

    // Send notification email
    if (consignment.consignor.email) {
      try {
        const smsMessage = `Dear ${
          consignment.consignor.name
        }, Your consignment ${
          consignment.consignmentNumber
        } is successfully delivered. Delivered To: ${
          consignment.consignee.name
        }, Time: ${consignment.deliveryDate.toLocaleDateString()}, ${
          consignment.deliveryTime
        }. Thank you for choosing KVL Logistics!`;

        await sendEmail(
          consignment.consignor.email,
          "Consignment Delivered",
          smsMessage
        );
      } catch (e) {
        console.warn("Email send failed (ignored):", e.message);
      }
    }
  }

  // ✅ ALSO FREE UP WHEN CANCELLED
  if (status === "CANCELLED") {
    if (consignment.vehicle?.vehicleId) {
      const activeConsignments = await Consignment.find({
        "vehicle.vehicleId": consignment.vehicle.vehicleId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      if (activeConsignments.length === 0) {
        await Vehicle.findByIdAndUpdate(consignment.vehicle.vehicleId, {
          status: "AVAILABLE",
        });
      }
    }

    if (consignment.vehicle?.driverId) {
      const activeConsignments = await Consignment.find({
        "vehicle.driverId": consignment.vehicle.driverId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      if (activeConsignments.length === 0) {
        await Driver.findByIdAndUpdate(consignment.vehicle.driverId, {
          status: "AVAILABLE",
          currentVehicle: null,
        });
      }
    }
  }

  // Handle IN_TRANSIT status
  if (status === "IN_TRANSIT") {
    // Only update if both date and time are provided
    if (actualPickupDate && actualPickupTime) {
      // Parse the actual pickup date
      let parsedActualPickupDate;
      if (actualPickupDate.includes("T")) {
        parsedActualPickupDate = new Date(actualPickupDate);
      } else {
        const dateTimeString = `${actualPickupDate}T${actualPickupTime}:00`;
        parsedActualPickupDate = new Date(dateTimeString);
      }

      consignment.actualPickupDate = parsedActualPickupDate;
      consignment.actualPickupTime = actualPickupTime;
    }

    // Transit notes are always optional
    if (transitNotes) {
      consignment.transitNotes = transitNotes;
    }

    // Mark vehicle/driver as ON_TRIP
    if (consignment.vehicle?.vehicleId) {
      await Vehicle.findByIdAndUpdate(consignment.vehicle.vehicleId, {
        status: "ON_TRIP",
      });
    }
    if (consignment.vehicle?.driverId) {
      await Driver.findByIdAndUpdate(consignment.vehicle.driverId, {
        status: "ON_TRIP",
        currentVehicle: consignment.vehicle.vehicleId,
      });
    }

    console.log("In Transit update:", {
      hasActualPickup: !!(actualPickupDate && actualPickupTime),
      date: consignment.actualPickupDate,
      time: consignment.actualPickupTime,
      notes: transitNotes,
    });
  }

  await consignment.save();

  return sendResponse(res, 200, consignment, "Status updated successfully");
});
// Add this new function
const updatePaymentReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentReceiptDate } = req.body;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  const receiptDate = paymentReceiptDate
    ? new Date(paymentReceiptDate)
    : new Date();

  consignment.paymentReceiptDate = receiptDate;
  consignment.paymentReceiptStatus = true;
  consignment.updatedBy = req.user?._id || null;

  // ✅ If payment done and delivered, ensure vehicle/driver are freed
  if (consignment.status === "DELIVERED") {
    if (consignment.vehicle?.vehicleId) {
      const activeConsignments = await Consignment.find({
        "vehicle.vehicleId": consignment.vehicle.vehicleId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      if (activeConsignments.length === 0) {
        await Vehicle.findByIdAndUpdate(consignment.vehicle.vehicleId, {
          status: "AVAILABLE",
        });
      }
    }

    if (consignment.vehicle?.driverId) {
      const activeConsignments = await Consignment.find({
        "vehicle.driverId": consignment.vehicle.driverId,
        _id: { $ne: consignment._id },
        status: {
          $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
        },
        isDeleted: false,
      });

      if (activeConsignments.length === 0) {
        await Driver.findByIdAndUpdate(consignment.vehicle.driverId, {
          status: "AVAILABLE",
          currentVehicle: null,
        });
      }
    }
  }

  await consignment.save();

  return sendResponse(
    res,
    200,
    consignment,
    "Payment receipt updated successfully"
  );
});
// Assign vehicle to consignment
const assignVehicleToConsignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverId } = req.body;

  if (!vehicleId || !driverId) {
    throw throwApiError(400, "Please provide both vehicle and driver");
  }

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false })
    .populate("consignor.customerId")
    .populate("consignee.customerId");
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  const allowedStatuses = ["BOOKED", "ASSIGNED"];
  if (!allowedStatuses.includes(consignment.status)) {
    throw throwApiError(
      400,
      `Vehicle can only be assigned to consignments with status: ${allowedStatuses.join(
        ", "
      )}`
    );
  }

  // Check vehicle availability
  const vehicle = await Vehicle.findById(vehicleId);
  const driver = await Driver.findById(driverId);

  // Remove availability check - allow assigning busy vehicles/drivers
  if (!vehicle) {
    throw throwApiError(400, "Vehicle not found");
  }

  if (!driver) {
    throw throwApiError(400, "Driver not found");
  }

  // Update consignment
  consignment.vehicle = {
    vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    // Include additional vehicle details for challan & compliance
    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    insurancePolicyNo: vehicle.insurancePolicyNo,
    insuranceValidity: vehicle.insuranceValidity,
    driverId,
    driverName: driver.name,
    driverMobile: driver.mobile,
  };
  consignment.status = "ASSIGNED";
  consignment.updatedBy = req.user?._id || null;

  // Update vehicle and driver status
  // vehicle.status = "ON_TRIP";
  // driver.status = "ON_TRIP";
  // driver.currentVehicle = vehicleId;

  await Promise.all([consignment.save(), vehicle.save(), driver.save()]);

  // Send SMS to consignor
  // const smsMessage = `Dear ${consignment.consignor.name}, Your consignment ${consignment.consignmentNumber} is assigned. Vehicle: ${vehicle.vehicleNumber}, Driver: ${driver.name} (${driver.mobile}). - KVL Logistics`;
  // await sendSMS(consignment.consignor.mobile, smsMessage);

  console.log("=== EMAIL DEBUG ===");
  console.log("Consignor email:", consignment.consignor.email);
  console.log("Consignor name:", consignment.consignor.name);
  console.log("Full consignor object:", consignment.consignor);

  // Get email from consignor object directly
  const consignorEmail = consignment.consignor.email;
  console.log("Final consignor email:", consignorEmail);

  if (consignorEmail) {
    try {
      const emailMessage = `Dear ${consignment.consignor.name}, Your consignment ${consignment.consignmentNumber} is assigned. Vehicle: ${vehicle.vehicleNumber}, Driver: ${driver.name} (${driver.mobile}). - KVL Logistics`;
      console.log("Sending email to:", consignorEmail);
      console.log("Email message:", emailMessage);

      await sendEmail(consignorEmail, "Consignment Notification", emailMessage);
      console.log("Email sent successfully!");
    } catch (e) {
      console.warn("Email send failed (ignored):", e.message);
    }
  } else {
    console.log("No email address found for consignor");
  }
  console.log("=== END EMAIL DEBUG ===");

  return sendResponse(res, 200, consignment, "Vehicle assigned successfully");
});

// Add this function for public tracking
const publicTracking = asyncHandler(async (req, res) => {
  const { consignmentNumber } = req.params;

  const consignment = await Consignment.findOne({
    consignmentNumber: consignmentNumber.toUpperCase(),
    isDeleted: false,
  })
    .select(
      "consignmentNumber status bookingDate fromCity toCity deliveryDate pickupDate"
    )
    .lean();

  if (!consignment) {
    const error = throwApiError(404, "Consignment not found");
    throw error;
  }

  // Return limited info for public
  const publicInfo = {
    consignmentNumber: consignment.consignmentNumber,
    status: consignment.status,
    route: `${consignment.fromCity} → ${consignment.toCity}`,
    bookingDate: consignment.bookingDate,
    estimatedDelivery: consignment.pickupDate
      ? new Date(consignment.pickupDate.getTime() + 2 * 24 * 60 * 60 * 1000)
      : null,
    deliveryDate: consignment.deliveryDate,
  };

  return sendResponse(res, 200, publicInfo, "Tracking info fetched");
});

const getUnbilledConsignments = asyncHandler(async (req, res) => {
  const { customerId } = req.query;

  const query = {
    status: "DELIVERED",
    isDeleted: false,
    billedIn: { $exists: false },
  };

  if (customerId) {
    query.$or = [
      { "consignor.customerId": customerId },
      { "consignee.customerId": customerId },
    ];
  }

  const consignments = await Consignment.find(query)
    .populate("consignor.customerId", "name")
    .populate("consignee.customerId", "name")
    .sort({ deliveryDate: -1 });

  const totalValue = consignments.reduce((sum, c) => sum + c.grandTotal, 0);

  return sendResponse(
    res,
    200,
    {
      consignments,
      count: consignments.length,
      totalValue,
    },
    "Unbilled consignments fetched"
  );
});

// Schedule pickup for consignment
const schedulePickup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pickupDate, pickupTime, pickupInstructions } = req.body;

  if (!pickupDate || !pickupTime) {
    throw throwApiError(400, "Please provide pickup date and time");
  }

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false })
    .populate("consignor.customerId")
    .populate("consignee.customerId");
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  if (consignment.status !== "ASSIGNED") {
    throw throwApiError(
      400,
      "Can only schedule pickup for assigned consignments"
    );
  }

  // Parse the date properly
  let parsedPickupDate;
  if (pickupDate.includes("T")) {
    // If it's already a datetime string
    parsedPickupDate = new Date(pickupDate);
  } else {
    // If it's just a date, combine with time
    const dateTimeString = `${pickupDate}T${pickupTime}:00`;
    parsedPickupDate = new Date(dateTimeString);
  }

  console.log("Original pickupDate:", pickupDate);
  console.log("Original pickupTime:", pickupTime);
  console.log("Parsed pickupDate:", parsedPickupDate);

  consignment.pickupDate = parsedPickupDate;
  consignment.pickupTime = pickupTime;
  consignment.pickupInstructions = pickupInstructions;
  consignment.status = "SCHEDULED";
  consignment.updatedBy = req.user?._id || null;

  await consignment.save();

  // Send SMS with pickup details
  // const smsMessage = `Dear ${consignment.consignor.name}, Pickup scheduled for consignment ${consignment.consignmentNumber}. Date: ${new Date(pickupDate).toLocaleDateString()}, Time: ${pickupTime}. Driver: ${consignment.vehicle.driverName} (${consignment.vehicle.driverMobile}). - KVL Logistics`;
  // await sendSMS(consignment.consignor.mobile, smsMessage);

  console.log("=== PICKUP EMAIL DEBUG ===");
  console.log("Consignor email:", consignment.consignor.email);
  console.log("Consignor name:", consignment.consignor.name);
  console.log("Full consignor object:", consignment.consignor);

  // Get email from consignor object directly
  const consignorEmail = consignment.consignor.email;
  console.log("Final consignor email:", consignorEmail);

  if (consignorEmail) {
    try {
      const emailMessage = `Dear ${
        consignment.consignor.name
      }, Pickup scheduled for consignment ${
        consignment.consignmentNumber
      }. Date: ${new Date(
        pickupDate
      ).toLocaleDateString()}, Time: ${pickupTime}. Driver: ${
        consignment.vehicle.driverName
      } (${consignment.vehicle.driverMobile}). - KVL Logistics`;
      console.log("Sending pickup email to:", consignorEmail);
      console.log("Pickup email message:", emailMessage);
      await sendEmail(consignorEmail, "Consignment Notification", emailMessage);
      console.log("Pickup email sent successfully!");
    } catch (e) {
      console.warn("Pickup email send failed (ignored):", e.message);
    }
  } else {
    console.log("No email address found for consignor (pickup)");
  }
  console.log("=== END PICKUP EMAIL DEBUG ===");

  return sendResponse(res, 200, consignment, "Pickup scheduled successfully");
});

// Get consignment tracking details
const getConsignmentTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false })
    .select(
      "consignmentNumber status bookingDate pickupDate deliveryDate fromCity toCity vehicle"
    )
    .populate("vehicle.vehicleId", "vehicleNumber")
    .populate("vehicle.driverId", "name mobile");

  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  const trackingInfo = {
    consignmentNumber: consignment.consignmentNumber,
    currentStatus: consignment.status,
    route: `${consignment.fromCity} → ${consignment.toCity}`,
    timeline: [
      {
        status: "BOOKED",
        date: consignment.bookingDate,
        description: "Booking confirmed",
      },
    ],
  };

  // Add timeline events based on status
  if (consignment.vehicle?.vehicleId) {
    trackingInfo.timeline.push({
      status: "ASSIGNED",
      date: consignment.updatedAt,
      description: `Vehicle ${consignment.vehicle.vehicleNumber} assigned`,
    });
  }

  if (consignment.pickupDate) {
    trackingInfo.timeline.push({
      status: "SCHEDULED",
      date: consignment.pickupDate,
      description: `Pickup scheduled for ${consignment.pickupTime}`,
    });
  }

  if (
    ["IN_TRANSIT", "DELIVERED_UNCONFIRMED", "DELIVERED"].includes(
      consignment.status
    )
  ) {
    trackingInfo.timeline.push({
      status: "IN_TRANSIT",
      date: consignment.pickupDate,
      description: "Shipment in transit",
    });
  }

  if (consignment.deliveryDate) {
    trackingInfo.timeline.push({
      status: "DELIVERED",
      date: consignment.deliveryDate,
      description: "Shipment delivered successfully",
    });
  }

  return sendResponse(
    res,
    200,
    trackingInfo,
    "Tracking details fetched successfully"
  );
});

// Confirm delivery
const confirmDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveredBy } = req.body;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  if (consignment.status !== "IN_TRANSIT") {
    throw throwApiError(
      400,
      "Can only confirm delivery for in-transit consignments"
    );
  }

  consignment.status = "DELIVERED";
  consignment.deliveryDate = new Date();
  consignment.deliveryTime = new Date().toLocaleTimeString();
  consignment.deliveredBy = deliveredBy || consignment.vehicle.driverName;
  consignment.updatedBy = req.user?._id || null;

  // ✅ FREE UP VEHICLE AND DRIVER
  if (consignment.vehicle?.vehicleId) {
    // Check for other active consignments
    const activeConsignments = await Consignment.find({
      "vehicle.vehicleId": consignment.vehicle.vehicleId,
      _id: { $ne: consignment._id },
      status: {
        $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
      },
      isDeleted: false,
    });

    if (activeConsignments.length === 0) {
      await Vehicle.findByIdAndUpdate(consignment.vehicle.vehicleId, {
        status: "AVAILABLE",
      });
    }
  }

  if (consignment.vehicle?.driverId) {
    // Check for other active consignments
    const activeConsignments = await Consignment.find({
      "vehicle.driverId": consignment.vehicle.driverId,
      _id: { $ne: consignment._id },
      status: {
        $in: ["ASSIGNED", "SCHEDULED", "IN_TRANSIT", "DELIVERED_UNCONFIRMED"],
      },
      isDeleted: false,
    });

    if (activeConsignments.length === 0) {
      await Driver.findByIdAndUpdate(consignment.vehicle.driverId, {
        status: "AVAILABLE",
        currentVehicle: null,
      });
    }
  }

  await consignment.save();

  // Send notification...
  if (consignment.consignor.email) {
    try {
      await sendEmail(
        consignment.consignor.email,
        "Consignment Delivered",
        `Dear ${consignment.consignor.name}, Your consignment ${consignment.consignmentNumber} is successfully delivered.`
      );
    } catch (e) {
      console.warn("Email send failed (ignored):", e.message);
    }
  }

  return sendResponse(res, 200, consignment, "Delivery confirmed successfully");
});

// Assign driver to consignment (without vehicle)
const assignDriverToConsignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  if (!driverId) {
    throw throwApiError(400, "Please provide driver");
  }

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false });
  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  if (consignment.status !== "BOOKED") {
    throw throwApiError(
      400,
      "Driver can only be assigned to booked consignments"
    );
  }

  // Check driver availability
  const driver = await Driver.findById(driverId);
  if (!driver || driver.status !== "AVAILABLE") {
    throw throwApiError(400, "Driver is not available");
  }

  // Update consignment (assign driver only)
  consignment.vehicle = {
    ...(consignment.vehicle || {}),
    driverId,
    driverName: driver.name,
    driverMobile: driver.mobile,
  };
  consignment.status = "ASSIGNED";
  consignment.updatedBy = req.user?._id || null;

  // Update driver status
  driver.status = "ON_TRIP";
  driver.currentVehicle = consignment.vehicle?.vehicleId || null;

  await Promise.all([consignment.save(), driver.save()]);

  // Send SMS to consignor
  // const smsMessage = `Dear ${consignment.consignor.name}, Your consignment ${consignment.consignmentNumber} is assigned. Driver: ${driver.name} (${driver.mobile}). - KVL Logistics`;
  // await sendSMS(consignment.consignor.mobile, smsMessage);
  if (consignment.consignor.email) {
    try {
      await sendEmail(
        consignment.consignor.email,
        "Consignment Notification",
        `Dear ${consignment.consignor.name}, Your consignment ${consignment.consignmentNumber} is assigned. Driver: ${driver.name} (${driver.mobile}). - KVL Logistics`
      );
    } catch (e) {
      console.warn("Email send failed (ignored):", e.message);
    }
  }

  return sendResponse(res, 200, consignment, "Driver assigned successfully");
});

// Update existing consignments with email fields
const updateConsignmentsWithEmail = asyncHandler(async (req, res) => {
  console.log("Starting email update for existing consignments...");

  const consignments = await Consignment.find({ isDeleted: false });
  let updatedCount = 0;

  for (const consignment of consignments) {
    let needsUpdate = false;

    // Update consignor email if missing
    if (!consignment.consignor.email && consignment.consignor.customerId) {
      const customer = await Customer.findById(
        consignment.consignor.customerId
      );
      if (customer && customer.email) {
        consignment.consignor.email = customer.email;
        needsUpdate = true;
        console.log(
          `Updated consignor email for ${consignment.consignmentNumber}: ${customer.email}`
        );
      }
    }

    // Update consignee email if missing
    if (!consignment.consignee.email && consignment.consignee.customerId) {
      const customer = await Customer.findById(
        consignment.consignee.customerId
      );
      if (customer && customer.email) {
        consignment.consignee.email = customer.email;
        needsUpdate = true;
        console.log(
          `Updated consignee email for ${consignment.consignmentNumber}: ${customer.email}`
        );
      }
    }

    if (needsUpdate) {
      await consignment.save();
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} consignments with email fields`);

  return sendResponse(
    res,
    200,
    { updatedCount },
    `Updated ${updatedCount} consignments with email fields`
  );
});

// Generate PDF for consignment note
const generateConsignmentPDFController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const consignment = await Consignment.findOne({ _id: id, isDeleted: false })
    .populate("consignor.customerId")
    .populate("consignee.customerId");

  if (!consignment) {
    throw throwApiError(404, "Consignment not found");
  }

  try {
    // Use the new pdfkit-based generator, which streams to res
    await generateConsignmentPDF(consignment, res);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw throwApiError(500, "Failed to generate PDF");
  }
});

// Add in consignment.controller.js
const getConsignmentStatistics = asyncHandler(async (req, res) => {
  const stats = await Consignment.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$grandTotal" },
      },
    },
  ]);

  const paymentStats = await Consignment.aggregate([
    { $match: { isDeleted: false, status: "DELIVERED" } },
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalValue: { $sum: "$grandTotal" },
      },
    },
  ]);

  // New statistics for GST, Risk, and ToPay
  const gstStats = await Consignment.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$gstPayableBy",
        count: { $sum: 1 },
        totalValue: { $sum: "$grandTotal" },
      },
    },
  ]);

  const riskStats = await Consignment.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$risk",
        count: { $sum: 1 },
        totalValue: { $sum: "$grandTotal" },
      },
    },
  ]);

  const toPayStats = await Consignment.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$toPay",
        count: { $sum: 1 },
        totalValue: { $sum: "$grandTotal" },
      },
    },
  ]);

  return sendResponse(
    res,
    200,
    {
      statusWise: stats,
      paymentWise: paymentStats,
      gstPayableBy: gstStats,
      riskWise: riskStats,
      toPayWise: toPayStats,
    },
    "Statistics fetched"
  );
});

// Get consignments by GST Payable By
const getConsignmentsByGstPayableBy = asyncHandler(async (req, res) => {
  const { gstPayableBy } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validGstPayableBy = ["CONSIGNER", "CONSIGNEE", "TRANSPORTER"];
  if (!validGstPayableBy.includes(gstPayableBy)) {
    throw throwApiError(400, "Invalid GST Payable By value");
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({
    gstPayableBy,
    isDeleted: false,
  })
    .populate("vehicle.vehicleId", "vehicleNumber")
    .populate("vehicle.driverId", "name")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({
    gstPayableBy,
    isDeleted: false,
  });

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Get consignments by Risk
const getConsignmentsByRisk = asyncHandler(async (req, res) => {
  const { risk } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validRisk = ["OWNER_RISK", "CARRIER_RISK"];
  if (!validRisk.includes(risk)) {
    throw throwApiError(400, "Invalid Risk value");
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({
    risk,
    isDeleted: false,
  })
    .populate("vehicle.vehicleId", "vehicleNumber")
    .populate("vehicle.driverId", "name")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({
    risk,
    isDeleted: false,
  });

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

// Get consignments by To Pay
const getConsignmentsByToPay = asyncHandler(async (req, res) => {
  const { toPay } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validToPay = ["TO-PAY", "TBB", "PAID"];
  if (!validToPay.includes(toPay)) {
    throw throwApiError(400, "Invalid To Pay value");
  }

  const skip = (page - 1) * limit;

  const consignments = await Consignment.find({
    toPay,
    isDeleted: false,
  })
    .populate("vehicle.vehicleId", "vehicleNumber")
    .populate("vehicle.driverId", "name")
    .sort({ bookingDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Consignment.countDocuments({
    toPay,
    isDeleted: false,
  });

  return sendResponse(
    res,
    200,
    {
      consignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Consignments fetched successfully"
  );
});

export {
  createConsignment,
  getAllConsignments,
  getConsignmentById,
  updateConsignment,
  deleteConsignment,
  searchConsignments,
  getConsignmentsByStatus,
  getConsignmentsByCustomer,
  getConsignmentsByDateRange,
  updateConsignmentStatus,
  assignVehicleToConsignment,
  schedulePickup,
  getConsignmentTracking,
  confirmDelivery,
  assignDriverToConsignment,
  updateConsignmentsWithEmail,
  updatePaymentReceipt,
  generateConsignmentPDFController,
  publicTracking,
  getUnbilledConsignments,
  getConsignmentStatistics,
  getConsignmentsByGstPayableBy,
  getConsignmentsByRisk,
  getConsignmentsByToPay,
};
