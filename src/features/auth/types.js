/**
 * Authentication Types
 * 
 * JSDoc type definitions for authentication feature
 */

/**
 * User role types
 * @typedef {'admin' | 'staff'} UserRole
 */

/**
 * User object
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {UserRole} role - User role (admin or staff)
 * @property {string} [displayName] - Optional display name
 */

/**
 * Auth state
 * @typedef {Object} AuthState
 * @property {User | null} user - Current authenticated user
 * @property {string | null} token - Authentication token
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */

/**
 * Login credentials
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username or email
 * @property {string} password - Password
 */

/**
 * Register data
 * @typedef {Object} RegisterData
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} password - Password
 * @property {UserRole} role - User role
 * @property {string} [displayName] - Optional display name
 */
