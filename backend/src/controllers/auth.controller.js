import { successResponse } from '../utils/response.js';
import { verifyFirebaseIdToken } from '../utils/firebase.js';
import { findOrCreateUserByPhone, generateJwtForUser } from '../services/auth.service.js';


export async function firebaseLogin(req, res, next) {
  console.log('📬 Received firebase-login request');
  try {
    const { idToken } = req.body;
    if (!idToken) {
      console.log('❌ No idToken in request');
      return res.status(400).json({ success: false, message: 'idToken required' });
    }
    console.log('🔑 Verifying Firebase ID Token...');
    const decoded = await verifyFirebaseIdToken(idToken);
    console.log('✅ Token verified. Phone:', decoded.phone_number);
    
    const user = await findOrCreateUserByPhone(decoded);
    console.log('👤 User found/created:', user._id);
    
    const jwt = generateJwtForUser(user);
    console.log('🎫 JWT generated');
    
    return successResponse(res, 'Login success', { token: jwt, user });
  } catch (err) {
    console.error('💥 Firebase login error:', err);
    return next(err);
  }
}

/**
 * Get current authenticated user
 * Requires: requireAuth middleware
 */
export async function getCurrentUser(req, res, next) {
  try {
    // req.user is set by requireAuth middleware
    console.log('📋 getCurrentUser - User from middleware:', {
      id: req.user._id,
      role: req.user.role,
      isProfileComplete: req.user.isProfileComplete,
      name: req.user.name
    });
    
    return successResponse(res, 'User retrieved', { user: req.user });
  } catch (err) {
    console.error('❌ getCurrentUser error:', err);
    return next(err);
  }
}
