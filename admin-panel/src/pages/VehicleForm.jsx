import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const VEHICLE_TYPES = [
  "TRUCK",
  "VAN",
  "TEMPO",
  "PICKUP",
  "TRAILER",
  "CONTAINER",
];

const defaultValues = {
  vehicleNumber: "",
  vehicleType: "TRUCK",
  ownerName: "",
  ownerMobileNumber: "",
  ownerAadhaarNumber: "",
  ownerAddress: "",
  engineNumber: "",
  chassisNumber: "",
  insurancePolicyNo: "",
  insuranceValidity: "",
};

function validate(values) {
  const errors = {};

  // Required fields
  if (!values.vehicleNumber)
    errors.vehicleNumber = "Vehicle number is required";
  if (!values.vehicleType) errors.vehicleType = "Type is required";
  if (!values.ownerName) errors.ownerName = "Owner name is required";
  if (!values.ownerMobileNumber)
    errors.ownerMobileNumber = "Mobile number is required";
  if (!values.ownerAadhaarNumber)
    errors.ownerAadhaarNumber = "Aadhaar number is required";
  if (!values.ownerAddress) errors.ownerAddress = "Owner address is required";

  // Vehicle number format validation
  if (
    values.vehicleNumber &&
    !/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/.test(
      values.vehicleNumber.toUpperCase()
    )
  ) {
    errors.vehicleNumber = "Vehicle number must be in format: KA01AB1234";
  }

  // Mobile number validation
  if (
    values.ownerMobileNumber &&
    !/^[6-9]\d{9}$/.test(values.ownerMobileNumber)
  ) {
    errors.ownerMobileNumber =
      "Mobile number must be a valid 10-digit Indian mobile number";
  }

  // Aadhaar number validation
  if (
    values.ownerAadhaarNumber &&
    !/^\d{12}$/.test(values.ownerAadhaarNumber)
  ) {
    errors.ownerAadhaarNumber = "Aadhaar number must be exactly 12 digits";
  }

  return errors;
}

const VehicleForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading,
  mode = "add",
}) => {
  const [values, setValues] = useState({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto uppercase for vehicle number
    if (name === "vehicleNumber") {
      processedValue = value.toUpperCase();
    }

    setValues((v) => ({ ...v, [name]: processedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // Filter out empty strings
      const cleanedValues = {};
      Object.keys(values).forEach((key) => {
        if (values[key] !== "") {
          cleanedValues[key] = values[key];
        }
      });

      onSubmit(cleanedValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Vehicle Number *
        </label>
        <Input
          name="vehicleNumber"
          value={values.vehicleNumber}
          onChange={handleChange}
          disabled={loading}
          placeholder="KA01AB1234"
          className="text-sm"
        />
        {errors.vehicleNumber && (
          <div className="text-red-500 text-xs mt-1">
            {errors.vehicleNumber}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Vehicle Type *</label>
        <select
          name="vehicleType"
          value={values.vehicleType}
          onChange={handleChange}
          disabled={loading}
          className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
        >
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.vehicleType && (
          <div className="text-red-500 text-xs mt-1">{errors.vehicleType}</div>
        )}
      </div>

      {/* Owner Details Section */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 text-sm">Owner Details</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Owner Name *
            </label>
            <Input
              name="ownerName"
              value={values.ownerName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter owner's full name"
              className="text-sm"
            />
            {errors.ownerName && (
              <div className="text-red-500 text-xs mt-1">
                {errors.ownerName}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number *
              </label>
              <Input
                name="ownerMobileNumber"
                value={values.ownerMobileNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="9876543210"
                maxLength="10"
                className="text-sm"
              />
              {errors.ownerMobileNumber && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.ownerMobileNumber}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Aadhaar Number *
              </label>
              <Input
                name="ownerAadhaarNumber"
                value={values.ownerAadhaarNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="123456789012"
                maxLength="12"
                className="text-sm"
              />
              {errors.ownerAadhaarNumber && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.ownerAadhaarNumber}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Owner Address *
            </label>
            <textarea
              name="ownerAddress"
              value={values.ownerAddress}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter complete address"
              rows="3"
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            />
            {errors.ownerAddress && (
              <div className="text-red-500 text-xs mt-1">
                {errors.ownerAddress}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Details Section */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 text-sm">
          Vehicle & Insurance Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Engine Number
            </label>
            <Input
              name="engineNumber"
              value={values.engineNumber}
              onChange={handleChange}
              disabled={loading}
              placeholder="Engine number"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Chassis Number
            </label>
            <Input
              name="chassisNumber"
              value={values.chassisNumber}
              onChange={handleChange}
              disabled={loading}
              placeholder="Chassis number"
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Insurance Policy No.
            </label>
            <Input
              name="insurancePolicyNo"
              value={values.insurancePolicyNo}
              onChange={handleChange}
              disabled={loading}
              placeholder="Insurance policy number"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Insurance Validity
            </label>
            <Input
              name="insuranceValidity"
              type="date"
              value={values.insuranceValidity}
              onChange={handleChange}
              disabled={loading}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="text-sm"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="text-sm">
          {mode === "edit" ? "Update" : "Add"} Vehicle
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm;
