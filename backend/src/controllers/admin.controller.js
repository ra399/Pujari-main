import { successResponse } from "../utils/response.js";
import ProviderProfile from '../models/provider.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import { ROLES } from '../utils/constants.js';

export const dashboard = (req, res) => {
  return successResponse(res, "Admin dashboard placeholder", null);
};


export async function getAllProviders(req, res, next) {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by status if provided
    const filter = {};
    if (req.query.status) {
      const status = req.query.status.toUpperCase();
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({
          message: 'Invalid status. Must be one of: PENDING, APPROVED, REJECTED',
        });
      }
    }

    // Fetch providers with pagination
    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name phone')
      .sort({ _id: -1 }) // Sort by _id desc (time-based, equivalent to createdAt desc)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await ProviderProfile.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: providers,
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
}

export async function updateProviderStatus(req, res, next) {
  try {
    const providerId = req.params.id;
    const newStatus = req.body.status?.toUpperCase();

    if (!newStatus || !['APPROVED', 'REJECTED'].includes(newStatus)) {
      return res.status(400).json({
        message: 'Invalid status. Must be APPROVED or REJECTED',
      });
    }

    const provider = await ProviderProfile.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    provider.status = newStatus;
    provider.isActive = newStatus === 'APPROVED';
    await provider.save();

    // Update user role to PROVIDER if approved
    if (newStatus === 'APPROVED') {
      await User.findByIdAndUpdate(provider.user._id.toString(), {
        role: ROLES.PROVIDER,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Provider ${newStatus.toLowerCase()} successfully`,
      data: provider,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveProvider(req, res, next) {
  try {
    const providerId = req.params.id;

    const provider = await ProviderProfile.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    provider.status = 'APPROVED';
    provider.isActive = true;
    await provider.save();

    await User.findByIdAndUpdate(provider.user._id.toString(), {
      role: ROLES.PROVIDER,
    });

    return res.status(200).json({
      success: true,
      message: 'Provider approved successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectProvider(req, res, next) {
  try {
    const providerId = req.params.id;

    const provider = await ProviderProfile.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    provider.status = 'REJECTED';
    provider.isActive = false;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Provider rejected successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function suspendProvider(req, res, next) {
  try {
    const providerId = req.params.id;

    const provider = await ProviderProfile.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found',
      });
    }

    provider.isActive = false;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Provider suspended successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllBookings(req, res, next) {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by status if provided
    const filter = {};
    if (req.query.status) {
      const status = req.query.status.toUpperCase();
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid startDate format. Use ISO date format (YYYY-MM-DD)',
          });
        }
        startDate.setHours(0, 0, 0, 0);
        filter.date.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid endDate format. Use ISO date format (YYYY-MM-DD)',
          });
        }
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    // Fetch bookings with pagination
    const bookings = await Booking.find(filter)
      .populate('user', 'name phone')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name phone',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);

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
}


