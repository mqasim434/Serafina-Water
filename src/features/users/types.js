/**
 * Users Types
 * 
 * JSDoc type definitions for users management feature
 */

/**
 * User object stored in Firestore
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} username - Username (unique)
 * @property {string} password - Hashed password (in production, should be hashed)
 * @property {string} email - Email address (optional)
 * @property {'admin' | 'staff'} role - User role
 * @property {string} [displayName] - Optional display name
 * @property {boolean} isActive - Whether user is active
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} updatedAt - Last update timestamp (ISO string)
 * @property {string} [createdBy] - User who created this account
 */

/**
 * User form data (for create/update)
 * @typedef {Object} UserFormData
 * @property {string} username - Username
 * @property {string} password - Password (only required for new users)
 * @property {string} [email] - Email address
 * @property {'admin' | 'staff'} role - User role
 * @property {string} [displayName] - Optional display name
 * @property {boolean} [isActive] - Whether user is active
 */

/**
 * Login credentials
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username
 * @property {string} password - Password
 */
