import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment');
}

export function signToken(payload, expiresIn = "1d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
