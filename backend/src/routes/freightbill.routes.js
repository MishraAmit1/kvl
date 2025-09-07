// routes/freightbill.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import {
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
} from "../controllers/freightbill.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);
router.get("/:id/pdf", generateFreightBillPDFController);

// Protected routes
router.use(verifyJWT);

// FIXED: Specific routes FIRST (before generic :id routes)
router.get("/search", searchFreightBills);
router.get("/statistics", getFreightBillStatistics);
router.get("/pending-payments", getPendingPayments);
router.get("/date-range", getFreightBillsByDateRange);

// Customer specific routes
router.get(
  "/customers/:customerId/unbilled-consignments",
  getUnbilledConsignments
);
router.get("/customer/:customerId", getFreightBillsByCustomer);

// Status specific routes
router.get("/status/:status", getFreightBillsByStatus);

// Main CRUD operations
router.route("/").get(getAllFreightBills).post(createFreightBill);

// ID specific routes (should come AFTER all other specific routes)
router.post("/:id/send-email", sendFreightBillEmail);
router.patch("/:id/status", updateFreightBillStatus);
router.post("/:id/mark-paid", markFreightBillAsPaid);

router
  .route("/:id")
  .get(getFreightBillById)
  .put(updateFreightBill)
  .delete(deleteFreightBill);

export default router;
