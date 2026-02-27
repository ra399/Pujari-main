import express from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { ROLES } from "../utils/constants.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/me", requireAuth, roleMiddleware(ROLES.USER , ROLES.PROVIDER), userController.getProfile);
router.patch("/profile", requireAuth, userController.updateProfile);
router.put("/profile", requireAuth, userController.updateProfile);
router.get("/", userController.getUsers);
router.post("/upload-profile-pic", requireAuth, upload.single('image'), userController.uploadProfilePic);

export default router;
