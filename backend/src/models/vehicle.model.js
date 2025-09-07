import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
      validate: {
        validator: function (v) {
          return /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/.test(v);
        },
        message: "Vehicle number must be in format: KA01AB1234",
      },
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

    lengthFeet: {
      type: Number,
      required: true,
      enum: {
        values: [14, 19, 20, 22, 24, 32, 40],
        message: "Length must be one of: 14, 19, 20, 22, 24, 32, 40 feet",
      },
    },

    flooringType: {
      type: String,
      enum: {
        values: ["YES", "NO"],
        message: "Flooring type must be either YES or NO",
      },
      default: "YES",
    },

    capacityValue: {
      type: Number,
      required: true,
      min: 0,
    },

    capacityUnit: {
      type: String,
      enum: {
        values: ["TON", "KG"],
        message: "Capacity unit must be either TON or KG",
      },
      default: "TON",
    },

    // 🔹 Extra important fields (added for Challan & compliance)
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
vehicleSchema.index({ vehicleNumber: "text", vehicleType: "text" });

// Compound index for status and isActive for efficient queries
vehicleSchema.index({ status: 1, isActive: 1 });

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);