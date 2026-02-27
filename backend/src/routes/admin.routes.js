import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(requireAuth);
router.use(roleMiddleware(ROLES.ADMIN));

router.get("/dashboard", adminController.dashboard);
router.get("/providers", adminController.getAllProviders);
router.get("/bookings", adminController.getAllBookings);
router.patch('/provider/:id/approve', adminController.approveProvider);
router.patch('/provider/:id/reject', adminController.rejectProvider);
router.patch('/provider/:id/suspend', adminController.suspendProvider);
  

export default router;

