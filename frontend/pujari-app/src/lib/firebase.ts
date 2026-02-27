import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    initializeAuth,
    getAuth,
    onAuthStateChanged,
    signOut,
    PhoneAuthProvider,
    signInWithCredential
} from 'firebase/auth';

import * as FirebaseAuth from 'firebase/auth';
const { getReactNativePersistence } = FirebaseAuth as any;
import AsyncStorage from '@react-native-async-storage/async-storage';

// Real Firebase configuration from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyCeLVXkF2p6Egjvnn91450jf6rfESvq8g0",
    authDomain: "pujari-70dba.firebaseapp.com",
    projectId: "pujari-70dba",
    storageBucket: "pujari-70dba.firebasestorage.app",
    messagingSenderId: "482275440096",
    appId: "1:482275440096:android:a1e1cdcb5ea0b682e72785"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with Persistence
// This is required for React Native to maintain the user's session
let auth;
try {
    // Try to get existing auth instance (prevents errors during Hot Reload)
    auth = getAuth(app);
} catch (e) {
    // If not initialized, initialize with AsyncStorage persistence
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
}

export { app, auth, onAuthStateChanged, signOut, PhoneAuthProvider, signInWithCredential };
