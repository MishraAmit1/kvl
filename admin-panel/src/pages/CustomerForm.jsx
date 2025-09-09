import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectItem } from "../components/ui/select";

const CUSTOMER_TYPES = [
  { value: "CONSIGNOR", label: "Consignor" },
  { value: "CONSIGNEE", label: "Consignee" },
  { value: "BOTH", label: "Both" },
];

const defaultValues = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  mobile: "",
  email: "",
  gstNumber: "",
  panNumber: "",
  customerType: "CONSIGNOR",
};

function validate(values) {
  const errors = {};
  if (!values.name) errors.name = "Name is required";
  if (!values.mobile) errors.mobile = "Mobile is required";
  else if (!/^\d{10}$/.test(values.mobile))
    errors.mobile = "Invalid mobile number";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email))
    errors.email = "Invalid email";
  if (!values.customerType) errors.customerType = "Type is required";
  return errors;
}

const CustomerForm = ({
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

  const handleTypeChange = (val) => {
    setValues((v) => ({ ...v, customerType: val }));
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
        <label className="block font-medium mb-1">Address</label>
        <Input
          name="address"
          value={values.address}
          onChange={handleChange}
          disabled={loading}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-medium mb-1">City</label>
          <Input
            name="city"
            value={values.city}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">State</label>
          <Input
            name="state"
            value={values.state}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">Pincode</label>
          <Input
            name="pincode"
            value={values.pincode}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
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
        <div className="flex-1">
          <label className="block font-medium mb-1">Email</label>
          <Input
            name="email"
            value={values.email}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.email && (
            <div className="text-red-500 text-xs mt-1">{errors.email}</div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-medium mb-1">GST Number</label>
          <Input
            name="gstNumber"
            value={values.gstNumber}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">PAN Number</label>
          <Input
            name="panNumber"
            value={values.panNumber}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Customer Type *</label>
        <Select
          value={values.customerType}
          onValueChange={handleTypeChange}
          disabled={loading}
        >
          {CUSTOMER_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </Select>
        {errors.customerType && (
          <div className="text-red-500 text-xs mt-1">{errors.customerType}</div>
        )}
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
          {mode === "edit" ? "Update" : "Add"} Customer
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
