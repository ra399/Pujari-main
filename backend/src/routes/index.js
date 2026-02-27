import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import providerRoutes from "./provider.routes.js";
// Added per latest prompt
import userRoutesTest from "./user.routes.js";
import providerAvailabilityRoutes from "./providerAvailability.routes.js";
import bookingRoutes from "./booking.routes.js";
import adminRoutes from "./admin.routes.js";
import ratingRoutes from "./rating.routes.js";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
// Added test route mount
router.use("/user", userRoutesTest);
router.use("/providers", providerRoutes);
router.use("/provider/availability", providerAvailabilityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/admin", adminRoutes);
router.use("/ratings", ratingRoutes);

export default router;

