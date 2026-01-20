/**
 * Authentication Service
 * 
 * Business logic and calculations for authentication
 * Uses Firestore users collection for authentication
 */

import { storageService } from '../../shared/services/storage.js';
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
 * Persist user to storage
 * @param {import('./types.js').User} user - User to persist
 * @returns {Promise<void>}
 */
export async function persistUser(user) {
  await storageService.setItem(STORAGE_KEYS.USER, user);
}

/**
 * Persist token to storage
 * @param {string} token - Token to persist
 * @returns {Promise<void>}
 */
export async function persistToken(token) {
  await storageService.setItem(STORAGE_KEYS.TOKEN, token);
}

/**
 * Load user from storage
 * @returns {Promise<import('./types.js').User | null>}
 */
export async function loadUser() {
  return await storageService.getItem(STORAGE_KEYS.USER);
}

/**
 * Load token from storage
 * @returns {Promise<string | null>}
 */
export async function loadToken() {
  return await storageService.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Clear persisted auth data
 * @returns {Promise<void>}
 */
export async function clearAuthData() {
  await Promise.all([
    storageService.removeItem(STORAGE_KEYS.USER),
    storageService.removeItem(STORAGE_KEYS.TOKEN),
  ]);
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
  // Clear local storage
  await clearAuthData();
}

/**
 * Get current authenticated user
 * @returns {Promise<import('./types.js').User | null>}
 */
export async function getCurrentAuthUser() {
  return await loadUser();
}
