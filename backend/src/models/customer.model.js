import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    city: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "City must be at least 2 characters long"],
      maxlength: [50, "City cannot exceed 50 characters"],
    },
    state: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "State must be at least 2 characters long"],
      maxlength: [50, "State cannot exceed 50 characters"],
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
      validate: {
        validator: function (v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: "Pincode must be a valid 6-digit number",
      },
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
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    customerType: {
      type: String,
      enum: {
        values: ["CONSIGNOR", "CONSIGNEE", "BOTH"],
        message: "Customer type must be either CONSIGNOR, CONSIGNEE, or BOTH",
      },
      default: "BOTH",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for search functionality
customerSchema.index({ name: "text", city: "text", state: "text" });
// Schema ke baad ye add karo
customerSchema.pre("save", function (next) {
  // Empty strings ko undefined bana do
  if (this.email === "") this.email = undefined;
  if (this.gstNumber === "") this.gstNumber = undefined;
  if (this.panNumber === "") this.panNumber = undefined;
  if (this.address === "") this.address = undefined;

  next();
});
export const Customer = mongoose.model("Customer", customerSchema);
