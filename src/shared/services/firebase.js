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
  const requiredConfig = [
    { key: 'apiKey', env: 'VITE_FIREBASE_API_KEY' },
    { key: 'authDomain', env: 'VITE_FIREBASE_AUTH_DOMAIN' },
    { key: 'projectId', env: 'VITE_FIREBASE_PROJECT_ID' },
    { key: 'storageBucket', env: 'VITE_FIREBASE_STORAGE_BUCKET' },
    { key: 'messagingSenderId', env: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
    { key: 'appId', env: 'VITE_FIREBASE_APP_ID' }
  ];
  
  const missingConfig = requiredConfig.filter(item => !firebaseConfig[item.key] || firebaseConfig[item.key].trim() === '');
  
  if (missingConfig.length > 0) {
    console.error('❌ Missing Firebase configuration:');
    missingConfig.forEach(item => {
      console.error(`   - ${item.env} (${item.key})`);
    });
    console.error('');
    console.error('📝 To fix this:');
    console.error('1. Go to your Vercel project settings');
    console.error('2. Navigate to Environment Variables');
    console.error('3. Add all the missing variables listed above');
    console.error('4. Redeploy your application');
    console.error('');
    app = null;
    auth = null;
    db = null;
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('📝 Please check your Firebase configuration in Vercel environment variables.');
  // Set to null so the app can detect Firebase is not available
  app = null;
  auth = null;
  db = null;
}

export { app, auth, db };
