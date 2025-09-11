import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const defaultValues = {
  name: "",
  mobile: "",
  licenseNumber: "",
};

function validate(values) {
  const errors = {};
  if (!values.name) errors.name = "Name is required";
  if (!values.mobile) errors.mobile = "Mobile is required";
  return errors;
}

const DriverForm = ({
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
      // Empty strings ko filter kar do
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Name *</label>
        <Input
          name="name"
          value={values.name}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.name && (
          <div className="text-red-500 text-xs mt-1">{errors.name}</div>
        )}
      </div>
      <div>
        <label className="block font-medium mb-1">Mobile *</label>
        <Input
          name="mobile"
          value={values.mobile}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.mobile && (
          <div className="text-red-500 text-xs mt-1">{errors.mobile}</div>
        )}
      </div>
      <div>
        <label className="block font-medium mb-1">License Number</label>
        <Input
          name="licenseNumber"
          value={values.licenseNumber}
          onChange={handleChange}
          disabled={loading}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {mode === "edit" ? "Update" : "Add"} Driver
        </Button>
      </div>
    </form>
  );
};

export default DriverForm;
