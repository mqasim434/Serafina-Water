/**
 * Firebase Authentication Service
 * 
 * Wrapper around Firebase Auth operations
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase.js';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: any, token: string}>} User object and ID token
 */
export async function signIn(email, password) {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    return {
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: userCredential.user.role || 'staff', // Custom claim or default
      },
      token,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} [displayName] - Display name
 * @returns {Promise<{user: any, token: string}>} User object and ID token
 */
export async function signUp(email, password, displayName = null) {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    const token = await userCredential.user.getIdToken();
    
    return {
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: userCredential.user.role || 'staff',
      },
      token,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current user
 * @returns {Promise<any | null>} Current user or null
 */
export async function getCurrentUser() {
  try {
    if (!auth) {
      return null;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.role || 'staff',
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 * @param {function} callback - Callback function (user) => void
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!auth) {
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role || 'staff',
      });
    } else {
      callback(null);
    }
  });
}
