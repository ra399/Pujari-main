import Provider from "../models/provider.model.js";
import ProviderAvailability from "../models/providerAvailability.model.js";
import Booking from "../models/booking.model.js";
import { ApiError } from "../utils/constants.js";
import { isPastEndTime } from "../utils/datetime.js";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(value, fieldName) {
  if (typeof value !== "string" || !TIME_24H_REGEX.test(value)) {
    throw new ApiError(`${fieldName} must be in HH:mm format`, 400);
  }
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizeDateOnly(input) {
  const d = input instanceof Date ? new Date(input) : new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError("date must be a valid date", 400);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Validates a booking request against provider/service/availability and existing bookings.
 *
 * Requirements:
 * 1) Provider exists
 * 2) Provider status is APPROVED and isActive = true
 * 3) serviceKey exists in provider.services
 * 4) Requested time is within provider availability for that date
 * 5) No overlap with existing APPROVED bookings:
 *    start < existingEnd && end > existingStart
 */
export async function validateBookingRequest({
  providerId,
  serviceKey,
  date,
  startTime,
  endTime,
}) {
  if (!providerId) throw new ApiError("provider is required", 400);
  if (!serviceKey) throw new ApiError("serviceKey is required", 400);
  if (!date) throw new ApiError("date is required", 400);
  if (!startTime) throw new ApiError("startTime is required", 400);
  if (!endTime) throw new ApiError("endTime is required", 400);

  const provider = await Provider.findById(providerId);
  if (!provider) throw new ApiError("Provider not found", 404);

  if (provider.status !== "APPROVED") {
    throw new ApiError("Provider is not approved", 403);
  }
  if (provider.isActive !== true) {
    throw new ApiError("Provider is not active", 403);
  }

  const service = Array.isArray(provider.services)
    ? provider.services.find((s) => s?.key === serviceKey)
    : undefined;
  if (!service) {
    throw new ApiError("Invalid serviceKey for this provider", 400);
  }

  const dateOnly = normalizeDateOnly(date);
  const requestedStart = parseTimeToMinutes(startTime, "startTime");
  const requestedEnd = parseTimeToMinutes(endTime, "endTime");

  if (requestedEnd <= requestedStart) {
    throw new ApiError("endTime must be after startTime", 400);
  }

  const dayOfWeek = dateOnly.getDay(); // 0 (Sun) - 6 (Sat)

  const availabilitySlots = await ProviderAvailability.find({
    providerId: provider._id,
    dayOfWeek,
    isActive: true,
  });

  if (!availabilitySlots || availabilitySlots.length === 0) {
    throw new ApiError("Provider is not available on the selected date", 400);
  }

  const withinSomeSlot = availabilitySlots.some((slot) => {
    try {
      const slotStart = parseTimeToMinutes(slot.startTime, "startTime");
      const slotEnd = parseTimeToMinutes(slot.endTime, "endTime");
      return requestedStart >= slotStart && requestedEnd <= slotEnd;
    } catch {
      // If provider availability data is malformed, treat it as not available.
      return false;
    }
  });

  if (!withinSomeSlot) {
    throw new ApiError(
      "Requested time is outside provider availability for the selected date",
      400
    );
  }

  const nextDay = new Date(dateOnly);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingBookings = await Booking.find({
    provider: provider._id,
    status: { $in: ["PENDING", "APPROVED"] },
    date: { $gte: dateOnly, $lt: nextDay },
  }).select("startTime endTime");

  const overlapsExisting = existingBookings.some((b) => {
    // booking times are validated by schema; still guard just in case
    if (!b?.startTime || !b?.endTime) return false;
    const existingStart = parseTimeToMinutes(b.startTime, "startTime");
    const existingEnd = parseTimeToMinutes(b.endTime, "endTime");
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });

  if (overlapsExisting) {
    throw new ApiError(
      "Requested time overlaps an existing approved booking",
      409
    );
  }

  return { provider, service, dateOnly };
}

/**
 * Updates provider availability by splitting/adjusting slots when a booking is approved.
 *
 * @param {Object} provider - The provider document (with _id)
 * @param {Date} date - The booking date
 * @param {string} startTime - Booking start time in HH:mm format
 * @param {string} endTime - Booking end time in HH:mm format
 * @throws {ApiError} if no matching availability slot is found
 */
export async function updateAvailabilityOnApproval(provider, date, startTime, endTime) {
  if (!provider?._id) throw new ApiError("provider is required", 400);
  if (!date) throw new ApiError("date is required", 400);
  if (!startTime) throw new ApiError("startTime is required", 400);
  if (!endTime) throw new ApiError("endTime is required", 400);

  const dateOnly = normalizeDateOnly(date);
  const dayOfWeek = dateOnly.getDay();

  const bookingStart = parseTimeToMinutes(startTime, "startTime");
  const bookingEnd = parseTimeToMinutes(endTime, "endTime");

  // Find all active availability slots for this day of week
  const availabilitySlots = await ProviderAvailability.find({
    providerId: provider._id,
    dayOfWeek,
    isActive: true,
  });

  if (!availabilitySlots || availabilitySlots.length === 0) {
    throw new ApiError(
      "No availability slots found for the booking date",
      400
    );
  }

  // Find the slot that fully contains the booking
  let matchingSlot = null;
  for (const slot of availabilitySlots) {
    try {
      const slotStart = parseTimeToMinutes(slot.startTime, "startTime");
      const slotEnd = parseTimeToMinutes(slot.endTime, "endTime");
      
      // Check if booking is fully contained within this slot
      if (bookingStart >= slotStart && bookingEnd <= slotEnd) {
        matchingSlot = { slot, slotStart, slotEnd };
        break;
      }
    } catch {
      // Skip malformed slots
      continue;
    }
  }

  if (!matchingSlot) {
    throw new ApiError(
      "No availability slot fully contains the booking time",
      400
    );
  }

  const { slot, slotStart, slotEnd } = matchingSlot;

  // Apply slot-splitting rules
  const touchesStart = bookingStart === slotStart;
  const touchesEnd = bookingEnd === slotEnd;

  if (touchesStart && touchesEnd) {
    // Booking fully consumes the slot - remove it
    await ProviderAvailability.findByIdAndDelete(slot._id);
  } else if (touchesStart) {
    // Booking touches start edge - adjust slot to start after booking
    slot.startTime = minutesToTimeString(bookingEnd);
    await slot.save();
  } else if (touchesEnd) {
    // Booking touches end edge - adjust slot to end before booking
    slot.endTime = minutesToTimeString(bookingStart);
    await slot.save();
  } else {
    // Booking is inside slot - split into two slots
    // Update existing slot to be the first part (before booking)
    slot.endTime = minutesToTimeString(bookingStart);
    await slot.save();

    // Create new slot for the second part (after booking)
    await ProviderAvailability.create({
      providerId: provider._id,
      dayOfWeek,
      startTime: minutesToTimeString(bookingEnd),
      endTime: minutesToTimeString(slotEnd),
      isActive: true,
    });
  }

  return { success: true };
}

/**
 * Throws if an availability slot overlaps with any approved bookings OR existing availability slots on the same weekday
 * Used when adding or updating an availability slot.
 * @param {ObjectId} providerId
 * @param {number} dayOfWeek
 * @param {string} startTime
 * @param {string} endTime
 * @param {ObjectId|null} slotIdToSkip Optional, to prevent false positive when updating
 */
export async function ensureNoBookingConflictWithAvailability(providerId, dayOfWeek, startTime, endTime, slotIdToSkip = null) {
  if (!providerId || startTime == null || endTime == null || dayOfWeek == null) {
    throw new ApiError('Missing arguments for booking-conflict check', 400);
  }
  const slotStart = parseTimeToMinutes(startTime, 'startTime');
  const slotEnd = parseTimeToMinutes(endTime, 'endTime');
  if (slotEnd <= slotStart) throw new ApiError('endTime must be after startTime', 400);

  // Check 1: Overlapping existing availability slots
  const existingSlots = await ProviderAvailability.find({
    providerId,
    dayOfWeek,
    isActive: true,
  }).lean();

  const hasSlotOverlap = existingSlots.some(slot => {
    // Skip self when updating
    if (slotIdToSkip && slot._id.toString() === slotIdToSkip.toString()) {
      return false;
    }
    try {
      const existingStart = parseTimeToMinutes(slot.startTime, 'startTime');
      const existingEnd = parseTimeToMinutes(slot.endTime, 'endTime');
      // Check for overlap
      return slotStart < existingEnd && slotEnd > existingStart;
    } catch {
      return false;
    }
  });

  if (hasSlotOverlap) {
    throw new ApiError(
      'This availability slot overlaps with an existing availability slot. Please use a different time range.',
      409
    );
  }

  // Check 2: Overlapping approved bookings for this weekday
  const bookings = await Booking.find({
    provider: providerId,
    status: 'APPROVED',
  }).lean();

  const hasBookingOverlap = bookings.some(b => {
    const bookingDate = new Date(b.date);
    if (bookingDate.getDay() !== dayOfWeek) return false;
    const bookingStart = parseTimeToMinutes(b.startTime, 'startTime');
    const bookingEnd = parseTimeToMinutes(b.endTime, 'endTime');
    // Check for overlap
    return slotStart < bookingEnd && slotEnd > bookingStart;
  });
  
  if (hasBookingOverlap) {
    throw new ApiError(
      'This availability slot overlaps with an existing approved booking. Reduce or change your slot time.',
      409
    );
  }
}

/**
 * Automatically completes bookings that are APPROVED and whose endTime has passed
 * This function is meant to be called by a cron job
 * @returns {Promise<{ completedCount: number, bookingIds: Array }>}
 */
export async function autoCompleteBookings() {
  try {
    // Find all APPROVED bookings
    const approvedBookings = await Booking.find({
      status: "APPROVED"
    }).select("_id date endTime status");

    const bookingsToComplete = [];

    // Check each booking to see if endTime has passed
    for (const booking of approvedBookings) {
      try {
        if (isPastEndTime(booking.date, booking.endTime)) {
          bookingsToComplete.push(booking._id);
        }
      } catch (err) {
        // Skip bookings with invalid date/time data
        console.error(`Error checking booking ${booking._id}:`, err.message);
        continue;
      }
    }

    // Update all bookings that need to be completed
    if (bookingsToComplete.length > 0) {
      const result = await Booking.updateMany(
        { _id: { $in: bookingsToComplete } },
        { $set: { status: "COMPLETED" } }
      );

      console.log(`Auto-completed ${result.modifiedCount} booking(s)`);
      
      return {
        completedCount: result.modifiedCount,
        bookingIds: bookingsToComplete
      };
    }

    return {
      completedCount: 0,
      bookingIds: []
    };
  } catch (err) {
    console.error("Error in autoCompleteBookings:", err);
    throw err;
  }
}
