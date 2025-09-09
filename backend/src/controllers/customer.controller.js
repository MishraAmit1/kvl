import { Customer } from "../models/customer.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateCustomerInput } from "../validation/customerValidation.js";
// Create new customer
// Create new customer
const createCustomer = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    city,
    state,
    pincode,
    mobile,
    email,
    gstNumber,
    panNumber,
    customerType,
  } = req.body;

  // Empty strings ko undefined me convert karo
  const cleanedData = {
    name,
    address: address || undefined,
    city,
    state,
    pincode,
    mobile,
    email: email || undefined,
    gstNumber: gstNumber || undefined,
    panNumber: panNumber || undefined,
    customerType: customerType || "BOTH",
  };

  const validationErrors = validateCustomerInput(cleanedData);

  if (validationErrors.length > 0) {
    throw throwApiError(400, validationErrors.join(", "));
  }

  // Check if customer already exists - GST check only if provided
  const orConditions = [{ mobile }];
  if (gstNumber) {
    orConditions.push({ gstNumber: gstNumber.toUpperCase() });
  }

  const existingCustomer = await Customer.findOne({ $or: orConditions });

  if (existingCustomer) {
    throw throwApiError(
      409,
      "Customer with this mobile number or GST number already exists"
    );
  }

  // Check if customer with same email exists (if email provided)
  if (email) {
    const existingEmailCustomer = await Customer.findOne({ email });
    if (existingEmailCustomer) {
      throw throwApiError(400, "Customer with this email already exists");
    }
  }

  try {
    const customer = await Customer.create(cleanedData);
    return sendResponse(res, 201, customer, "Customer created successfully");
  } catch (error) {
    console.error("Error creating customer:", error);

    // MongoDB duplicate key error handle karo
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw throwApiError(400, `Customer with this ${field} already exists`);
    }

    // Validation errors handle karo
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      throw throwApiError(400, messages.join(", "));
    }

    throw throwApiError(500, "Failed to create customer");
  }
});

// Get all customers with pagination and filters
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, customerType, status } = req.query;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ];
  }

  // Add customer type filter
  if (customerType) {
    query.customerType = customerType;
  }

  // Add status filter
  if (status !== undefined) {
    query.isActive = status === "active";
  }

  const skip = (page - 1) * limit;

  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments(query);
  return sendResponse(
    res,
    200,
    {
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Customers fetched successfully"
  );
});

// Get customer by ID
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findById(id);
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }

  return sendResponse(res, 200, customer, "Customer fetched successfully");
});

// Update customer
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const customer = await Customer.findById(id);
  if (!customer || !customer.isActive) {
    throw throwApiError(404, "Customer not found");
  }

  // Check for unique constraints if mobile/email/gst is being updated
  if (updateData.mobile && updateData.mobile !== customer.mobile) {
    const existingCustomer = await Customer.findOne({
      mobile: updateData.mobile,
    });
    if (existingCustomer) {
      throw throwApiError(
        400,
        "Customer with this mobile number already exists"
      );
    }
  }

  if (updateData.email && updateData.email !== customer.email) {
    const existingCustomer = await Customer.findOne({
      email: updateData.email,
    });
    if (existingCustomer) {
      throw throwApiError(400, "Customer with this email already exists");
    }
  }

  if (updateData.gstNumber && updateData.gstNumber !== customer.gstNumber) {
    const existingCustomer = await Customer.findOne({
      gstNumber: updateData.gstNumber,
    });
    if (existingCustomer) {
      throw throwApiError(400, "Customer with this GST number already exists");
    }
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return sendResponse(
    res,
    200,
    updatedCustomer,
    "Customer updated successfully"
  );
});

// Delete customer
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findById(id);
  if (!customer) {
    throw throwApiError(404, "Customer not found");
  }

  await Customer.findByIdAndDelete(id);

  return sendResponse(res, 200, null, "Customer deleted successfully");
});

// Search customers
const searchCustomers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw throwApiError(400, "Search query is required");
  }

  const customers = await Customer.find({
    $or: [
      { name: { $regex: q, $options: "i" } },
      { mobile: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
      { gstNumber: { $regex: q, $options: "i" } },
    ],
  })
    .limit(parseInt(limit))
    .sort({ name: 1 });

  return sendResponse(res, 200, customers, "Customers fetched successfully");
});

// Get customers by type
const getCustomersByType = asyncHandler(async (req, res) => {
  const { customerType } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validTypes = ["CONSIGNOR", "CONSIGNEE", "BOTH"];
  if (!validTypes.includes(customerType)) {
    throw throwApiError(400, "Invalid customer type");
  }

  const skip = (page - 1) * limit;

  const customers = await Customer.find({ customerType })
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments({ customerType });

  return sendResponse(
    res,
    200,
    {
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Customers fetched successfully"
  );
});

// Get customers by status
const getCustomersByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(status)) {
    throw throwApiError(400, "Invalid status");
  }

  const isActive = status === "active";
  const skip = (page - 1) * limit;

  const customers = await Customer.find({ isActive })
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments({ isActive });

  return sendResponse(
    res,
    200,
    {
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    "Customers fetched successfully"
  );
});

export {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomersByType,
  getCustomersByStatus,
};
