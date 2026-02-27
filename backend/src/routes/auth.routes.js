import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/firebase-login', authController.firebaseLogin);
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;


