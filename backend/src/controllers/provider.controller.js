import { successResponse } from "../utils/response.js";
import ProviderProfile from "../models/provider.model.js";

function normalizeKey(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

export async function applyAsProvider(req, res, next) {
  try {
    const userId = req.user._id;

    const existing = await ProviderProfile.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        message: "Provider application already exists",
      });
    }

    let { services, location, experienceYears } = req.body;

    // Handle simplified services object from some clients
    if (services && !Array.isArray(services) && typeof services === 'object') {
      services = Object.keys(services)
        .filter(key => services[key] === true)
        .map(key => ({ name: key, key }));
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: "services is required as a non-empty array or toggle object" });
    }

    const normalizedServices = services.map((service, idx) => {
      const name = service?.name;
      if (!name || typeof name !== "string" || !name.trim()) {
        return { __error: `services[${idx}].name is required` };
      }

      const key =
        typeof service.key === "string" && service.key.trim()
          ? service.key
          : normalizeKey(name);

      return { 
        ...service, 
        key,
        price: service.price || 1000,
        duration: service.duration || 60
      };
    });

    const serviceError = normalizedServices.find((s) => s?.__error);
    if (serviceError) {
      return res.status(400).json({ message: serviceError.__error });
    }

    // Handle simplified location string
    if (typeof location === 'string') {
      location = { city: location };
    }

    if (!location || typeof location !== "object") {
      return res.status(400).json({ message: "location is required as an object {city} or string" });
    }

    const normalizedLocation = { ...location };
    const latRaw = normalizedLocation.lat ?? req.body.lat;
    const longRaw = normalizedLocation.long ?? req.body.long;

    if (latRaw !== undefined && longRaw !== undefined) {
      const latitude = Number(latRaw);
      const longitude = Number(longRaw);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({
          message: "location.lat and location.long must be valid numbers",
        });
      }

      normalizedLocation.geo = {
        type: "Point",
        coordinates: [longitude, latitude], // [longitude, latitude]
      };
    }

    const provider = await ProviderProfile.create({
      user: userId,
      services: normalizedServices,
      location: normalizedLocation,
      experienceYears,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Provider application submitted",
      provider,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyProviderProfile(req, res, next) {
  try {
    const profile = await ProviderProfile.findOne({
      user: req.user._id,
    })

    if (!profile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMyProviderProfile(req, res, next) {
  try {
    const allowedUpdates = [
      'bio',
      'services',
      'location',
      'experienceYears',
      'profile_pic',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Normalize services on partial update (do not require services unless provided)
    if (updates.services !== undefined) {
      if (!Array.isArray(updates.services)) {
        return res.status(400).json({ message: "services must be an array" });
      }

      const normalizedServices = updates.services.map((service, idx) => {
        const name = service?.name;
        if (!name || typeof name !== "string" || !name.trim()) {
          return { __error: `services[${idx}].name is required` };
        }

        // Always generate key from name (ignore any client-provided key)
        return { ...service, key: normalizeKey(name) };
      });

      const serviceError = normalizedServices.find((s) => s?.__error);
      if (serviceError) {
        return res.status(400).json({ message: serviceError.__error });
      }

      updates.services = normalizedServices;
    }

    // Normalize location.geo on partial update (only if location is provided)
    if (updates.location !== undefined) {
      if (!updates.location || typeof updates.location !== "object") {
        return res.status(400).json({ message: "location must be an object" });
      }

      const normalizedLocation = { ...updates.location };
      const latRaw = normalizedLocation.lat ?? req.body.lat;
      const longRaw = normalizedLocation.long ?? req.body.long;

      const hasLat = latRaw !== undefined;
      const hasLong = longRaw !== undefined;

      if (hasLat || hasLong) {
        if (!hasLat || !hasLong) {
          return res.status(400).json({
            message: "Both location.lat and location.long are required",
          });
        }

        const latitude = Number(latRaw);
        const longitude = Number(longRaw);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return res.status(400).json({
            message: "location.lat and location.long must be valid numbers",
          });
        }

        normalizedLocation.geo = {
          type: "Point",
          coordinates: [longitude, latitude], // [longitude, latitude]
        };
      }

      updates.location = normalizedLocation;
    }

    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function toggleProviderActive(req, res, next) {
  try {
    const profile = await ProviderProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    if (profile.status !== 'APPROVED') {
      return res.status(403).json({
        message: 'Provider not approved yet',
      });
    }

    profile.isActive = !profile.isActive;
    await profile.save();

    res.json({
      message: 'Provider active status updated',
      isActive: profile.isActive,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProviderBookings(req, res, next) {
  try {
    const profile = await ProviderProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const Booking = (await import('../models/booking.model.js')).default;

    const query = { provider: profile._id };

    // Date Filters
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const bookings = await Booking.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate('user', 'name phone')
      .lean();

    res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveBooking(req, res, next) {
  try {
    const bookingId = req.params.id;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Find provider profile for current user
    const providerProfile = await ProviderProfile.findOne({
      user: req.user._id,
    });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const Booking = (await import('../models/booking.model.js')).default;
    const { updateAvailabilityOnApproval } = await import('../services/booking.service.js');

    // Fetch booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure booking status is PENDING
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Cannot approve booking with status ${booking.status}` 
      });
    }

    // Ensure req.user is the booking's provider
    if (booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({ 
        message: 'You are not authorized to approve this booking' 
      });
    }

    // Call updateAvailabilityOnApproval to split/adjust slots
    await updateAvailabilityOnApproval(
      providerProfile,
      booking.date,
      booking.startTime,
      booking.endTime
    );

    // Set booking status to APPROVED
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'APPROVED' },
      { new: true }
    ).populate('user', 'name phone').lean();

    res.json({
      success: true,
      message: 'Booking approved successfully',
      data: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectBooking(req, res, next) {
  try {
    const bookingId = req.params.id;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Find provider profile for current user
    const providerProfile = await ProviderProfile.findOne({
      user: req.user._id,
    });

    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const Booking = (await import('../models/booking.model.js')).default;

    // Fetch booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure booking status is PENDING
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Cannot reject booking with status ${booking.status}` 
      });
    }

    // Ensure req.user is the booking's provider
    if (booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({ 
        message: 'You are not authorized to reject this booking' 
      });
    }

    // Update status to REJECTED
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'REJECTED' },
      { new: true }
    ).populate('user', 'name phone').lean();

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: updatedBooking,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProviderStats(req, res, next) {
  try {
    const profile = await ProviderProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const Booking = (await import('../models/booking.model.js')).default;
    
    // Total bookings
    const totalBookings = await Booking.countDocuments({ provider: profile._id });
    
    // This month bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthBookings = await Booking.countDocuments({ 
      provider: profile._id,
      createdAt: { $gte: startOfMonth }
    });
    
    // Pending requests
    const pendingRequests = await Booking.countDocuments({ 
      provider: profile._id,
      status: 'PENDING'
    });

    // Calculate real average rating from Rating collection
    const Rating = (await import('../models/rating.model.js')).default;
    const ratingStats = await Rating.aggregate([
      { $match: { provider: profile._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    const realAvgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    const realRatingCount = ratingStats.length > 0 ? ratingStats[0].count : 0;

    // Self-healing: Update profile if mismatch
    if (profile.rating !== realAvgRating || profile.ratingCount !== realRatingCount) {
        console.log(`🔧 Self-healing provider rating. Old: ${profile.rating} (${profile.ratingCount}), New: ${realAvgRating} (${realRatingCount})`);
        
        // Use findByIdAndUpdate to bypass full document validation (which fails on missing 'duration' in legacy services)
        await ProviderProfile.findByIdAndUpdate(profile._id, {
            rating: realAvgRating,
            ratingCount: realRatingCount
        });
    }

    res.json({
      success: true,
      data: {
        totalBookings,
        thisMonthBookings,
        avgRating: realAvgRating, // Return the calculated real average
        pendingRequests
      }
    });
  } catch (err) {
    next(err);
  }
}
