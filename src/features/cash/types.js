/**
 * Cash Types
 * 
 * JSDoc type definitions for cash management feature
 */

/**
 * Daily cash record
 * @typedef {Object} DailyCashRecord
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} openingBalance - Opening balance for the day
 * @property {number} closingBalance - Closing balance for the day
 * @property {number} totalIncome - Total income for the day
 * @property {number} totalExpenses - Total expenses for the day
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [updatedAt] - Last update timestamp (ISO string)
 */

/**
 * Cash transaction
 * @typedef {Object} CashTransaction
 * @property {string} id - Unique transaction identifier
 * @property {string} type - Transaction type ('income' or 'expense')
 * @property {number} amount - Transaction amount
 * @property {string} category - Transaction category
 * @property {string} [description] - Optional description
 * @property {string} [orderId] - Associated order ID (if from order)
 * @property {string} [paymentId] - Associated payment ID (if from payment)
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the transaction
 */

/**
 * Weekly summary
 * @typedef {Object} WeeklySummary
 * @property {string} weekStart - Week start date (YYYY-MM-DD)
 * @property {string} weekEnd - Week end date (YYYY-MM-DD)
 * @property {number} totalIncome - Total income for the week
 * @property {number} totalExpenses - Total expenses for the week
 * @property {number} netCash - Net cash flow (income - expenses)
 * @property {number} openingBalance - Opening balance for the week
 * @property {number} closingBalance - Closing balance for the week
 */

/**
 * Monthly summary
 * @typedef {Object} MonthlySummary
 * @property {string} month - Month in YYYY-MM format
 * @property {number} totalIncome - Total income for the month
 * @property {number} totalExpenses - Total expenses for the month
 * @property {number} netCash - Net cash flow (income - expenses)
 * @property {number} openingBalance - Opening balance for the month
 * @property {number} closingBalance - Closing balance for the month
 * @property {number} daysCount - Number of days in the month
 */

/**
 * Cash state
 * @typedef {Object} CashState
 * @property {number} currentBalance - Current cash on hand
 * @property {DailyCashRecord | null} todayRecord - Today's cash record
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
