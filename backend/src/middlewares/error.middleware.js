import { ApiError } from "../utils/constants.js";
import { errorResponse } from "../utils/response.js";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

export default function errorHandler(err, req, res, next) {
  // handle Zod validation errors
  if (err instanceof ZodError) {
    return errorResponse(res, err.errors.map(e => e.message).join(", "), 400);
  }
  // handle JWT errors
  if (
    err instanceof jwt.TokenExpiredError ||
    err instanceof jwt.JsonWebTokenError
  ) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
  // handle custom ApiError
  if (err instanceof ApiError) {
    return errorResponse(res, err.message, err.statusCode);
  }
  // fallback for other errors
  return errorResponse(res, err.message || "Internal Server Error", err.statusCode || 500);
}

