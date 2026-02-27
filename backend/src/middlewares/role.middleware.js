import { ApiError } from "../utils/constants.js";

export default function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new ApiError("Forbidden: insufficient permissions", 403));
    }
    next();
  };
}

