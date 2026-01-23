/**
 * Payments Types
 * 
 * JSDoc type definitions for payments feature
 */

/**
 * Payment object
 * @typedef {Object} Payment
 * @property {string} id - Unique payment identifier
 * @property {string} customerId - Customer ID
 * @property {number} amount - Payment amount
 * @property {string} paymentMethod - Payment method (cash, bank, etc.)
 * @property {string} [orderId] - Associated order ID (if applicable)
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the payment
 */

/**
 * Payment form data
 * @typedef {Object} PaymentFormData
 * @property {string} customerId - Customer ID
 * @property {number} amount - Payment amount
 * @property {string} paymentMethod - Payment method
 * @property {string} [orderId] - Associated order ID
 * @property {string} [notes] - Optional notes
 */

/**
 * Customer balance (amount owed)
 * @typedef {Object} CustomerBalance
 * @property {string} customerId - Customer ID
 * @property {number} openingBalance - Opening balance (initial debt/credit)
 * @property {number} totalOrders - Total amount from orders
 * @property {number} totalPayments - Total amount paid
 * @property {number} balance - Outstanding balance (openingBalance + totalOrders - totalPayments)
 */

/**
 * Payments state
 * @typedef {Object} PaymentsState
 * @property {Payment[]} items - Array of payments
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
