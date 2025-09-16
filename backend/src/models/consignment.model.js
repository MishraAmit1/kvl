import mongoose from "mongoose";

const consignmentSchema = new mongoose.Schema(
  {
    consignmentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: { type: Date, required: true, default: Date.now },
    bookingBranch: {
      type: String,
      required: true,
      trim: true,
    },
    consignor: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      mobile: {
        type: String,
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
    },

    consignee: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      mobile: {
        type: String,
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
    },

    fromCity: {
      type: String,
      required: true,
      trim: true,
    },
    toCity: {
      type: String,
      required: true,
      trim: true,
    },

    // Goods Details
    description: {
      type: String,
      required: true,
      trim: true,
    },
    packages: {
      type: Number,
      required: true,
    },
    actualWeight: {
      type: Number,
      required: true,
    },
    chargedWeight: {
      type: Number,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0.01, "Rate must be greater than 0"],
      max: [10000, "Rate cannot exceed 10000 per kg"],
    },
    // Charges
    freight: {
      type: Number,
      required: true,
      default: 0,
    },
    hamali: {
      type: Number,
      default: 0,
    },
    stCharges: {
      type: Number,
      default: 0,
    },
    doorDelivery: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    riskCharges: {
      type: Number,
      default: 0,
    },
    serviceTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },

    // NEW FIELDS
    gstPayableBy: {
      type: String,
      enum: {
        values: ["CONSIGNER", "CONSIGNEE", "TRANSPORTER"],
        message:
          "GST Payable By must be one of: CONSIGNER, CONSIGNEE, TRANSPORTER",
      },
      required: true,
      default: "CONSIGNER",
    },

    risk: {
      type: String,
      enum: {
        values: ["OWNER_RISK", "CARRIER_RISK"],
        message: "Risk must be either OWNER_RISK or CARRIER_RISK",
      },
      required: true,
      default: "OWNER_RISK",
    },

    toPay: {
      type: String,
      enum: {
        values: ["TO-PAY", "TBB", "PAID"],
        message: "To Pay must be one of: TO-PAY, TBB, PAID",
      },
      required: true,
      default: "TO-PAY",
    },

    // Assignment Details
    vehicle: {
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
      vehicleNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      // Additional vehicle details for challan & compliance
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
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
      driverName: {
        type: String,
        trim: true,
      },
      driverMobile: {
        type: String,
        trim: true,
      },
    },
    // Pickup Details
    pickupDate: {
      type: Date,
    },
    pickupTime: {
      type: String,
      trim: true,
    },
    pickupInstructions: {
      type: String,
      trim: true,
    },
    // Actual Pickup Details (when marked in transit)
    actualPickupDate: {
      type: Date,
    },
    actualPickupTime: {
      type: String,
      trim: true,
    },
    transitNotes: {
      type: String,
      trim: true,
    },
    // Delivery Details
    deliveryDate: {
      type: Date,
    },
    deliveryTime: {
      type: String,
      trim: true,
    },
    deliveredBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "BOOKED",
        "ASSIGNED",
        "SCHEDULED",
        "IN_TRANSIT",
        "DELIVERED_UNCONFIRMED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "BOOKED",
    },
    // Additional Fields
    insurance: {
      type: Boolean,
      default: false,
    },
    typeOfPickup: { type: String, enum: ["GODOWN", "DOOR"], default: "GODOWN" },
    typeOfDelivery: {
      type: String,
      enum: ["GODOWN", "DOOR"],
      default: "GODOWN",
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    eWayBillNumber: {
      type: String,
      trim: true,
    },
    billedIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreightBill",
    },
    billedDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["UNBILLED", "BILLED", "PAID"],
      default: "UNBILLED",
    },
    proofOfDelivery: {
      type: String,
      trim: true,
    },
    paymentReceiptDate: {
      type: Date,
      default: null,
    },
    paymentReceiptStatus: {
      type: Boolean,
      default: false,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

consignmentSchema.index({ status: 1 });
consignmentSchema.index({ bookingDate: -1 });
consignmentSchema.index({ isDeleted: 1 });
consignmentSchema.index({ paymentStatus: 1 });
consignmentSchema.index({ billedIn: 1 });

// New indexes for the added fields
consignmentSchema.index({ gstPayableBy: 1 });
consignmentSchema.index({ risk: 1 });
consignmentSchema.index({ toPay: 1 });

export const Consignment = mongoose.model("Consignment", consignmentSchema);
