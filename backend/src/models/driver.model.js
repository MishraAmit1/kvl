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
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
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
