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
const CAPACITY_UNITS = ["KG", "TON", "LITRE", "CBM"];

const defaultValues = {
  vehicleNumber: "",
  vehicleType: "TRUCK",
  lengthFeet: "",
  flooringType: "",
  flooringMaterial: "",
  capacityValue: "",
  capacityUnit: "KG",
  engineNumber: "",
  chassisNumber: "",
  insurancePolicyNo: "",
  insuranceValidity: "",
};

function validate(values) {
  const errors = {};
  if (!values.vehicleNumber)
    errors.vehicleNumber = "Vehicle number is required";
  if (!values.vehicleType) errors.vehicleType = "Type is required";
  if (values.lengthFeet && isNaN(Number(values.lengthFeet)))
    errors.lengthFeet = "Length must be a number";
  if (values.capacityValue && isNaN(Number(values.capacityValue)))
    errors.capacityValue = "Capacity must be a number";
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
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(values);
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

      <div>
        <label className="block text-sm font-medium mb-1">Length (feet)</label>
        <Input
          name="lengthFeet"
          value={values.lengthFeet}
          onChange={handleChange}
          disabled={loading}
          className="text-sm"
        />
        {errors.lengthFeet && (
          <div className="text-red-500 text-xs mt-1">{errors.lengthFeet}</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Flooring Type
          </label>
          <Input
            name="flooringType"
            value={values.flooringType}
            onChange={handleChange}
            disabled={loading}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Flooring Material
          </label>
          <Input
            name="flooringMaterial"
            value={values.flooringMaterial}
            onChange={handleChange}
            disabled={loading}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <Input
            name="capacityValue"
            value={values.capacityValue}
            onChange={handleChange}
            disabled={loading}
            className="text-sm"
          />
          {errors.capacityValue && (
            <div className="text-red-500 text-xs mt-1">
              {errors.capacityValue}
            </div>
          )}
        </div>

        <div className="w-full sm:w-32">
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            name="capacityUnit"
            value={values.capacityUnit}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
          >
            {CAPACITY_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* New fields for Challan & Compliance */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 text-sm">Challan & Compliance Details</h4>
        
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
