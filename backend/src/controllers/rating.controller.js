import Booking from "../models/booking.model.js";
import Rating from "../models/rating.model.js";
import ProviderProfile from "../models/provider.model.js";
import mongoose from "mongoose";

export const createRating = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingId = req.body.bookingId;
    const { rating, review } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      const err = new Error("Booking ID is required");
      err.statusCode = 400;
      throw err;
    }

    if (!rating || rating < 1 || rating > 5) {
      const err = new Error("Rating must be a number between 1 and 5");
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch booking by ID
    const booking = await Booking.findById(bookingId).session(session);

    // 2. Ensure booking exists and belongs to req.user
    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    if (booking.user.toString() !== userId.toString()) {
      const err = new Error("Forbidden: You can only rate your own bookings");
      err.statusCode = 403;
      throw err;
    }

    // 3. Ensure booking status is COMPLETED
    if (booking.status !== "COMPLETED") {
      const err = new Error(`Cannot rate booking with status: ${booking.status}. Only COMPLETED bookings can be rated.`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Ensure no existing rating for this booking
    const existingRating = await Rating.findOne({ booking: bookingId }).session(session);
    if (existingRating) {
      const err = new Error("Rating already exists for this booking");
      err.statusCode = 400;
      throw err;
    }

    // 5. Fetch provider to get current rating and ratingCount
    const provider = await ProviderProfile.findById(booking.provider).session(session);
    if (!provider) {
      const err = new Error("Provider not found");
      err.statusCode = 404;
      throw err;
    }

    // Calculate new average rating
    const currentRating = provider.rating || 0;
    const currentCount = provider.ratingCount || 0;
    const newCount = currentCount + 1;
    const newAverageRating = (currentRating * currentCount + rating) / newCount;

    // 6. Create a new Rating
    const createdRating = new Rating({
      booking: bookingId,
      user: userId,
      provider: booking.provider,
      rating,
      review: review || undefined,
    });
    await createdRating.save({ session });

    // 7. Update provider.rating and provider.ratingCount atomically
    await ProviderProfile.findByIdAndUpdate(
      booking.provider,
      {
        $set: { rating: newAverageRating },
        $inc: { ratingCount: 1 },
      },
      { session }
    );

    // 8. Update booking.isRated to true
    // 8. Update booking.isRated to true
    await Booking.findByIdAndUpdate(bookingId, { isRated: true }, { session });

    // Commit transaction
    await session.commitTransaction();

    // 9. Return success response
    return res.status(201).json({
      success: true,
      message: "Rating created successfully",
      data: createdRating,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

export const getProviderRatings = async (req, res, next) => {
  try {
    const providerId = req.params.id;

    // Verify provider exists
    const provider = await ProviderProfile.findById(providerId);
    if (!provider) {
      const err = new Error("Provider not found");
      err.statusCode = 404;
      throw err;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch ratings with populated references
    const ratings = await Rating.find({ provider: providerId })
      .populate("user", "name")
      .populate("booking", "date serviceKey")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Rating.countDocuments({ provider: providerId });

    return res.status(200).json({
      success: true,
      data: ratings,
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
