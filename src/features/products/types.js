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
 * @property {number} price - Default price for this product (sale price)
 * @property {number} [costPrice] - Cost price for this product (Admin only; used for profit reporting)
 * @property {boolean} isActive - Whether product is active
 * @property {boolean} isReturnable - Whether bottles of this product can be returned (Stock Type: Returnable / Non returnable)
 * @property {boolean} [trackStock] - Whether to track stock (default true)
 * @property {number} [lowStockThreshold] - Low stock alert threshold
 * @property {number} [currentStock] - Current total stock (system managed, read-only in UI)
 * @property {number} [readyToShip] - Quantity filled/packed and ready to ship (system managed)
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
 * @property {boolean} [trackStock] - Whether to track stock
 * @property {number} [lowStockThreshold] - Low stock alert threshold
 * @property {number} [costPrice] - Cost price (Admin only)
 */

/**
 * Products state
 * @typedef {Object} ProductsState
 * @property {Product[]} items - Array of products
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 * @property {string | null} selectedId - Currently selected product ID
 */
