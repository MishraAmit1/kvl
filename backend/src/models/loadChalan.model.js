import mongoose from "mongoose";

const loadChalanSchema = new mongoose.Schema(
  {
    chalanNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    bookingBranch: {
      type: String,
      required: true,
      trim: true,
    },

    destinationHub: {
      type: String,
      required: true,
      trim: true,
    },

    dispatchTime: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["CREATED", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "CLOSED"],
      default: "CREATED",
    },

    // Vehicle Info
    vehicle: {
      vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
      vehicleNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      engineNumber: { type: String, trim: true, uppercase: true },
      chassisNumber: { type: String, trim: true, uppercase: true },
      insurancePolicyNo: { type: String, trim: true, uppercase: true },
      insuranceValidity: { type: Date },
    },

    // Owner & Driver Info
    ownerName: { type: String, trim: true },
    ownerAddress: { type: String, trim: true },
    driver: {
      driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
      driverName: { type: String, trim: true },
      driverMobile: { type: String, trim: true },
      driverLicenseNo: { type: String, trim: true, uppercase: true },
      cleanerName: { type: String, trim: true },
    },

    // Consignments in this Challan (Reference + Snapshot)
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
        },
        // 🔹 Snapshot fields at time of Challan creation
        packages: Number,
        packageType: String,
        description: String,
        weight: Number,
        freightAmount: { type: Number, default: 0 },
        destination: String,
      },
    ],

    // Totals (Truck Level)
    totalLRCount: { type: Number, default: 0 },
    totalPackages: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    totalFreight: { type: Number, default: 0 },

    // Charges / Settlement
    lorryFreight: { type: Number, default: 0 },
    loadingCharges: { type: Number, default: 0 },
    unloadingCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    tdsDeduction: { type: Number, default: 0 },
    balanceFreight: { type: Number, default: 0 },
    frtPayableAt: { type: String, trim: true },

    // Additional Info
    remarks: { type: String, trim: true },
    riskNote: { type: String, trim: true }, // Owner's Risk / Carrier's Risk
    postingBy: { type: String, trim: true },

    // Meta
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Business Logic Methods
loadChalanSchema.methods.calculateTotals = function () {
  this.totalLRCount = this.consignments.length;
  this.totalPackages = this.consignments.reduce(
    (sum, c) => sum + (c.packages || 0),
    0
  );
  this.totalWeight = this.consignments.reduce(
    (sum, c) => sum + (c.weight || 0),
    0
  );
  this.totalFreight = this.consignments.reduce(
    (sum, c) => sum + (c.freightAmount || 0),
    0
  );
  return this;
};

loadChalanSchema.methods.calculateBalance = function () {
  this.balanceFreight =
    this.totalFreight - this.advancePaid - this.tdsDeduction;
  return this;
};

// Pre-save hook to auto-calculate totals
loadChalanSchema.pre("save", function (next) {
  this.calculateTotals();
  this.calculateBalance();
  next();
});

// Indexes
loadChalanSchema.index({ chalanNumber: 1 }, { unique: true });
loadChalanSchema.index({ date: -1 });
loadChalanSchema.index({ status: 1 });
loadChalanSchema.index({ "vehicle.vehicleId": 1 });
loadChalanSchema.index({ "driver.driverId": 1 });
loadChalanSchema.index({ destinationHub: 1 });

export const LoadChalan = mongoose.model("LoadChalan", loadChalanSchema);
