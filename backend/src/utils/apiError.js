export const throwApiError = (
  statusCode,
  message = "Something went wrong",
  errors = []
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  error.errors = errors;
  return error;
};
