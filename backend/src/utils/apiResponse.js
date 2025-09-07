export const sendResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    statusCode,
    data,
    message,
    success: statusCode < 400,
  });
};
