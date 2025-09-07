import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Calculator, AlertCircle } from "lucide-react";

const defaultValues = {
  bookingBranch: "",
  consignor: "",
  consignee: "",
  fromCity: "",
  toCity: "",
  description: "",
  packages: "",
  actualWeight: "",
  chargedWeight: "",
  value: "",
  freight: "",
  hamali: "0",
  stCharges: "0",
  doorDelivery: "0",
  otherCharges: "0",
  riskCharges: "0",
  serviceTax: "0",
  insurance: "No",
  typeOfPickup: "GODOWN",
  typeOfDelivery: "GODOWN",
  pan: "",
  invoiceNumber: "",
  eWayBillNumber: "",
  vehicle: "",
  driver: "",
  grandTotal: 0,
};

const steps = ["Consignor/Consignee", "Details", "Vehicle/Driver", "Review"];

// Enhanced validation function
function validateStep(step, values, customers) {
  const errors = {};

  if (step === 0) {
    if (!values.bookingBranch?.trim()) {
      errors.bookingBranch = "Booking branch is required";
    }
    if (!values.consignor) {
      errors.consignor = "Consignor is required";
    }
    if (!values.consignee) {
      errors.consignee = "Consignee is required";
    }

    // Validate that consignor and consignee are different
    if (
      values.consignor &&
      values.consignee &&
      values.consignor === values.consignee
    ) {
      errors.consignee = "Consignee must be different from consignor";
    }
  }

  if (step === 1) {
    if (!values.fromCity?.trim()) errors.fromCity = "From city is required";
    if (!values.toCity?.trim()) errors.toCity = "To city is required";
    if (!values.description?.trim())
      errors.description = "Description is required";

    // Validate numeric fields
    if (!values.packages || parseInt(values.packages) <= 0) {
      errors.packages = "Packages must be greater than 0";
    }

    if (!values.actualWeight || parseFloat(values.actualWeight) <= 0) {
      errors.actualWeight = "Actual weight must be greater than 0";
    }

    if (!values.chargedWeight || parseFloat(values.chargedWeight) <= 0) {
      errors.chargedWeight = "Charged weight must be greater than 0";
    }

    // Validate charged weight >= actual weight
    if (values.actualWeight && values.chargedWeight) {
      if (parseFloat(values.chargedWeight) < parseFloat(values.actualWeight)) {
        errors.chargedWeight =
          "Charged weight cannot be less than actual weight";
      }
    }

    if (!values.value || parseFloat(values.value) <= 0) {
      errors.value = "Value must be greater than 0";
    }

    if (!values.freight || parseFloat(values.freight) < 0) {
      errors.freight = "Freight cannot be negative";
    }

    // Validate optional charges are not negative
    const chargeFields = [
      "hamali",
      "stCharges",
      "doorDelivery",
      "otherCharges",
      "riskCharges",
      "serviceTax",
    ];
    chargeFields.forEach((field) => {
      if (values[field] && parseFloat(values[field]) < 0) {
        errors[field] = `${field} cannot be negative`;
      }
    });
  }

  return errors;
}

const ConsignmentForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading,
  mode = "add",
  customers = [],
  vehicles = [],
  drivers = [],
}) => {
  const [values, setValues] = useState({ ...defaultValues, ...initialValues });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  // Calculate grand total whenever charges change
  useEffect(() => {
    const total =
      (parseFloat(values.freight) || 0) +
      (parseFloat(values.hamali) || 0) +
      (parseFloat(values.stCharges) || 0) +
      (parseFloat(values.doorDelivery) || 0) +
      (parseFloat(values.otherCharges) || 0) +
      (parseFloat(values.riskCharges) || 0) +
      (parseFloat(values.serviceTax) || 0);

    setGrandTotal(total);
    setValues((prev) => ({ ...prev, grandTotal: total }));
  }, [
    values.freight,
    values.hamali,
    values.stCharges,
    values.doorDelivery,
    values.otherCharges,
    values.riskCharges,
    values.serviceTax,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setValues((v) => ({ ...v, [name]: value }));
  };

  const nextStep = () => {
    const errs = validateStep(step, values, customers);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < steps.length - 1) {
      nextStep();
      return;
    }

    // Final validation before submit
    const finalErrors = validateStep(1, values, customers);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setStep(1); // Go back to details step
      return;
    }

    onSubmit(values);
  };

  // Get customer details for display
  const getCustomerDetails = (customerId) => {
    return customers.find((c) => c._id === customerId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4 overflow-x-auto">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs ${
                i === step ? "font-semibold" : "text-muted-foreground"
              } hidden sm:inline`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-4 sm:w-6 h-0.5 bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Consignor/Consignee */}
      {step === 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Booking Branch *
            </label>
            <Input
              name="bookingBranch"
              value={values.bookingBranch}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter booking branch"
              className={`text-sm ${
                errors.bookingBranch ? "border-red-500" : ""
              }`}
            />
            {errors.bookingBranch && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bookingBranch}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Consignor *
            </label>
            <select
              name="consignor"
              value={values.consignor}
              onChange={handleChange}
              disabled={loading}
              className={`w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm ${
                errors.consignor ? "border-red-500" : "border-border"
              }`}
            >
              <option value="">Select consignor</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} - {c.mobile}
                </option>
              ))}
            </select>
            {errors.consignor && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.consignor}
              </div>
            )}
            {values.consignor && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                {(() => {
                  const customer = getCustomerDetails(values.consignor);
                  return customer ? (
                    <div>
                      <div>
                        <strong>Name:</strong> {customer.name}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {customer.mobile}
                      </div>
                      <div>
                        <strong>Address:</strong> {customer.address}
                      </div>
                      {customer.gstNumber && (
                        <div>
                          <strong>GST:</strong> {customer.gstNumber}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Consignee *
            </label>
            <select
              name="consignee"
              value={values.consignee}
              onChange={handleChange}
              disabled={loading}
              className={`w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm ${
                errors.consignee ? "border-red-500" : "border-border"
              }`}
            >
              <option value="">Select consignee</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} - {c.mobile}
                </option>
              ))}
            </select>
            {errors.consignee && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.consignee}
              </div>
            )}
            {values.consignee && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                {(() => {
                  const customer = getCustomerDetails(values.consignee);
                  return customer ? (
                    <div>
                      <div>
                        <strong>Name:</strong> {customer.name}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {customer.mobile}
                      </div>
                      <div>
                        <strong>Address:</strong> {customer.address}
                      </div>
                      {customer.gstNumber && (
                        <div>
                          <strong>GST:</strong> {customer.gstNumber}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 1 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From City *
              </label>
              <Input
                name="fromCity"
                value={values.fromCity}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter from city"
                className={`text-sm ${errors.fromCity ? "border-red-500" : ""}`}
              />
              {errors.fromCity && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fromCity}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                To City *
              </label>
              <Input
                name="toCity"
                value={values.toCity}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter to city"
                className={`text-sm ${errors.toCity ? "border-red-500" : ""}`}
              />
              {errors.toCity && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.toCity}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <Input
              name="description"
              value={values.description}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter goods description"
              className={`text-sm ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Packages *
              </label>
              <Input
                name="packages"
                type="number"
                min="1"
                value={values.packages}
                onChange={handleChange}
                disabled={loading}
                placeholder="Number of packages"
                className={`text-sm ${errors.packages ? "border-red-500" : ""}`}
              />
              {errors.packages && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.packages}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Actual Weight (kg) *
              </label>
              <Input
                name="actualWeight"
                type="number"
                step="0.01"
                min="0.01"
                value={values.actualWeight}
                onChange={handleChange}
                disabled={loading}
                placeholder="Actual weight"
                className={`text-sm ${
                  errors.actualWeight ? "border-red-500" : ""
                }`}
              />
              {errors.actualWeight && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.actualWeight}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Charged Weight (kg) *
              </label>
              <Input
                name="chargedWeight"
                type="number"
                step="0.01"
                min="0.01"
                value={values.chargedWeight}
                onChange={handleChange}
                disabled={loading}
                placeholder="Charged weight"
                className={`text-sm ${
                  errors.chargedWeight ? "border-red-500" : ""
                }`}
              />
              {errors.chargedWeight && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.chargedWeight}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Value (₹) *
              </label>
              <Input
                name="value"
                type="number"
                step="0.01"
                min="0.01"
                value={values.value}
                onChange={handleChange}
                disabled={loading}
                placeholder="Goods value"
                className={`text-sm ${errors.value ? "border-red-500" : ""}`}
              />
              {errors.value && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.value}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Freight (₹) *
              </label>
              <Input
                name="freight"
                type="number"
                step="0.01"
                min="0"
                value={values.freight}
                onChange={handleChange}
                disabled={loading}
                placeholder="Freight charges"
                className={`text-sm ${errors.freight ? "border-red-500" : ""}`}
              />
              {errors.freight && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.freight}
                </div>
              )}
            </div>
          </div>

          {/* Additional Charges Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Additional Charges
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hamali (₹)
                </label>
                <Input
                  name="hamali"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.hamali}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  ST Charges (₹)
                </label>
                <Input
                  name="stCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.stCharges}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Door Delivery (₹)
                </label>
                <Input
                  name="doorDelivery"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.doorDelivery}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Other Charges (₹)
                </label>
                <Input
                  name="otherCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.otherCharges}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Risk Charges (₹)
                </label>
                <Input
                  name="riskCharges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.riskCharges}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Service Tax (₹)
                </label>
                <Input
                  name="serviceTax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.serviceTax}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Grand Total Display */}
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Grand Total:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Other Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Other Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Insurance
                </label>
                <select
                  name="insurance"
                  value={values.insurance}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type of Pickup
                </label>
                <select
                  name="typeOfPickup"
                  value={values.typeOfPickup}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="GODOWN">Godown</option>
                  <option value="DOOR">Door</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type of Delivery
                </label>
                <select
                  name="typeOfDelivery"
                  value={values.typeOfDelivery}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                >
                  <option value="GODOWN">Godown</option>
                  <option value="DOOR">Door</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PAN</label>
                <Input
                  name="pan"
                  value={values.pan}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="PAN number"
                  className="text-sm"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice Number
                </label>
                <Input
                  name="invoiceNumber"
                  value={values.invoiceNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Invoice number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  E-Way Bill Number
                </label>
                <Input
                  name="eWayBillNumber"
                  value={values.eWayBillNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="E-way bill number"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Vehicle/Driver */}
      {step === 2 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Vehicle and driver assignment is optional. You can assign them later
            from the consignment details.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Vehicle (Optional)
            </label>
            <select
              name="vehicle"
              value={values.vehicle}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            >
              <option value="">Select vehicle (optional)</option>
              {vehicles
                .filter((v) => v.status === "AVAILABLE")
                .map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} - {v.vehicleType}
                  </option>
                ))}
            </select>
            {values.vehicle && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                {(() => {
                  const vehicle = vehicles.find(
                    (v) => v._id === values.vehicle
                  );
                  return vehicle ? (
                    <div>
                      <div>
                        <strong>Number:</strong> {vehicle.vehicleNumber}
                      </div>
                      <div>
                        <strong>Type:</strong> {vehicle.vehicleType}
                      </div>
                      <div>
                        <strong>Capacity:</strong> {vehicle.capacityValue} {vehicle.capacityUnit}
                      </div>
                      {vehicle.engineNumber && (
                        <div>
                          <strong>Engine:</strong> {vehicle.engineNumber}
                        </div>
                      )}
                      {vehicle.chassisNumber && (
                        <div>
                          <strong>Chassis:</strong> {vehicle.chassisNumber}
                        </div>
                      )}
                      {vehicle.insurancePolicyNo && (
                        <div>
                          <strong>Insurance:</strong> {vehicle.insurancePolicyNo}
                        </div>
                      )}
                      {vehicle.insuranceValidity && (
                        <div>
                          <strong>Valid Until:</strong> {new Date(vehicle.insuranceValidity).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Driver (Optional)
            </label>
            <select
              name="driver"
              value={values.driver}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            >
              <option value="">Select driver (optional)</option>
              {drivers
                .filter((d) => d.status === "AVAILABLE")
                .map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} - {d.mobile}
                  </option>
                ))}
            </select>
            {values.driver && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                {(() => {
                  const driver = drivers.find((d) => d._id === values.driver);
                  return driver ? (
                    <div>
                      <div>
                        <strong>Name:</strong> {driver.name}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {driver.mobile}
                      </div>
                      <div>
                        <strong>License:</strong> {driver.licenseNumber}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="text-lg font-semibold mb-2">Review Consignment</div>

          {/* Grand Total Highlight */}
          <div className="bg-primary/10 p-4 rounded-lg mb-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold text-primary">
                ₹{grandTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Review Details */}
          <div className="space-y-4">
            {/* Party Details */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Party Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium">Consignor:</div>
                  <div>
                    {getCustomerDetails(values.consignor)?.name ||
                      "Not selected"}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Consignee:</div>
                  <div>
                    {getCustomerDetails(values.consignee)?.name ||
                      "Not selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Shipment Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Route:</strong> {values.fromCity} → {values.toCity}
                </div>
                <div>
                  <strong>Description:</strong> {values.description}
                </div>
                <div>
                  <strong>Packages:</strong> {values.packages}
                </div>
                <div>
                  <strong>Weight:</strong> {values.actualWeight} kg /{" "}
                  {values.chargedWeight} kg
                </div>
                <div>
                  <strong>Value:</strong> ₹
                  {parseFloat(values.value || 0).toLocaleString()}
                </div>
                <div>
                  <strong>Insurance:</strong> {values.insurance}
                </div>
              </div>
            </div>
            {/* Charges Breakdown */}
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-2">Charges Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Freight:</span>
                  <span>
                    ₹{parseFloat(values.freight || 0).toLocaleString()}
                  </span>
                </div>
                {parseFloat(values.hamali || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Hamali:</span>
                    <span>₹{parseFloat(values.hamali).toLocaleString()}</span>
                  </div>
                )}
                {parseFloat(values.stCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>ST Charges:</span>
                    <span>
                      ₹{parseFloat(values.stCharges).toLocaleString()}
                    </span>
                  </div>
                )}
                {parseFloat(values.doorDelivery || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Door Delivery:</span>
                    <span>
                      ₹{parseFloat(values.doorDelivery).toLocaleString()}
                    </span>
                  </div>
                )}
                {parseFloat(values.otherCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Other Charges:</span>
                    <span>
                      ₹{parseFloat(values.otherCharges).toLocaleString()}
                    </span>
                  </div>
                )}
                {parseFloat(values.riskCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Risk Charges:</span>
                    <span>
                      ₹{parseFloat(values.riskCharges).toLocaleString()}
                    </span>
                  </div>
                )}
                {parseFloat(values.serviceTax || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Tax:</span>
                    <span>
                      ₹{parseFloat(values.serviceTax).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t pt-1 flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Vehicle & Driver */}
            {(values.vehicle || values.driver) && (
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {values.vehicle && (
                    <div>
                      <div className="font-medium">Vehicle:</div>
                      <div>
                        {vehicles.find((v) => v._id === values.vehicle)
                          ?.vehicleNumber || "Not assigned"}
                      </div>
                    </div>
                  )}
                  {values.driver && (
                    <div>
                      <div className="font-medium">Driver:</div>
                      <div>
                        {drivers.find((d) => d._id === values.driver)?.name ||
                          "Not assigned"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {(values.pan || values.invoiceNumber || values.eWayBillNumber) && (
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {values.pan && (
                    <div>
                      <div className="font-medium">PAN:</div>
                      <div>{values.pan}</div>
                    </div>
                  )}
                  {values.invoiceNumber && (
                    <div>
                      <div className="font-medium">Invoice Number:</div>
                      <div>{values.invoiceNumber}</div>
                    </div>
                  )}
                  {values.eWayBillNumber && (
                    <div>
                      <div className="font-medium">E-Way Bill:</div>
                      <div>{values.eWayBillNumber}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto text-sm"
        >
          Cancel
        </Button>

        <div className="flex gap-2 w-full sm:w-auto">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={loading}
              className="flex-1 sm:flex-none text-sm"
            >
              Back
            </Button>
          )}

          {step < steps.length - 1 && (
            <Button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex-1 sm:flex-none text-sm"
            >
              Next
            </Button>
          )}

          {step === steps.length - 1 && (
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </div>
              ) : (
                `${mode === "edit" ? "Update" : "Create"} Consignment`
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-4 w-4" />
            Please fix the following errors:
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default ConsignmentForm;
