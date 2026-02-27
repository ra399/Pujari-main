import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  role: { type: String, enum: ["USER", "PROVIDER", "ADMIN"], default: "USER" },
  profile_pic: { type: String },
  city: { type: String },
  location: { type: String },
  bio: { type: String },
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: "" },
  authProvider: { type: String, enum: ["firebase", "local"], default: "firebase" },
  isPhoneVerified: { type: Boolean, default: true },
  isProfileComplete: { type: Boolean, default: false },
}, { timestamps: { createdAt: "created_at" } });

export default mongoose.model("User", userSchema);

