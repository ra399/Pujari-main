import { successResponse } from "../utils/response.js";
import Booking from "../models/booking.model.js";
import ProviderProfile from "../models/provider.model.js";
import { validateBookingRequest } from "../services/booking.service.js";
import { restoreAvailabilityOnCancel } from "./providerAvailability.controller.js";
import { isPastStartTime, isPastEndTime } from "../utils/datetime.js";

export const createBooking = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user?._id) {
      // should never happen because requireAuth sets req.user
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const { providerId, serviceKey, date, startTime, endTime, serviceAddress, contactNumber, notes } = req.body;

    const { provider, service, dateOnly } = await validateBookingRequest({
      providerId,
      serviceKey,
      date,
      startTime,
      endTime,
    });

    const price = service?.price;

    const booking = await Booking.create({
      user: user._id,
      provider: provider._id,
      serviceKey,
      date: dateOnly,
      startTime,
      endTime,
      price,
      serviceAddress,
      contactNumber,
      notes: notes || '',
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // Fetch booking with populated references
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      });

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    // Ensure user can only view their own bookings (or if they're the provider)
    const isOwner = booking.user._id.toString() === userId.toString();
    const isProvider = booking.provider?.user?._id.toString() === userId.toString();

    if (!isOwner && !isProvider) {
      const err = new Error("Forbidden: You can only view your own bookings");
      err.statusCode = 403;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    console.log(`[getBookings] Request received from User: ${req.user._id} (${req.user.role})`);
    
    const userId = req.user._id;
    const userRole = req.user.role;

    // Build query based on user role
    let query = {};
    
    if (userRole === "USER") {
      // Users see their own bookings
      query.user = userId;
    } else if (userRole === "PROVIDER") {
      // Providers see bookings for their services
      const provider = await ProviderProfile.findOne({ user: userId });
      
      if (!provider) {
        console.log('[getBookings] Provider profile not found for user');
        return res.status(404).json({
          success: false,
          message: "Provider profile not found",
        });
      }
      
      query.provider = provider._id;
    }

    // Optional filters from query params
    if (req.query.status) {
      // Support multiple statuses (comma separated)
      const statuses = req.query.status.split(',');
      if (statuses.length > 1) {
        query.status = { $in: statuses };
      } else {
        query.status = req.query.status;
      }
    }

    if (req.query.date) {
      const dateObj = new Date(req.query.date);
      dateObj.setHours(0, 0, 0, 0);
      query.date = dateObj;
    }

    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    } else if (req.query.startDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      query.date = { $gte: start };
    } else if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $lte: end };
    }

    console.log('[getBookings] Query built:', JSON.stringify(query));

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch bookings with populated references
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`[getBookings] Found ${bookings.length} bookings`);

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // 1. Fetch booking by ID
    const booking = await Booking.findById(bookingId).populate('provider');

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    // 2. Ensure booking belongs to req.user
    if (booking.user.toString() !== userId.toString()) {
      const err = new Error("Forbidden: You can only cancel your own bookings");
      err.statusCode = 403;
      throw err;
    }

    // 3. Guard against cancelling already cancelled bookings
    if (booking.status === "CANCELLED") {
      const err = new Error("This booking has already been cancelled");
      err.statusCode = 400;
      throw err;
    }

    // 3b. Guard against cancelling completed bookings
    if (booking.status === "COMPLETED") {
      const err = new Error("Cannot cancel a completed booking");
      err.statusCode = 400;
      throw err;
    }

    // 3c. Guard against cancelling rejected bookings
    if (booking.status === "REJECTED") {
      const err = new Error("Cannot cancel a rejected booking");
      err.statusCode = 400;
      throw err;
    }

    // 3d. Ensure status is PENDING or APPROVED (only these can be cancelled)
    if (!["PENDING", "APPROVED"].includes(booking.status)) {
      const err = new Error(`Cannot cancel booking with status: ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Block cancellation if current time >= booking startTime (timezone-safe)
    if (isPastStartTime(booking.date, booking.startTime)) {
      const err = new Error("Cannot cancel booking: start time has already passed");
      err.statusCode = 400;
      throw err;
    }

    // 5. If status is APPROVED, restore availability
    if (booking.status === "APPROVED") {
      const provider = await ProviderProfile.findById(booking.provider);
      
      if (!provider) {
        const err = new Error("Provider not found");
        err.statusCode = 404;
        throw err;
      }

      await restoreAvailabilityOnCancel(
        provider,
        booking.date,
        booking.startTime,
        booking.endTime
      );
    }

    // 6. Update booking status to CANCELLED
    booking.status = "CANCELLED";
    
    // Add cancellation reason if provided
    if (req.body.cancellationReason) {
      booking.cancellationReason = req.body.cancellationReason;
    }

    // 7. Save booking (provider availability already saved in restoreAvailabilityOnCancel)
    await booking.save();

    // 8. Return updated booking
    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};

export const completeBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Fetch booking by ID
    const booking = await Booking.findById(bookingId).populate('provider');

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    // 2. Ensure status is APPROVED
    if (booking.status !== "APPROVED") {
      const err = new Error(`Cannot complete booking with status: ${booking.status}. Only APPROVED bookings can be completed.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Ensure req.user is the provider of the booking OR admin
    const provider = await ProviderProfile.findById(booking.provider);
    
    if (!provider) {
      const err = new Error("Provider not found");
      err.statusCode = 404;
      throw err;
    }

    const isProvider = provider.user.toString() === userId.toString();
    const isAdmin = userRole === "ADMIN";

    if (!isProvider && !isAdmin) {
      const err = new Error("Forbidden: Only the provider or admin can complete this booking");
      err.statusCode = 403;
      throw err;
    }

    // 4. Ensure current time is after booking endTime
    if (!isPastEndTime(booking.date, booking.endTime)) {
      const err = new Error("Cannot complete booking: end time has not yet passed");
      err.statusCode = 400;
      throw err;
    }

    // 5. Update status to COMPLETED
    booking.status = "COMPLETED";

    // 6. Save booking
    await booking.save();

    // 7. Return updated booking
    return res.status(200).json({
      success: true,
      message: "Booking completed successfully",
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};
