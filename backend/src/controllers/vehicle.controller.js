import { Vehicle } from "../models/vehicle.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create new vehicle
const createVehicle = asyncHandler(async (req, res) => {
  const {
    vehicleNumber,
    vehicleType,
    ownerName,
    ownerMobileNumber,
    ownerAadhaarNumber,
    ownerAddress,
    engineNumber,
    chassisNumber,
    insurancePolicyNo,
    insuranceValidity,
  } = req.body;

  // Check if vehicle with same number already exists
  const existingVehicle = await Vehicle.findOne({ vehicleNumber });
  if (existingVehicle) {
    throw throwApiError(400, "Vehicle with this number already exists");
  }

  const vehicle = await Vehicle.create({
    vehicleNumber,
    vehicleType,
    ownerName,
    ownerMobileNumber,
    ownerAadhaarNumber,
    ownerAddress,
    engineNumber,
    chassisNumber,
    insurancePolicyNo,
    insuranceValidity,
  });

  return sendResponse(res, 201, vehicle, "Vehicle created successfully");
});

// Get all vehicles with pagination and filters
const getAllVehicles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, vehicleType, status } = req.query;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { vehicleNumber: { $regex: search, $options: "i" } },
      { vehicleType: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
      { ownerMobileNumber: { $regex: search, $options: "i" } },
      { engineNumber: { $regex: search, $options: "i" } },
      { chassisNumber: { $regex: search, $options: "i" } },
      { insurancePolicyNo: { $regex: search, $options: "i" } },
    ];
  }

  // Add vehicle type filter
  if (vehicleType) {
    query.vehicleType = vehicleType;
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const vehicles = await Vehicle.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments(query);

  return sendResponse(
    res,
    200,
    {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Vehicles fetched successfully"
  );
});

// Get vehicle by ID
const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw throwApiError(404, "Vehicle not found");
  }

  return sendResponse(res, 200, vehicle, "Vehicle fetched successfully");
});

// Update vehicle
const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw throwApiError(404, "Vehicle not found");
  }

  // Check for unique constraint if vehicle number is being updated
  if (
    updateData.vehicleNumber &&
    updateData.vehicleNumber !== vehicle.vehicleNumber
  ) {
    const existingVehicle = await Vehicle.findOne({
      vehicleNumber: updateData.vehicleNumber,
    });
    if (existingVehicle) {
      throw throwApiError(400, "Vehicle with this number already exists");
    }
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return sendResponse(res, 200, updatedVehicle, "Vehicle updated successfully");
});

// Delete vehicle
const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw throwApiError(404, "Vehicle not found");
  }

  await Vehicle.findByIdAndDelete(id);

  return sendResponse(res, 200, null, "Vehicle deleted successfully");
});

// Search vehicles
const searchVehicles = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw throwApiError(400, "Search query is required");
  }

  const vehicles = await Vehicle.find({
    $or: [
      { vehicleNumber: { $regex: q, $options: "i" } },
      { vehicleType: { $regex: q, $options: "i" } },
      { ownerName: { $regex: q, $options: "i" } },
      { ownerMobileNumber: { $regex: q, $options: "i" } },
      { engineNumber: { $regex: q, $options: "i" } },
      { chassisNumber: { $regex: q, $options: "i" } },
      { insurancePolicyNo: { $regex: q, $options: "i" } },
    ],
  })
    .limit(parseInt(limit))
    .sort({ vehicleNumber: 1 });

  return sendResponse(res, 200, vehicles, "Vehicles fetched successfully");
});

// Get vehicles by type
const getVehiclesByType = asyncHandler(async (req, res) => {
  const { vehicleType } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validTypes = [
    "TRUCK",
    "VAN",
    "TEMPO",
    "PICKUP",
    "TRAILER",
    "CONTAINER",
  ];
  if (!validTypes.includes(vehicleType)) {
    throw throwApiError(400, "Invalid vehicle type");
  }

  const skip = (page - 1) * limit;

  const vehicles = await Vehicle.find({ vehicleType })
    .sort({ vehicleNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments({ vehicleType });

  return sendResponse(
    res,
    200,
    {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Vehicles fetched successfully"
  );
});

// Get vehicles by status
const getVehiclesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validStatuses = ["AVAILABLE", "ON_TRIP", "MAINTENANCE"];
  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const skip = (page - 1) * limit;

  const vehicles = await Vehicle.find({ status })
    .sort({ vehicleNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments({ status });

  return sendResponse(
    res,
    200,
    {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Vehicles fetched successfully"
  );
});

// Get available vehicles
const getAvailableVehicles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const vehicles = await Vehicle.find({
    status: "AVAILABLE",
    isActive: true,
  })
    .sort({ vehicleNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments({
    status: "AVAILABLE",
    isActive: true,
  });

  return sendResponse(
    res,
    200,
    {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Vehicles fetched successfully"
  );
});

// Get vehicles by owner mobile number
const getVehiclesByOwnerMobile = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const vehicles = await Vehicle.find({ ownerMobileNumber: mobileNumber })
    .sort({ vehicleNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments({
    ownerMobileNumber: mobileNumber,
  });

  return sendResponse(
    res,
    200,
    {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Vehicles fetched successfully"
  );
});

export {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  getVehiclesByType,
  getVehiclesByStatus,
  getAvailableVehicles,
  getVehiclesByOwnerMobile,
};
