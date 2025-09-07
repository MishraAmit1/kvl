import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import {
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
} from "../controllers/driver.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Driver routes
router
  .route("/")
  .get(getAllDrivers) // Get all drivers
  .post(createDriver); // Create new driver

// Search drivers
router.get("/search", searchDrivers); // Search drivers
router
  .route("/:id")
  .get(getDriverById) // Get driver by ID
  .put(updateDriver) // Update driver
  .delete(deleteDriver); // Delete driver

// Get drivers by status
router.get("/status/:status", getDriversByStatus); // Get drivers by status (AVAILABLE/ON_TRIP)

// Get available drivers
router.get("/available", getAvailableDrivers); // Get all available drivers

// Assign vehicle to driver
router.post("/:id/assign-vehicle", assignVehicleToDriver); // Assign vehicle to driver

// Remove vehicle from driver
router.post("/:id/remove-vehicle", removeVehicleFromDriver); // Remove vehicle from driver

// Get driver's current vehicle
router.get("/:id/vehicle", getDriverVehicle); // Get driver's current vehicle

export default router;
