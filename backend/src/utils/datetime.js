/**
 * Utility functions for date and time operations
 */

/**
 * Checks if the current time has passed the booking start time
 * @param {Date} date - The booking date (stored as midnight UTC)
 * @param {String} startTime - Start time in HH:MM format (24-hour)
 * @returns {Boolean} - True if current time >= booking start time
 * 
 * Note: This function assumes the date is stored in the user's local timezone
 * (as midnight of that day). It reconstructs the actual booking datetime and
 * compares it with the current time.
 */
export function isPastStartTime(date, startTime) {
  if (!date || !startTime) {
    throw new Error('Date and startTime are required');
  }

  // Validate startTime format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime)) {
    throw new Error('startTime must be in HH:MM format');
  }

  // Create a copy of the date to avoid mutation
  const bookingDateTime = new Date(date);
  
  // Parse the start time
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Set the time components on the booking date
  bookingDateTime.setHours(hours, minutes, 0, 0);

  // Compare with current time
  const now = new Date();
  
  return now >= bookingDateTime;
}

/**
 * Converts a time string (HH:MM) to total minutes since midnight
 * @param {String} timeString - Time in HH:MM format
 * @returns {Number} - Total minutes
 */
export function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to time string (HH:MM)
 * @param {Number} totalMinutes - Total minutes since midnight
 * @returns {String} - Time in HH:MM format
 */
export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Checks if the current time has passed the booking end time
 * @param {Date} date - The booking date (stored as midnight UTC)
 * @param {String} endTime - End time in HH:MM format (24-hour)
 * @returns {Boolean} - True if current time >= booking end time
 * 
 * Note: This function assumes the date is stored in the user's local timezone
 * (as midnight of that day). It reconstructs the actual booking datetime and
 * compares it with the current time.
 */
export function isPastEndTime(date, endTime) {
  if (!date || !endTime) {
    throw new Error('Date and endTime are required');
  }

  // Validate endTime format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(endTime)) {
    throw new Error('endTime must be in HH:MM format');
  }

  // Create a copy of the date to avoid mutation
  const bookingDateTime = new Date(date);
  
  // Parse the end time
  const [hours, minutes] = endTime.split(':').map(Number);
  
  // Set the time components on the booking date
  bookingDateTime.setHours(hours, minutes, 0, 0);

  // Compare with current time
  const now = new Date();
  
  return now >= bookingDateTime;
}
