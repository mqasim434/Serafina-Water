/**
 * Orders Types
 * 
 * JSDoc type definitions for orders feature
 */

/**
 * Single line item in an order (used when order has multiple items)
 * @typedef {Object} OrderItem
 * @property {string} productId - Product ID
 * @property {number} quantity - Quantity ordered
 * @property {number} price - Price per unit at time of order
 * @property {number} [costPriceAtSale] - Cost price per unit at time of sale (for profit reporting)
 */

/**
 * Order object
 * @typedef {Object} Order
 * @property {string} id - Unique order identifier
 * @property {number} orderNumber - Integer order number (auto-increment, never reused)
 * @property {string} customerId - Customer ID
 * @property {string} [productId] - Product ID (legacy single-item orders)
 * @property {number} [quantity] - Number of bottles ordered (legacy single-item orders)
 * @property {number} [price] - Price per unit (legacy single-item orders)
 * @property {number} [costPriceAtSale] - Cost price per unit (legacy single-item orders)
 * @property {OrderItem[]} [items] - Line items (multi-item orders); when present, productId/quantity/price are omitted
 * @property {number} totalAmount - Total order amount
 * @property {number} amountPaid - Amount paid at order time
 * @property {number} outstandingAmount - Outstanding amount (totalAmount - amountPaid)
 * @property {string} paymentMethod - Payment method (cash, credit)
 * @property {string} status - Order status (pending, completed, shipped, ready, delivered)
 * @property {string} [delivery_date] - Delivery date YYYY-MM-DD (default today when created)
 * @property {string} [deliveryProofPhotoUrl] - ImageKit URL of delivery proof photo (one per delivery)
 * @property {string} [deliveryProofFileId] - ImageKit file ID (for 6-week auto-delete)
 * @property {string} [deliveredAt] - When order was marked delivered (ISO string)
 * @property {string} [deliveredBy] - User ID who marked delivered
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the order
 */

/**
 * Order form data (single item - legacy)
 * @typedef {Object} OrderFormDataSingle
 * @property {string} customerId - Customer ID
 * @property {string} productId - Product ID
 * @property {number} quantity - Number of bottles
 * @property {number} price - Price per unit
 * @property {number} amountPaid - Amount paid at order time
 * @property {string} [notes] - Optional notes
 */

/**
 * Order form data (supports multiple items)
 * @typedef {Object} OrderFormData
 * @property {string} customerId - Customer ID
 * @property {string} [productId] - Product ID (when using single item)
 * @property {number} [quantity] - Quantity (when using single item)
 * @property {number} [price] - Price per unit (when using single item)
 * @property {{ productId: string, quantity: number, price: number }[]} [items] - Line items (multi-item)
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
