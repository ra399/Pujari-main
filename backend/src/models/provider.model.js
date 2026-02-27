import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  religion: { type: String },
  services: {
    type: [
      {
        key: { type: String, required: true },
        name: {type: String, required: true},
        price: {type: Number, required: true},
        duration: {type: Number, required: true},
        description: {type: String, default: ''},
      },
    ],
    required: true,
  },
  docs: { type: String },
  location: {
    type: {
      city: String,
      lat: String,
      long: String,
      geo: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" }, // [longitude, latitude]
      },
    },
    required: true,
  },
  experienceYears: { type: Number },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'] , default : 'PENDING'},
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isActive: {
    type: Boolean,
    default: false,
    validate: {
      validator: function (v) {
        if (v === true) {
          return this.status === "APPROVED";
        }
        return true;
      },
      message: "isActive can be true only when status is APPROVED"
    }
  },
  bio: { type: String },
  profile_pic: { type: String },
  languages: { type: [String], default: ['Hindi'] },
}, { timestamps: { createdAt: false, updatedAt: false } });

providerSchema.index({ "location.geo": "2dsphere" });

export default mongoose.model("Provider", providerSchema);

