// routes/consignment.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import * as consignmentController from "../controllers/consignment.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);

// Public routes (no auth needed)
router.get(
  "/tracking/:consignmentNumber",
  consignmentController.publicTracking
);
router.get("/:id/pdf", consignmentController.generateConsignmentPDFController);

// Protected routes
router.use(verifyJWT);

// IMPORTANT: Specific routes FIRST (before :id routes)
router.get("/search", consignmentController.searchConsignments);
router.get("/status/:status", consignmentController.getConsignmentsByStatus);
router.get(
  "/customer/:customerId",
  consignmentController.getConsignmentsByCustomer
);
router.get("/date-range", consignmentController.getConsignmentsByDateRange);
router.post(
  "/update-email-fields",
  consignmentController.updateConsignmentsWithEmail
);
router.get(
  "/statistics",
  verifyJWT,
  consignmentController.getConsignmentStatistics
);

// Main CRUD operations
router
  .route("/")
  .get(consignmentController.getAllConsignments)
  .post(consignmentController.createConsignment);

// ID-specific actions (should come AFTER all other specific routes)
router.get("/:id/tracking", consignmentController.getConsignmentTracking);
router.patch("/:id/status", consignmentController.updateConsignmentStatus);
router.post(
  "/:id/assign-vehicle",
  consignmentController.assignVehicleToConsignment
);
router.post("/:id/schedule-pickup", consignmentController.schedulePickup);
router.post("/:id/confirm-delivery", consignmentController.confirmDelivery);
router.post(
  "/:id/assign-driver",
  consignmentController.assignDriverToConsignment
);

// Generic ID routes (should be LAST)
router
  .route("/:id")
  .get(consignmentController.getConsignmentById)
  .put(consignmentController.updateConsignment)
  .delete(consignmentController.deleteConsignment);

export default router;
