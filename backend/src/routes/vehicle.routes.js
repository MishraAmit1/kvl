import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  getVehiclesByType,
  getVehiclesByStatus,
  getAvailableVehicles,
} from "../controllers/vehicle.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Vehicle routes
router
  .route("/")
  .get(getAllVehicles) // Get all vehicles
  .post(createVehicle); // Create new vehicle
// Search vehicles
router.get("/search", searchVehicles); // Search vehicles
router
  .route("/:id")
  .get(getVehicleById) // Get vehicle by ID
  .put(updateVehicle) // Update vehicle
  .delete(deleteVehicle); // Delete vehicle

// Get vehicles by type
router.get("/type/:vehicleType", getVehiclesByType); // Get vehicles by type (TRUCK/VAN/TEMPO/etc)

// Get vehicles by status
router.get("/status/:status", getVehiclesByStatus); // Get vehicles by status (AVAILABLE/ON_TRIP/MAINTENANCE)

// Get available vehicles
router.get("/available", getAvailableVehicles); // Get all available vehicles

export default router;
