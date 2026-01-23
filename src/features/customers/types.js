/**
 * Customers Types
 * 
 * JSDoc type definitions for customers feature
 */

/**
 * Preferred language for customer
 * @typedef {'en' | 'ur'} PreferredLanguage
 */

/**
 * Customer product prices (per product ID)
 * @typedef {Object<string, number>} CustomerProductPrices
 * Key is productId, value is price for that product
 */

/**
 * Customer bottle prices (per size) - Legacy/backward compatibility
 * @typedef {Object} CustomerBottlePrices
 * @property {number} [price19L] - Price for 19L bottles
 * @property {number} [price6L] - Price for 6L bottles
 * @property {number} [price1_5L] - Price for 1.5L bottles
 * @property {number} [price500ml] - Price for 500ml bottles
 */

/**
 * Customer object
 * @typedef {Object} Customer
 * @property {string} id - Unique customer identifier
 * @property {string} name - Customer name
 * @property {string} phone - Phone number
 * @property {string} address - Address
 * @property {PreferredLanguage} preferredLanguage - Preferred language (en or ur)
 * @property {CustomerProductPrices} productPrices - Product prices per product ID
 * @property {CustomerBottlePrices} [bottlePrices] - Legacy bottle prices (for backward compatibility)
 * @property {string} [createdAt] - Creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last update timestamp (ISO string)
 */

/**
 * Customer form data (for create/update)
 * @typedef {Object} CustomerFormData
 * @property {string} name - Customer name
 * @property {string} phone - Phone number
 * @property {string} address - Address
 * @property {PreferredLanguage} preferredLanguage - Preferred language
 * @property {CustomerProductPrices} productPrices - Product prices per product ID
 */

/**
 * Customers state
 * @typedef {Object} CustomersState
 * @property {Customer[]} items - Array of customers
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 * @property {string | null} selectedId - Currently selected customer ID
 */

