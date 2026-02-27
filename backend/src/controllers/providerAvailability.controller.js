import ProviderAvailability from "../models/providerAvailability.model.js";
import ProviderProfile from "../models/provider.model.js";

/**
 * Helper function to restore availability when a booking is canceled
 * @param {Object} provider - The provider object (ProviderProfile)
 * @param {Date} date - The date of the canceled booking
 * @param {String} startTime - Start time in HH:MM format
 * @param {String} endTime - End time in HH:MM format
 */
export async function restoreAvailabilityOnCancel(provider, date, startTime, endTime) {
  // Get day of the week from the date (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Fetch all existing availability slots for this provider and day
  const existingSlots = await ProviderAvailability.find({
    providerId: provider._id,
    dayOfWeek: dayOfWeek,
    isActive: true,
  }).sort({ startTime: 1 });

  // Add the canceled slot to the list
  const allSlots = [
    ...existingSlots.map(slot => ({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
    { startTime, endTime, isNew: true },
  ];

  // Sort all slots by startTime
  allSlots.sort((a, b) => {
    const [aHour, aMin] = a.startTime.split(':').map(Number);
    const [bHour, bMin] = b.startTime.split(':').map(Number);
    const aMinutes = aHour * 60 + aMin;
    const bMinutes = bHour * 60 + bMin;
    return aMinutes - bMinutes;
  });

  // Merge adjacent or overlapping slots
  const mergedSlots = [];
  let current = null;

  for (const slot of allSlots) {
    if (!current) {
      current = { ...slot };
      continue;
    }

    // Convert times to minutes for comparison
    const [currEndHour, currEndMin] = current.endTime.split(':').map(Number);
    const [slotStartHour, slotStartMin] = slot.startTime.split(':').map(Number);
    const currEndMinutes = currEndHour * 60 + currEndMin;
    const slotStartMinutes = slotStartHour * 60 + slotStartMin;

    // Check if slots are adjacent or overlapping
    if (slotStartMinutes <= currEndMinutes) {
      // Merge: extend current slot to the maximum end time
      const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      
      if (slotEndMinutes > currEndMinutes) {
        current.endTime = slot.endTime;
      }
      
      // Keep track of IDs to delete (if not the new slot)
      if (!slot.isNew && slot._id) {
        current.mergedIds = current.mergedIds || [];
        current.mergedIds.push(slot._id);
      }
    } else {
      // No overlap, save current and start new
      mergedSlots.push(current);
      current = { ...slot };
    }
  }

  // Don't forget the last slot
  if (current) {
    mergedSlots.push(current);
  }

  // Now update the database:
  // 1. Delete all old slots for this day
  const slotIdsToDelete = existingSlots.map(s => s._id);
  await ProviderAvailability.deleteMany({
    _id: { $in: slotIdsToDelete },
  });

  // 2. Create new merged slots
  const newSlots = mergedSlots.map(slot => ({
    providerId: provider._id,
    dayOfWeek: dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isActive: true,
  }));

  await ProviderAvailability.insertMany(newSlots);

  return mergedSlots;
}

export async function addAvailability(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({ user: req.user._id });

    if (!provider || provider.status !== "APPROVED") {
      return res.status(403).json({ message: "Provider not approved" });
    }

    const { dayOfWeek, startTime, endTime } = req.body;

    // Check for conflicts with approved bookings
    const { ensureNoBookingConflictWithAvailability } = await import("../services/booking.service.js");
    await ensureNoBookingConflictWithAvailability(provider._id, dayOfWeek, startTime, endTime);

    const slot = await ProviderAvailability.create({
      providerId: provider._id,
      dayOfWeek,
      startTime,
      endTime,
    });

    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}

export async function getMyAvailability(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({ user: req.user._id });
    if (!provider) {
      return res.json([]);
    }
    const slots = await ProviderAvailability.find({
      providerId: provider._id,
    });

    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({ user: req.user._id });
    if (!provider) {
      return res.status(403).json({ message: "Provider profile not found" });
    }

    const slot = await ProviderAvailability.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    console.log(slot);

    if (slot.providerId.toString() !== provider._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updates = (({ startTime, endTime, isActive }) => ({
      startTime,
      endTime,
      isActive,
    }))(req.body);

    Object.keys(updates).forEach(
      (k) => updates[k] === undefined && delete updates[k]
    );

    // Check for booking conflicts if updating startTime/endTime/dayOfWeek
    const { ensureNoBookingConflictWithAvailability } = await import("../services/booking.service.js");
    const updatedDayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : slot.dayOfWeek;
    const updatedStartTime = updates.startTime !== undefined ? updates.startTime : slot.startTime;
    const updatedEndTime = updates.endTime !== undefined ? updates.endTime : slot.endTime;
    await ensureNoBookingConflictWithAvailability(slot.providerId, updatedDayOfWeek, updatedStartTime, updatedEndTime, slot._id);

    Object.assign(slot, updates);
    await slot.save();

    res.json(slot);
  } catch (err) {
    next(err);
  }
}

export async function deleteAvailability(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({ user: req.user._id });
    const slot = await ProviderAvailability.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (!provider || slot.providerId.toString() !== provider._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await ProviderAvailability.findByIdAndDelete(req.params.id);
    res.json({ message: "Availability removed" });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdateAvailability(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({ user: req.user._id });
    if (!provider || provider.status !== "APPROVED") {
      return res.status(403).json({ message: "Provider not approved or profile not found" });
    }

    const { availability } = req.body; // Array of objects { dayOfWeek, slots: [{ startTime, endTime }] }

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: "availability must be an array" });
    }

    // 1. Delete all existing availability for this provider
    await ProviderAvailability.deleteMany({ providerId: provider._id });

    // 2. Insert new slots
    const newSlots = [];
    for (const day of availability) {
      const { dayOfWeek, slots } = day;
      if (Array.isArray(slots)) {
        for (const slot of slots) {
          newSlots.push({
            providerId: provider._id,
            dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true
          });
        }
      }
    }

    if (newSlots.length > 0) {
      await ProviderAvailability.insertMany(newSlots);
    }

    res.json({ success: true, message: "Availability updated successfully" });
  } catch (err) {
    next(err);
  }
}

