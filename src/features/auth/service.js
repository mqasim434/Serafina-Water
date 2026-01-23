/**
 * Authentication Service
 * 
 * Business logic and calculations for authentication
 * Uses Firestore users collection for authentication
 * Auth tokens and user session stored in localStorage (client-side only)
 */

import { localStorageService } from '../../shared/services/localStorage.js';
import * as usersService from '../users/service.js';

const STORAGE_KEYS = {
  USER: 'auth_user',
  TOKEN: 'auth_token',
};

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
export function isValidRole(role) {
  return role === 'admin' || role === 'staff';
}

/**
 * Check if user has admin role
 * @param {import('./types.js').User | null} user - User object
 * @returns {boolean} True if user is admin
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Check if user has staff role
 * @param {import('./types.js').User | null} user - User object
 * @returns {boolean} True if user is staff
 */
export function isStaff(user) {
  return user?.role === 'staff';
}

/**
 * Check if user has required role
 * @param {import('./types.js').User | null} user - User object
 * @param {import('./types.js').UserRole} requiredRole - Required role
 * @returns {boolean} True if user has required role
 */
export function hasRole(user, requiredRole) {
  if (!user) return false;
  if (requiredRole === 'admin') return user.role === 'admin';
  if (requiredRole === 'staff') return user.role === 'staff' || user.role === 'admin';
  return false;
}

/**
 * Persist user to localStorage (client-side only)
 * @param {import('./types.js').User} user - User to persist
 * @returns {Promise<void>}
 */
export async function persistUser(user) {
  localStorageService.setItem(STORAGE_KEYS.USER, user);
}

/**
 * Persist token to localStorage (client-side only)
 * @param {string} token - Token to persist
 * @returns {Promise<void>}
 */
export async function persistToken(token) {
  localStorageService.setItem(STORAGE_KEYS.TOKEN, token);
}

/**
 * Load user from localStorage
 * @returns {Promise<import('./types.js').User | null>}
 */
export async function loadUser() {
  return localStorageService.getItem(STORAGE_KEYS.USER);
}

/**
 * Load token from localStorage
 * @returns {Promise<string | null>}
 */
export async function loadToken() {
  return localStorageService.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Clear persisted auth data from localStorage
 * @returns {Promise<void>}
 */
export async function clearAuthData() {
  localStorageService.removeItem(STORAGE_KEYS.USER);
  localStorageService.removeItem(STORAGE_KEYS.TOKEN);
}

/**
 * Sign in with username and password using Firestore users
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<{user: import('./types.js').User, token: string}>}
 */
export async function signIn(username, password) {
  // Load users from Firestore
  const users = await usersService.loadUsers();
  
  // Authenticate user
  const result = await usersService.authenticateUser(username, password, users);
  
  // Persist to storage
  await Promise.all([
    persistUser(result.user),
    persistToken(result.token),
  ]);
  
  return result;
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  // Clear auth data from Firestore
  await clearAuthData();
}

/**
 * Get current authenticated user
 * @returns {Promise<import('./types.js').User | null>}
 */
export async function getCurrentAuthUser() {
  return await loadUser();
}
