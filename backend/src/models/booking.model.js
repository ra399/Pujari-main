import mongoose from "mongoose";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
    serviceKey: { type: String, required: true },
    date: {
      type: Date,
      required: true,
      // Store only the date component (midnight local time).
      set: (value) => {
        const d = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
    startTime: {
      type: String,
      required: true,
      match: [TIME_24H_REGEX, "startTime must be in HH:mm format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [TIME_24H_REGEX, "endTime must be in HH:mm format"],
    },
    price: { type: Number, required: true },
    serviceAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },
    cancellationReason: { type: String },
    isRated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

