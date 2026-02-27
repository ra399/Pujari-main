import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  gateway: { type: String },
  txn_id: { type: String },
  status: { type: String },
}, { timestamps: { createdAt: "created_at" } });

export default mongoose.model("Payment", paymentSchema);

