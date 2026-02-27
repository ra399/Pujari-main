import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://root:root@cluster0.u5wfops.mongodb.net/?appName=Cluster0";
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY 
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL 
export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
