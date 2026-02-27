/**
 * Script to generate a Firebase ID token for backend testing
 * Uses Firebase Admin SDK
 *
 * Usage:
 *   node scripts/generate_firebase_idtoken.js <uid> <phoneNumber>
 *
 * Example:
 *   node scripts/generate_firebase_idtoken.js testuser1 +919999999999
 */

import fetch from 'node-fetch';
import admin from '../config/firebase.js';
import { FIREBASE_API_KEY } from '../config/env.js';

if (!FIREBASE_API_KEY) {
  console.error('❌ FIREBASE_API_KEY is missing in .env');
  process.exit(1);
}

const uid = process.argv[2] || `testuser_${Date.now()}`;
const phoneNumber = process.argv[3];

if (!phoneNumber) {
  console.error('❌ Phone number required (E.164 format)');
  console.error('Example: +919999999999');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔍 Checking Firebase user:', uid);

    let userRecord;

    try {
      // Try fetching existing user
      userRecord = await admin.auth().getUser(uid);
      console.log('✅ Firebase user exists');
    } catch (err) {
      // Create user if not exists
      console.log('🆕 Creating Firebase user');
      userRecord = await admin.auth().createUser({
        uid,
        phoneNumber,
        displayName: 'Test User',
      });
    }

    // Ensure phone number is set
    if (!userRecord.phoneNumber) {
      console.log('📱 Updating phone number');
      await admin.auth().updateUser(uid, { phoneNumber });
    }

    // Create custom token
    console.log('🔑 Creating custom token');
    const customToken = await admin.auth().createCustomToken(uid);

    // Exchange custom token for ID token
    console.log('🔄 Exchanging custom token for ID token');
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    const data = await resp.json();

    if (data.error) {
      console.error('❌ Error exchanging token:', data.error);
      process.exit(1);
    }

    const idToken = data.idToken;

    console.log('\n🎉 SUCCESS: Firebase ID Token generated\n');
    console.log(idToken);

    console.log('\n📌 Test backend login using curl:\n');
    console.log(`
curl -X POST http://localhost:5000/api/auth/firebase-login \\
  -H "Content-Type: application/json" \\
  -d '{
    "idToken": "${idToken}"
  }'
`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

run();
