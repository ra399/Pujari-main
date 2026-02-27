export function successResponse(res, message, data = {}) {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

