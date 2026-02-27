import cron from "node-cron";
import { autoCompleteBookings } from "../../services/booking.service.js";

export function startBookingCron() {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running booking auto-completion...");
      await autoCompleteBookings();
    } catch (err) {
      console.error("Booking cron failed", err);
    }
  });
}
