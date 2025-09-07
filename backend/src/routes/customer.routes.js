import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomersByType,
  getCustomersByStatus,
} from "../controllers/customer.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);

// Apply JWT verification to all routes
router.use(verifyJWT);

// Customer routes
router
  .route("/")
  .get(getAllCustomers) // Get all customers
  .post(createCustomer); // Create new customer
// Search customers
router.get("/search", searchCustomers); // Search customers
router
  .route("/:id")
  .get(getCustomerById) // Get customer by ID
  .put(updateCustomer) // Update customer
  .delete(deleteCustomer); // Delete customer

// Get customers by type
router.get("/type/:customerType", getCustomersByType); // Get customers by type (CONSIGNOR/CONSIGNEE/BOTH)

// Get active/inactive customers
router.get("/status/:status", getCustomersByStatus); // Get customers by status (active/inactive)

export default router;
