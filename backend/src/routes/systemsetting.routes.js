import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generalRateLimiter } from "../middlewares/rateLimiting.middleware.js";
import {
  createSystemSetting,
  getAllSystemSettings,
  getSystemSettingById,
  updateSystemSetting,
  deleteSystemSetting,
  getSystemSettingByKey,
  updateSystemSettingByKey,
  getSystemSettingsByCategory,
  getAllCategories,
  bulkUpdateSystemSettings,
  resetSystemSettingsToDefault,
  exportSystemSettings,
  importSystemSettings,
} from "../controllers/systemsetting.controller.js";

const router = express.Router();

// Apply general rate limiting
router.use(generalRateLimiter);

// Apply JWT verification to all routes
router.use(verifyJWT);

// System Settings routes
router
  .route("/")
  .get(getAllSystemSettings) // Get all system settings
  .post(createSystemSetting); // Create new system setting

router
  .route("/:id")
  .get(getSystemSettingById) // Get system setting by ID
  .put(updateSystemSetting) // Update system setting
  .delete(deleteSystemSetting); // Delete system setting

// Get setting by key
router.get("/key/:key", getSystemSettingByKey); // Get system setting by key

// Update setting by key
router.put("/key/:key", updateSystemSettingByKey); // Update system setting by key

// Get settings by category
router.get("/category/:category", getSystemSettingsByCategory); // Get settings by category

// Get all categories
router.get("/categories", getAllCategories); // Get all setting categories

// Bulk update settings
router.put("/bulk-update", bulkUpdateSystemSettings); // Bulk update multiple settings

// Reset settings to default
router.post("/reset-defaults", resetSystemSettingsToDefault); // Reset all settings to default values

// Export settings
router.get("/export", exportSystemSettings); // Export all settings

// Import settings
router.post("/import", importSystemSettings); // Import settings from file

export default router;
 