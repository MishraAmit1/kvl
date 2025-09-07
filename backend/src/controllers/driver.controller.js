import { Driver } from "../models/driver.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create new driver
const createDriver = asyncHandler(async (req, res) => {
  const { name, mobile, email, licenseNumber, currentLocation } = req.body;

  // Check if driver with same mobile already exists
  const existingDriver = await Driver.findOne({ mobile });
  if (existingDriver) {
    throw throwApiError(400, "Driver with this mobile number already exists");
  }

  // Check if driver with same email exists (if email provided)
  if (email) {
    const existingEmailDriver = await Driver.findOne({ email });
    if (existingEmailDriver) {
      throw throwApiError(400, "Driver with this email already exists");
    }
  }

  // Check if driver with same license exists (if license provided)
  if (licenseNumber) {
    const existingLicenseDriver = await Driver.findOne({ licenseNumber });
    if (existingLicenseDriver) {
      throw throwApiError(
        400,
        "Driver with this license number already exists"
      );
    }
  }

  const driver = await Driver.create({
    name,
    mobile,
    email,
    licenseNumber,
    currentLocation,
  });
  return sendResponse(res, 201, driver, "Driver created successfully");
});

// Get all drivers with pagination and filters
const getAllDrivers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { licenseNumber: { $regex: search, $options: "i" } },
    ];
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const drivers = await Driver.find(query)
    .populate("currentVehicle", "vehicleNumber vehicleType")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments(query);
  return sendResponse(res, 200, {
    drivers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get driver by ID
const getDriverById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id).populate(
    "currentVehicle",
    "vehicleNumber vehicleType lengthFeet capacityValue capacityUnit"
  );
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }
  return sendResponse(res, 200, driver);
});

// Update driver
const updateDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const driver = await Driver.findById(id);
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }

  // Check for unique constraints if mobile/email/license is being updated
  if (updateData.mobile && updateData.mobile !== driver.mobile) {
    const existingDriver = await Driver.findOne({ mobile: updateData.mobile });
    if (existingDriver) {
      throw throwApiError(400, "Driver with this mobile number already exists");
    }
  }

  if (updateData.email && updateData.email !== driver.email) {
    const existingDriver = await Driver.findOne({ email: updateData.email });
    if (existingDriver) {
      throw throwApiError(400, "Driver with this email already exists");
    }
  }

  if (
    updateData.licenseNumber &&
    updateData.licenseNumber !== driver.licenseNumber
  ) {
    const existingDriver = await Driver.findOne({
      licenseNumber: updateData.licenseNumber,
    });
    if (existingDriver) {
      throw throwApiError(
        400,
        "Driver with this license number already exists"
      );
    }
  }

  const updatedDriver = await Driver.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("currentVehicle", "vehicleNumber vehicleType");
  return sendResponse(res, 200, updatedDriver, "Driver updated successfully");
});

// Delete driver
const deleteDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id);
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }

  await Driver.findByIdAndDelete(id);
  return sendResponse(res, 200, null, "Driver deleted successfully");
});

// Search drivers
const searchDrivers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw throwApiError(400, "Search query is required");
  }

  const drivers = await Driver.find({
    $or: [
      { name: { $regex: q, $options: "i" } },
      { mobile: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { licenseNumber: { $regex: q, $options: "i" } },
    ],
  })
    .populate("currentVehicle", "vehicleNumber vehicleType")
    .limit(parseInt(limit))
    .sort({ name: 1 });
  return sendResponse(res, 200, drivers);
});

// Get drivers by status
const getDriversByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validStatuses = ["AVAILABLE", "ON_TRIP"];
  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const skip = (page - 1) * limit;

  const drivers = await Driver.find({ status })
    .populate("currentVehicle", "vehicleNumber vehicleType")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments({ status });
  return sendResponse(res, 200, {
    drivers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get available drivers
const getAvailableDrivers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const drivers = await Driver.find({
    status: "AVAILABLE",
    isActive: true,
  })
    .populate("currentVehicle", "vehicleNumber vehicleType")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments({
    status: "AVAILABLE",
    isActive: true,
  });
  return sendResponse(res, 200, {
    drivers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Assign vehicle to driver
const assignVehicleToDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicleId } = req.body;

  const driver = await Driver.findById(id);
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw throwApiError(404, "Vehicle not found");
  }

  if (vehicle.status !== "AVAILABLE") {
    throw throwApiError(400, "Vehicle is not available for assignment");
  }

  // Update driver's current vehicle
  driver.currentVehicle = vehicleId;
  await driver.save();

  // Update vehicle status to ON_TRIP
  vehicle.status = "ON_TRIP";
  await vehicle.save();

  const updatedDriver = await Driver.findById(id).populate(
    "currentVehicle",
    "vehicleNumber vehicleType"
  );
  return sendResponse(
    res,
    200,
    updatedDriver,
    "Vehicle assigned to driver successfully"
  );
});

// Remove vehicle from driver
const removeVehicleFromDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id);
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }

  if (!driver.currentVehicle) {
    throw throwApiError(400, "Driver has no vehicle assigned");
  }

  // Update vehicle status back to AVAILABLE
  await Vehicle.findByIdAndUpdate(driver.currentVehicle, {
    status: "AVAILABLE",
  });

  // Remove vehicle from driver
  driver.currentVehicle = null;
  await driver.save();
  return sendResponse(
    res,
    200,
    driver,
    "Vehicle removed from driver successfully"
  );
});

// Get driver's current vehicle
const getDriverVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id).populate(
    "currentVehicle",
    "vehicleNumber vehicleType lengthFeet capacityValue capacityUnit status"
  );
  if (!driver) {
    throw throwApiError(404, "Driver not found");
  }
  return sendResponse(res, 200, driver.currentVehicle);
});

export {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  searchDrivers,
  getDriversByStatus,
  getAvailableDrivers,
  assignVehicleToDriver,
  removeVehicleFromDriver,
  getDriverVehicle,
};
