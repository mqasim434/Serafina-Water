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
 * @property {number} dueAmount - Outstanding amount (totalOrders - totalPayments)
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

/**
 * Profit & Revenue report (Admin only)
 * @typedef {Object} ProfitRevenueReport
 * @property {number} totalRevenue - Total revenue
 * @property {number} totalCost - Total cost
 * @property {number} totalProfit - Total profit
 * @property {number} profitMarginPct - Profit margin %
 * @property {Array<{ productId: string, productName: string, quantitySold: number, revenue: number, cost: number, profit: number }>} productBreakdown - Per-product breakdown
 * @property {{ totalRevenue: number, totalCost: number, totalProfit: number, profitMarginPct: number }} [comparison] - Same period last year
 */

/**
 * Customer Growth report (Admin only)
 * @typedef {Object} CustomerGrowthReport
 * @property {number} activatedCount - Customers whose first order was in period
 * @property {{ activatedCount: number, difference: number }} [comparison] - Same period last year
 */

/**
 * Customer activity report
 * @typedef {Object} CustomerActivityReport
 * @property {string} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} phone - Phone number
 * @property {string | null} lastOrderDate - Last order date (YYYY-MM-DD) or null
 * @property {number | null} daysSinceLastOrder - Days since last order or null
 * @property {number} averageOrderQuantity - Average order quantity
 * @property {string} mostFrequentProduct - Most frequently ordered product name
 * @property {string} inactivityStatus - Inactivity status ('active', '30_days', '60_days', '90_days', 'no_orders')
 */
