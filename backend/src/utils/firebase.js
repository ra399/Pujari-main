import admin from '../config/firebase.js';

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) {
    const err = new Error('Missing Firebase ID token');
    err.status = 400;
    throw err;
  }
  try {
    // verifyIdToken throws if invalid
    const decoded = await admin.auth().verifyIdToken(idToken);
    // decoded contains uid, phone_number, email, etc.
    return decoded;
  } catch (error) {
    const err = new Error('Invalid Firebase ID token');
    err.status = 401;
    throw err;
  }
}

