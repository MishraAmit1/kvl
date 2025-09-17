import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    vehicleType: {
      type: String,
      required: true,
      trim: true,
      enum: {
        values: ["TRUCK", "VAN", "TEMPO", "PICKUP", "TRAILER", "CONTAINER"],
        message:
          "Vehicle type must be one of: TRUCK, VAN, TEMPO, PICKUP, TRAILER, CONTAINER",
      },
    },

    // Owner Details
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerMobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    ownerAadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },

    ownerAddress: {
      type: String,
      required: true,
      trim: true,
    },

    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    insurancePolicyNo: {
      type: String,
      trim: true,
      uppercase: true,
    },

    insuranceValidity: {
      type: Date,
    },

    // Status & Active Flag
    status: {
      type: String,
      enum: {
        values: ["AVAILABLE", "ON_TRIP", "MAINTENANCE"],
        message: "Status must be one of: AVAILABLE, ON_TRIP, MAINTENANCE",
      },
      default: "AVAILABLE",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for vehicle number (unique constraint handled by schema)
vehicleSchema.index({ vehicleNumber: 1 }, { unique: true });

// Text index for search functionality
vehicleSchema.index({
  vehicleNumber: "text",
  vehicleType: "text",
  ownerName: "text",
});

// Compound index for status and isActive for efficient queries
vehicleSchema.index({ status: 1, isActive: 1 });

// Index for owner mobile number for quick lookups
vehicleSchema.index({ ownerMobileNumber: 1 });

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
