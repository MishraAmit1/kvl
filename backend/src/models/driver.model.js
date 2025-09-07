import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message:
          "Mobile number must be a valid 10-digit number starting with 6-9",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty email
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: "Please provide a valid email address",
      },
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{2}[0-9]{13}$/,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty license
          return /^[A-Z]{2}[0-9]{13}$/.test(v);
        },
        message: "License number must be in format: KA0123456789012",
      },
    },
    currentVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["AVAILABLE", "ON_TRIP"],
        message: "Status must be either AVAILABLE or ON_TRIP",
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

// Unique indexes
driverSchema.index({ mobile: 1 }, { unique: true });
driverSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
driverSchema.index({ email: 1 }, { unique: true, sparse: true });

// Text index for search functionality
driverSchema.index({ name: "text", currentLocation: "text" });

// Compound index for status and isActive
driverSchema.index({ status: 1, isActive: 1 });

export const Driver = mongoose.model("Driver", driverSchema);
