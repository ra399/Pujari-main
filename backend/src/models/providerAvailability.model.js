import mongoose from "mongoose";

const providerAvailabilitySchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 , required : true},
    startTime: { type: String , required : true}, // expected format "HH:MM"
    endTime: { type: String , required : true},   // expected format "HH:MM"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("ProviderAvailability", providerAvailabilitySchema);
