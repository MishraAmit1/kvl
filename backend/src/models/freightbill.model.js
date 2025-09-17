import mongoose from "mongoose";

const freightBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Party Details
    party: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, "Party name must be at least 2 characters long"],
        maxlength: [100, "Party name cannot exceed 100 characters"],
      },
      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
    },
    // Consignments in this bill
    consignments: [
      {
        consignmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Consignment",
          required: true,
        },
        consignmentNumber: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          minlength: [
            5,
            "Consignment number must be at least 5 characters long",
          ],
        },
        consignmentDate: {
          type: Date,
          required: true,
        },
        destination: {
          type: String,
          required: true,
          trim: true,
          minlength: [2, "Destination must be at least 2 characters long"],
          maxlength: [100, "Destination cannot exceed 100 characters"],
        },
        chargedWeight: {
          type: Number,
          required: true,
          min: [0.1, "Charged weight must be greater than 0"],
          max: [1000000, "Charged weight cannot exceed 10000 kg"],
        },
        rate: {
          type: String,
          required: true,
          min: [0.01, "Rate must be greater than 0"],
          max: [10000, "Rate cannot exceed 10000 per kg"],
        },
        freight: {
          type: Number,
          required: true,
          min: [0, "Freight cannot be negative"],
          validate: {
            validator: function (v) {
              return v >= 0;
            },
            message: "Freight amount must be non-negative",
          },
        },
        hamali: {
          type: Number,
          default: 0,
          min: [0, "Hamali charges cannot be negative"],
        },
        stCharges: {
          type: Number,
          default: 0,
          min: [0, "ST charges cannot be negative"],
        },
        doorDelivery: {
          type: Number,
          default: 0,
          min: [0, "Door delivery charges cannot be negative"],
        },
        otherCharges: {
          type: Number,
          default: 0,
          min: [0, "Other charges cannot be negative"],
        },
        grandTotal: {
          type: Number,
          required: true,
          min: [0, "Grand total cannot be negative"],
          validate: {
            validator: function (v) {
              return v >= 0;
            },
            message: "Grand total must be non-negative",
          },
        },
      },
    ],
    // Bill Totals
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0;
        },
        message: "Total amount must be non-negative",
      },
    },
    adjustments: [
      {
        type: {
          type: String,
          enum: {
            values: ["DISCOUNT", "EXTRA_CHARGE", "FUEL_SURCHARGE", "OTHER"],
            message:
              "Adjustment type must be one of: DISCOUNT, EXTRA_CHARGE, FUEL_SURCHARGE, OTHER",
          },
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          minlength: [3, "Description must be at least 3 characters long"],
          maxlength: [200, "Description cannot exceed 200 characters"],
        },
        amount: {
          type: Number,
          required: true,
          validate: {
            validator: function (v) {
              return v !== 0; // Amount should not be zero
            },
            message: "Adjustment amount cannot be zero",
          },
        },
      },
    ],
    finalAmount: {
      type: Number,
      required: true,
      min: [0, "Final amount cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0;
        },
        message: "Final amount must be non-negative",
      },
    },

    // Billing Details
    billingBranch: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Billing branch must be at least 2 characters long"],
      maxlength: [50, "Billing branch cannot exceed 50 characters"],
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "GENERATED",
        "SENT",
        "PARTIALLY_PAID",
        "PAID",
        "CANCELLED",
      ],
      default: "GENERATED",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
freightBillSchema.index({ billNumber: 1 }, { unique: true });
freightBillSchema.index({ billDate: -1 });
freightBillSchema.index({ "party.customerId": 1 });
freightBillSchema.index({ status: 1 });
freightBillSchema.index({ createdBy: 1 });

// Text index for search functionality
freightBillSchema.index({
  billNumber: "text",
  "party.name": "text",
  billingBranch: "text",
});

export const FreightBill = mongoose.model("FreightBill", freightBillSchema);
