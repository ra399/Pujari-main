import express from "express";
import { createBooking, getBookings, completeBooking, cancelBooking, getBookingById } from "../controllers/booking.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

// GET /api/bookings - Get bookings (filtered by user role, supports status and date filters)
router.get("/", requireAuth, getBookings);

// POST /api/bookings
router.post("/", requireAuth, roleMiddleware(ROLES.USER, ROLES.PROVIDER), createBooking);

// PATCH /api/bookings/:id/complete - Complete a booking (must come before /:id)
router.patch("/:id/complete", requireAuth, roleMiddleware(ROLES.PROVIDER, ROLES.ADMIN), completeBooking);

// PATCH /api/bookings/:id/cancel - Cancel a booking (must come before /:id)
router.patch("/:id/cancel", requireAuth, cancelBooking);

// GET /api/bookings/:id - Get booking by ID (must come after specific routes)
router.get("/:id", requireAuth, getBookingById);

export default router;
