/**
 * Payroll Types
 *
 * JSDoc type definitions for payroll feature
 */

/**
 * Pay type: monthly or bi-monthly
 * @typedef {'monthly' | 'bimonthly'} PayType
 */

/**
 * Employee
 * @typedef {Object} Employee
 * @property {string} id - Unique ID
 * @property {string} name - Employee name
 * @property {PayType} payType - Monthly or Bi-monthly
 * @property {number} payAmount - Pay amount (Rs.)
 * @property {number[]} payDates - Pay dates (e.g. [1, 15] for 1st and 15th)
 * @property {string} startDate - Start date (YYYY-MM-DD)
 * @property {string} nextPayDate - Next pay date (YYYY-MM-DD)
 * @property {boolean} isActive - Active/Inactive
 * @property {string} createdAt - Creation timestamp
 * @property {string} [updatedAt] - Last update timestamp
 */

/**
 * Payment record
 * @typedef {Object} PayrollPayment
 * @property {string} id - Unique ID
 * @property {string} employeeId - Employee ID
 * @property {string} paidDate - Date paid (YYYY-MM-DD)
 * @property {number} amount - Amount paid
 * @property {string} [notes] - Optional notes
 * @property {string} paidBy - User ID who marked paid
 * @property {string} createdAt - Timestamp
 * @property {string} [expenseId] - Linked expense ID (for privacy)
 */
