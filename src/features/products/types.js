/**
 * Products Types
 * 
 * JSDoc type definitions for products feature
 */

/**
 * Product object (bottle)
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier
 * @property {string} name - Product name (e.g., "19L Bottle", "6L Bottle")
 * @property {string} size - Bottle size (e.g., "19L", "6L", "1.5L", "500ml")
 * @property {string} [description] - Optional description
 * @property {number} price - Default price for this product
 * @property {boolean} isActive - Whether product is active
 * @property {boolean} isReturnable - Whether bottles of this product can be returned
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last update timestamp (ISO string)
 */

/**
 * Product form data
 * @typedef {Object} ProductFormData
 * @property {string} name - Product name
 * @property {string} size - Bottle size
 * @property {string} [description] - Optional description
 * @property {number} price - Default price for this product
 * @property {boolean} [isActive] - Whether product is active
 * @property {boolean} [isReturnable] - Whether bottles of this product can be returned
 */

/**
 * Products state
 * @typedef {Object} ProductsState
 * @property {Product[]} items - Array of products
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 * @property {string | null} selectedId - Currently selected product ID
 */
