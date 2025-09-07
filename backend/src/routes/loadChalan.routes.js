import { Router } from "express";
import {
  createLoadChalan,
  getAllLoadChalans,
  getLoadChalanById,
  updateLoadChalanStatus,
  updateLoadChalan,
  deleteLoadChalan,
  getLoadChalanStats,
  generateLoadChalanPDFController
} from "../controllers/loadChalan.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Create new load chalan
router.post("/", createLoadChalan);

// Get all load chalans with filters and pagination
router.get("/", getAllLoadChalans);

// Get load chalan statistics
router.get("/stats", getLoadChalanStats);

// Get single load chalan by ID
router.get("/:id", getLoadChalanById);

// Generate PDF for load chalan
router.get("/:id/pdf", generateLoadChalanPDFController);

// Update load chalan status
router.patch("/:id/status", updateLoadChalanStatus);

// Update load chalan details
router.put("/:id", updateLoadChalan);

// Delete load chalan
router.delete("/:id", deleteLoadChalan);

export default router;
