/**
 * Users Service
 * 
 * Business logic for user management
 * No React/Redux dependencies - pure JavaScript functions
 */

import { getDocuments, setDocument, getDocument, deleteDocument } from '../../shared/services/firestore.js';
import { db } from '../../shared/services/firebase.js';
import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'users_data';
const COLLECTION_NAME = 'users';

/**
 * Simple password hashing (for demo - use bcrypt in production)
 * @param {string} password - Plain password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  // Simple hash for demo - in production, use bcrypt or similar
  // This is NOT secure for production use
  return btoa(password); // Base64 encoding (NOT secure, just for demo)
}

/**
 * Verify password
 * @param {string} password - Plain password
 * @param {string} hashedPassword - Hashed password
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

/**
 * Generate unique ID for user
 * @returns {string} Unique ID
 */
export function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate user data
 * @param {import('./types.js').UserFormData} data - User form data
 * @param {boolean} isNewUser - Whether this is a new user (password required)
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateUser(data, isNewUser = true) {
  if (!data.username || data.username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }

  if (data.username.trim().length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (isNewUser && (!data.password || data.password.length < 4)) {
    return { isValid: false, error: 'Password must be at least 4 characters' };
  }

  if (!data.role || !['admin', 'staff'].includes(data.role)) {
    return { isValid: false, error: 'Role must be admin or staff' };
  }

  return { isValid: true };
}

/**
 * Load all users from storage
 * @returns {Promise<import('./types.js').User[]>}
 */
export async function loadUsers() {
  try {
    if (db) {
      // Use Firestore
      const users = await getDocuments(COLLECTION_NAME);
      return users || [];
    } else {
      // Fallback to localStorage
      const users = await storageService.getItem(STORAGE_KEY);
      return users || [];
    }
  } catch (error) {
    console.error('Error loading users:', error);
    // Fallback to localStorage
    const users = await storageService.getItem(STORAGE_KEY);
    return users || [];
  }
}

/**
 * Save all users to storage
 * @param {import('./types.js').User[]} users - Array of users
 * @returns {Promise<void>}
 */
export async function saveUsers(users) {
  try {
    if (db) {
      // Use Firestore - save each user as a document
      for (const user of users) {
        await setDocument(COLLECTION_NAME, user.id, user, true);
      }
    } else {
      // Fallback to localStorage
      await storageService.setItem(STORAGE_KEY, users);
    }
  } catch (error) {
    console.error('Error saving users:', error);
    // Fallback to localStorage
    await storageService.setItem(STORAGE_KEY, users);
  }
}

/**
 * Create a new user
 * @param {import('./types.js').UserFormData} data - User form data
 * @param {import('./types.js').User[]} existingUsers - Existing users array
 * @param {string} [createdBy] - User ID who created this account
 * @returns {Promise<import('./types.js').User>} Created user
 */
export async function createUser(data, existingUsers, createdBy = null) {
  const validation = validateUser(data, true);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Check if username already exists
  const existingUser = existingUsers.find(
    (u) => u.username.toLowerCase() === data.username.trim().toLowerCase()
  );
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const now = new Date().toISOString();
  const newUser = {
    id: generateUserId(),
    username: data.username.trim(),
    password: hashPassword(data.password), // Hash password
    email: (data.email || '').trim(),
    role: data.role,
    displayName: (data.displayName || data.username).trim(),
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || null,
  };

  const updatedUsers = [...existingUsers, newUser];
  await saveUsers(updatedUsers);

  return newUser;
}

/**
 * Update an existing user
 * @param {string} id - User ID
 * @param {import('./types.js').UserFormData} data - User form data
 * @param {import('./types.js').User[]} existingUsers - Existing users array
 * @returns {Promise<import('./types.js').User>} Updated user
 */
export async function updateUser(id, data, existingUsers) {
  const validation = validateUser(data, false);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const userIndex = existingUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const existingUser = existingUsers[userIndex];

  // Check if username is being changed and if it conflicts
  if (data.username.trim().toLowerCase() !== existingUser.username.toLowerCase()) {
    const conflictingUser = existingUsers.find(
      (u) => u.id !== id && u.username.toLowerCase() === data.username.trim().toLowerCase()
    );
    if (conflictingUser) {
      throw new Error('Username already exists');
    }
  }

  const updatedUser = {
    ...existingUser,
    username: data.username.trim(),
    email: (data.email || '').trim(),
    role: data.role,
    displayName: (data.displayName || data.username).trim(),
    isActive: data.isActive !== undefined ? data.isActive : existingUser.isActive,
    updatedAt: new Date().toISOString(),
  };

  // Update password only if provided
  if (data.password && data.password.length > 0) {
    updatedUser.password = hashPassword(data.password);
  }

  const updatedUsers = [...existingUsers];
  updatedUsers[userIndex] = updatedUser;
  await saveUsers(updatedUsers);

  return updatedUser;
}

/**
 * Delete a user (soft delete - set isActive to false)
 * @param {string} id - User ID
 * @param {import('./types.js').User[]} existingUsers - Existing users array
 * @returns {Promise<void>}
 */
export async function deleteUser(id, existingUsers) {
  const userIndex = existingUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Soft delete - set isActive to false
  const updatedUsers = [...existingUsers];
  updatedUsers[userIndex] = {
    ...updatedUsers[userIndex],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };
  await saveUsers(updatedUsers);
}

/**
 * Find user by ID
 * @param {string} id - User ID
 * @param {import('./types.js').User[]} users - Users array
 * @returns {import('./types.js').User | undefined} Found user
 */
export function findUserById(id, users) {
  return users.find((u) => u.id === id);
}

/**
 * Find user by username
 * @param {string} username - Username
 * @param {import('./types.js').User[]} users - Users array
 * @returns {import('./types.js').User | undefined} Found user
 */
export function findUserByUsername(username, users) {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

/**
 * Authenticate user with username and password
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {import('./types.js').User[]} users - Users array
 * @returns {Promise<{user: import('../auth/types.js').User, token: string}>} User object and token
 */
export async function authenticateUser(username, password, users) {
  const user = findUserByUsername(username, users);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('User account is inactive');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Invalid credentials');
  }

  // Return user object (without password) and a simple token
  const authUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };

  // Simple token generation (in production, use JWT)
  const token = btoa(`${user.id}:${Date.now()}`);

  return { user: authUser, token };
}

/**
 * Get active users only
 * @param {import('./types.js').User[]} users - Users array
 * @returns {import('./types.js').User[]} Active users
 */
export function getActiveUsers(users) {
  return users.filter((u) => u.isActive);
}

/**
 * Get users by role
 * @param {import('./types.js').User[]} users - Users array
 * @param {'admin' | 'staff'} role - Role to filter by
 * @returns {import('./types.js').User[]} Filtered users
 */
export function getUsersByRole(users, role) {
  return users.filter((u) => u.role === role);
}
