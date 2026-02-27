import express from "express";
import { createRating, getProviderRatings } from "../controllers/rating.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST /api/ratings
router.post("/", requireAuth, createRating);

// GET /api/providers/:id/ratings - Public route
router.get("/providers/:id/ratings", getProviderRatings);

export default router;
