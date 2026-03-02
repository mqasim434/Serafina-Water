/**
 * Expenses Types
 * 
 * JSDoc type definitions for expenses feature
 */

/**
 * Expense object
 * @typedef {Object} Expense
 * @property {string} id - Unique expense identifier
 * @property {string} title - Expense title
 * @property {string} [description] - Optional description
 * @property {number} amount - Expense amount
 * @property {string} date - Expense date in YYYY-MM-DD format
 * @property {string} [imageUrl] - ImageKit URL of attached receipt/image
 * @property {string} [imageFileId] - ImageKit file ID
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the expense
 */

/**
 * Expense form data
 * @typedef {Object} ExpenseFormData
 * @property {string} title - Expense title
 * @property {string} [description] - Optional description
 * @property {number} amount - Expense amount
 * @property {string} date - Expense date in YYYY-MM-DD format
 * @property {string} [imageUrl] - ImageKit URL of attached receipt/image
 * @property {string} [imageFileId] - ImageKit file ID
 */

/**
 * Expense category
 * @typedef {Object} ExpenseCategory
 * @property {string} id - Unique category identifier
 * @property {string} name - Category name
 * @property {string} [description] - Optional description
 * @property {string} createdAt - Creation timestamp (ISO string)
 */

/**
 * Expenses state
 * @typedef {Object} ExpensesState
 * @property {Expense[]} items - Array of expenses
 * @property {ExpenseCategory[]} categories - Array of expense categories
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
