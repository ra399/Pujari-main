import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.model.js';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      const err = new Error('Authorization header missing');
      err.status = 401;
      throw err;
    }
    const token = auth.split(' ')[1];
    const payload = verifyToken(token);
    // attach user
    const user = await User.findById(payload.sub).select('-__v');
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

