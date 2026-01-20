/**
 * Reports Types
 * 
 * JSDoc type definitions for reports feature
 */

/**
 * Customer bottles report
 * @typedef {Object} CustomerBottlesReport
 * @property {string} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {number} issued - Total bottles issued
 * @property {number} returned - Total bottles returned
 * @property {number} outstanding - Outstanding bottles
 */

/**
 * Outstanding bottles report
 * @typedef {Object} OutstandingBottlesReport
 * @property {number} totalOutstanding - Total outstanding bottles
 * @property {CustomerBottlesReport[]} customers - Customer-wise breakdown
 */

/**
 * Due amounts report
 * @typedef {Object} DueAmountsReport
 * @property {string} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {number} totalOrders - Total order amount
 * @property {number} totalPayments - Total payments made
 * @property {number} dueAmount - Outstanding amount
 */

/**
 * Cash flow entry
 * @typedef {Object} CashFlowEntry
 * @property {string} date - Date (YYYY-MM-DD)
 * @property {number} income - Income for the day
 * @property {number} expenses - Expenses for the day
 * @property {number} netCash - Net cash flow (income - expenses)
 * @property {number} balance - Closing balance
 */

/**
 * Cash flow report
 * @typedef {Object} CashFlowReport
 * @property {CashFlowEntry[]} entries - Daily cash flow entries
 * @property {number} totalIncome - Total income
 * @property {number} totalExpenses - Total expenses
 * @property {number} netCashFlow - Net cash flow
 */
