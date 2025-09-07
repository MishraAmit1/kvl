import { SystemSetting } from "../models/systemsetting.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create new system setting
const createSystemSetting = asyncHandler(async (req, res) => {
  const { key, value, category, description, dataType } = req.body;

  // Check if setting with same key already exists
  const existingSetting = await SystemSetting.findOne({ key });
  if (existingSetting) {
    throw new ApiError(400, "System setting with this key already exists");
  }

  const systemSetting = await SystemSetting.create({
    key,
    value,
    category,
    description,
    dataType,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, systemSetting, "System setting created successfully")
    );
});

// Get all system settings with pagination and filters
const getAllSystemSettings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category } = req.query;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { key: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // Add category filter
  if (category) {
    query.category = category;
  }

  const skip = (page - 1) * limit;

  const systemSettings = await SystemSetting.find(query)
    .sort({ category: 1, key: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await SystemSetting.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      systemSettings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get system setting by ID
const getSystemSettingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const systemSetting = await SystemSetting.findById(id);
  if (!systemSetting) {
    throw new ApiError(404, "System setting not found");
  }

  return res.status(200).json(new ApiResponse(200, systemSetting));
});

// Update system setting
const updateSystemSetting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const systemSetting = await SystemSetting.findById(id);
  if (!systemSetting) {
    throw new ApiError(404, "System setting not found");
  }

  // Check for unique constraint if key is being updated
  if (updateData.key && updateData.key !== systemSetting.key) {
    const existingSetting = await SystemSetting.findOne({
      key: updateData.key,
    });
    if (existingSetting) {
      throw new ApiError(400, "System setting with this key already exists");
    }
  }

  const updatedSetting = await SystemSetting.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedSetting,
        "System setting updated successfully"
      )
    );
});

// Delete system setting
const deleteSystemSetting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const systemSetting = await SystemSetting.findById(id);
  if (!systemSetting) {
    throw new ApiError(404, "System setting not found");
  }

  await SystemSetting.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "System setting deleted successfully"));
});

// Get setting by key
const getSystemSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const systemSetting = await SystemSetting.findOne({ key });
  if (!systemSetting) {
    throw new ApiError(404, "System setting not found");
  }

  return res.status(200).json(new ApiResponse(200, systemSetting));
});

// Update setting by key
const updateSystemSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  const systemSetting = await SystemSetting.findOne({ key });
  if (!systemSetting) {
    throw new ApiError(404, "System setting not found");
  }

  const updateData = {};
  if (value !== undefined) updateData.value = value;
  if (description !== undefined) updateData.description = description;

  const updatedSetting = await SystemSetting.findOneAndUpdate(
    { key },
    updateData,
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedSetting,
        "System setting updated successfully"
      )
    );
});

// Get settings by category
const getSystemSettingsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const systemSettings = await SystemSetting.find({ category })
    .sort({ key: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await SystemSetting.countDocuments({ category });

  return res.status(200).json(
    new ApiResponse(200, {
      systemSettings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get all categories
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await SystemSetting.distinct("category");

  return res.status(200).json(new ApiResponse(200, categories));
});

// Bulk update settings
const bulkUpdateSystemSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!Array.isArray(settings) || settings.length === 0) {
    throw new ApiError(400, "Settings array is required");
  }

  const updatePromises = settings.map(async (setting) => {
    const { key, value, description } = setting;

    const existingSetting = await SystemSetting.findOne({ key });
    if (!existingSetting) {
      throw new ApiError(404, `System setting with key '${key}' not found`);
    }

    const updateData = {};
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;

    return SystemSetting.findOneAndUpdate({ key }, updateData, {
      new: true,
      runValidators: true,
    });
  });

  const updatedSettings = await Promise.all(updatePromises);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedSettings,
        "System settings updated successfully"
      )
    );
});

// Reset settings to default
const resetSystemSettingsToDefault = asyncHandler(async (req, res) => {
  // Define default settings
  const defaultSettings = [
    {
      key: "company_name",
      value: "KVL Transport",
      category: "company",
      description: "Company name",
      dataType: "string",
    },
    {
      key: "company_address",
      value: "Default Address",
      category: "company",
      description: "Company address",
      dataType: "string",
    },
    {
      key: "company_phone",
      value: "1234567890",
      category: "company",
      description: "Company phone number",
      dataType: "string",
    },
    {
      key: "company_email",
      value: "info@kvltransport.com",
      category: "company",
      description: "Company email",
      dataType: "string",
    },
    {
      key: "currency",
      value: "INR",
      category: "billing",
      description: "Default currency",
      dataType: "string",
    },
    {
      key: "tax_rate",
      value: "18",
      category: "billing",
      description: "Default tax rate percentage",
      dataType: "number",
    },
    {
      key: "default_weight_unit",
      value: "KG",
      category: "consignment",
      description: "Default weight unit",
      dataType: "string",
    },
    {
      key: "auto_generate_bill_number",
      value: "true",
      category: "billing",
      description: "Auto generate bill numbers",
      dataType: "boolean",
    },
  ];

  // Clear existing settings
  await SystemSetting.deleteMany({});

  // Insert default settings
  const createdSettings = await SystemSetting.insertMany(defaultSettings);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        createdSettings,
        "System settings reset to default successfully"
      )
    );
});

// Export settings
const exportSystemSettings = asyncHandler(async (req, res) => {
  const systemSettings = await SystemSetting.find({}).sort({
    category: 1,
    key: 1,
  });

  const exportData = {
    exportDate: new Date(),
    totalSettings: systemSettings.length,
    settings: systemSettings,
  };

  return res.status(200).json(new ApiResponse(200, exportData));
});

// Import settings
const importSystemSettings = asyncHandler(async (req, res) => {
  const { settings, overwrite = false } = req.body;

  if (!Array.isArray(settings) || settings.length === 0) {
    throw new ApiError(400, "Settings array is required");
  }

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const setting of settings) {
    try {
      const { key, value, category, description, dataType } = setting;

      if (!key || !value) {
        results.errors.push(`Invalid setting: missing key or value`);
        continue;
      }

      const existingSetting = await SystemSetting.findOne({ key });

      if (existingSetting) {
        if (overwrite) {
          await SystemSetting.findOneAndUpdate(
            { key },
            { value, category, description, dataType },
            { new: true, runValidators: true }
          );
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await SystemSetting.create({
          key,
          value,
          category,
          description,
          dataType,
        });
        results.created++;
      }
    } catch (error) {
      results.errors.push(
        `Error processing setting ${setting.key}: ${error.message}`
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, results, "System settings import completed"));
});

export {
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
};
