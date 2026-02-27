import express from "express";
import * as providerController from "../controllers/provider.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { ROLES } from "../utils/constants.js";
import { listProviders, getProviderDetails, getAllServices, getSearchSuggestions } from "../controllers/publicProvider.controller.js";

const router = express.Router();

// Public Specific Routes
router.get("/services", getAllServices);
router.get("/suggestions", getSearchSuggestions);
router.get("/", listProviders);

// Protected Routes
router.post("/apply", requireAuth, providerController.applyAsProvider);

// Provider Role Routes
const providerAuth = [requireAuth, roleMiddleware(ROLES.PROVIDER)];

router.get('/me', ...providerAuth, providerController.getMyProviderProfile);
router.get('/stats', ...providerAuth, providerController.getProviderStats);
router.get('/bookings', ...providerAuth, providerController.getProviderBookings);
router.patch('/me', ...providerAuth, providerController.updateMyProviderProfile);
router.patch('/me/active', ...providerAuth, providerController.toggleProviderActive);
router.patch('/bookings/:id/approve', ...providerAuth, providerController.approveBooking);
router.patch('/bookings/:id/reject', ...providerAuth, providerController.rejectBooking);

// Public Generic Route (Must be last)
router.get("/:id", getProviderDetails);

export default router;

