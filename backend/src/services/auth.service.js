import User from '../models/user.model.js';
import { signToken } from '../utils/jwt.js';

export async function findOrCreateUserByPhone(decoded) {
  // decoded from Firebase includes phone_number, uid, name/email sometimes
  const phone = decoded.phone_number || decoded.phone || decoded.phoneNumber;
  if (!phone) {
    const err = new Error('Firebase token does not contain phone number');
    err.status = 400;
    throw err;
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({
      phone,
      email: decoded.email || '',
      name: decoded.name || '',
      authProvider: 'firebase',
      isPhoneVerified: true,
    });
    await user.save();
  }
  return user;
}

export function generateJwtForUser(user) {
  // minimal payload; avoid leaking sensitive info
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    phone: user.phone,
  };
  const token = signToken(payload, '30d'); 
  return token;
}

