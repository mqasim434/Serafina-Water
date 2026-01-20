/**
 * Orders Types
 * 
 * JSDoc type definitions for orders feature
 */

/**
 * Order object
 * @typedef {Object} Order
 * @property {string} id - Unique order identifier
 * @property {string} customerId - Customer ID
 * @property {string} productId - Product ID
 * @property {number} quantity - Number of bottles ordered
 * @property {number} price - Price per unit
 * @property {number} totalAmount - Total order amount
 * @property {number} amountPaid - Amount paid at order time
 * @property {number} outstandingAmount - Outstanding amount (totalAmount - amountPaid)
 * @property {string} paymentMethod - Payment method (cash, credit)
 * @property {string} status - Order status (completed, pending)
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the order
 */

/**
 * Order form data
 * @typedef {Object} OrderFormData
 * @property {string} customerId - Customer ID
 * @property {string} productId - Product ID
 * @property {number} quantity - Number of bottles
 * @property {number} price - Price per unit
 * @property {number} amountPaid - Amount paid at order time
 * @property {string} [notes] - Optional notes
 */

/**
 * Cash balance
 * @typedef {Object} CashBalance
 * @property {number} amount - Current cash on hand
 * @property {string} lastUpdated - Last update timestamp (ISO string)
 */

/**
 * Orders state
 * @typedef {Object} OrdersState
 * @property {Order[]} items - Array of orders
 * @property {CashBalance} cashBalance - Current cash on hand
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
