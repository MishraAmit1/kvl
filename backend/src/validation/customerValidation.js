export const validateCustomerInput = (customerInput) => {
  const {
    name,
    city,
    state,
    pincode,
    mobile,
    email,
    gstNumber,
    panNumber,
    customerType,
  } = customerInput;
  const errors = [];

  // Required fields validation
  if (!name?.trim()) errors.push("Name is required");
  if (!city?.trim()) errors.push("City is required");
  if (!state?.trim()) errors.push("State is required");
  if (!pincode?.trim()) errors.push("Pincode is required");
  if (!mobile?.trim()) errors.push("Mobile number is required");

  // Format validations
  if (name && (name.length < 2 || name.length > 100)) {
    errors.push("Name must be between 2 and 100 characters");
  }

  if (city && (city.length < 2 || city.length > 50)) {
    errors.push("City must be between 2 and 50 characters");
  }

  if (state && (state.length < 2 || state.length > 50)) {
    errors.push("State must be between 2 and 50 characters");
  }

  if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
    errors.push("Pincode must be a valid 6-digit number");
  }

  if (
    gstNumber &&
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)
  ) {
    errors.push("Please provide a valid GST number");
  }

  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
    errors.push("Please provide a valid PAN number");
  }

  if (
    customerType &&
    !["CONSIGNOR", "CONSIGNEE", "BOTH"].includes(customerType)
  ) {
    errors.push("Customer type must be either CONSIGNOR, CONSIGNEE, or BOTH");
  }

  return errors;
};
