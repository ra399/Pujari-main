import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
        tls: true
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

