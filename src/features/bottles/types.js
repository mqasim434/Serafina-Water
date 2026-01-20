/**
 * Bottles Types
 * 
 * JSDoc type definitions for bottles feature
 */

/**
 * Bottle transaction type
 * @typedef {'issued' | 'returned'} TransactionType
 */

/**
 * Bottle transaction record
 * @typedef {Object} BottleTransaction
 * @property {string} id - Unique transaction identifier
 * @property {string} customerId - Customer ID
 * @property {TransactionType} type - Transaction type (issued or returned)
 * @property {number} quantity - Number of bottles
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the transaction
 */

/**
 * Customer bottle balance
 * @typedef {Object} CustomerBottleBalance
 * @property {string} customerId - Customer ID
 * @property {number} issued - Total bottles issued
 * @property {number} returned - Total bottles returned
 * @property {number} outstanding - Outstanding bottles (issued - returned)
 */

/**
 * Global bottle summary
 * @typedef {Object} BottleSummary
 * @property {number} totalIssued - Total bottles issued across all customers
 * @property {number} totalReturned - Total bottles returned across all customers
 * @property {number} totalOutstanding - Total outstanding bottles
 * @property {number} totalCustomers - Number of customers with bottle transactions
 */

/**
 * Bottles state
 * @typedef {Object} BottlesState
 * @property {BottleTransaction[]} transactions - Array of all transactions
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
