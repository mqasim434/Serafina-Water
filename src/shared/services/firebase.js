/**
 * Firebase Configuration and Services
 * 
 * Centralized Firebase initialization and service exports
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// These should be set via environment variables in production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  // Validate that all required config values are present
  const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);
  
  if (missingConfig.length > 0) {
    console.error('Missing Firebase configuration:', missingConfig);
    console.error('Please set all Firebase environment variables in Vercel/your hosting platform.');
    app = null;
    auth = null;
    db = null;
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Firebase is required for this application. Please configure Firebase environment variables.');
  // Set to null so the app can detect Firebase is not available
  app = null;
  auth = null;
  db = null;
}

export { app, auth, db };
