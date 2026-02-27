import User from "../models/user.model.js";
import { successResponse } from "../utils/response.js";

export const getProfile = (req, res) => {
  return successResponse(res, "Profile fetched", req.user);
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, city, bio, role, profile_pic } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email !== undefined) user.email = email; // Allow empty string
    if (city) user.city = city;
    if (bio !== undefined) user.bio = bio; // Allow empty string
    if (role) user.role = role;
    if (profile_pic) user.profile_pic = profile_pic;
    
    user.isProfileComplete = true;
    await user.save();

    return successResponse(res, "Profile updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = (req, res) => {
  res.json({ success: true, user: req.user });
};

import ProviderProfile from "../models/provider.model.js";

export const uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const imageUrl = req.file.path;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.profile_pic = imageUrl;
    await user.save();

    // If user is a provider, also update their provider profile pic
    if (user.role === 'PROVIDER') {
      await ProviderProfile.findOneAndUpdate(
        { user: user._id },
        { profile_pic: imageUrl }
      );
    }

    return successResponse(res, "Profile picture updated successfully", { 
      user,
      url: imageUrl 
    });
  } catch (error) {
    next(error);
  }
};

