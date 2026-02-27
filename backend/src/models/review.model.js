import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: { createdAt: "created_at" } });

export default mongoose.model("Review", reviewSchema);

