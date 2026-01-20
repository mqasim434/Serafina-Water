/**
 * Cash Service
 * 
 * Centralized cash management - all cash calculations and operations
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEYS = {
  CURRENT_BALANCE: 'cash_current_balance',
  DAILY_RECORDS: 'cash_daily_records',
  TRANSACTIONS: 'cash_transactions',
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Load current cash balance
 * @returns {Promise<number>} Current balance
 */
export async function loadCurrentBalance() {
  const balance = await storageService.getItem(STORAGE_KEYS.CURRENT_BALANCE);
  return balance !== null ? balance : 0;
}

/**
 * Save current cash balance
 * @param {number} balance - Balance to save
 * @returns {Promise<void>}
 */
export async function saveCurrentBalance(balance) {
  await storageService.setItem(STORAGE_KEYS.CURRENT_BALANCE, balance);
}

/**
 * Update cash balance (add or subtract)
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {number} currentBalance - Current balance
 * @returns {Promise<number>} Updated balance
 */
export async function updateCashBalance(amount, currentBalance) {
  const newBalance = currentBalance + amount;
  await saveCurrentBalance(newBalance);
  return newBalance;
}

/**
 * Get real-time cash on hand
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../payments/types.js').Payment[]} payments - All payments
 * @param {number} [initialBalance] - Initial balance (optional)
 * @returns {number} Real-time cash on hand
 */
export function calculateRealTimeCash(orders, payments, initialBalance = 0) {
  // Calculate total from orders (income)
  const totalFromOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate total from payments (additional income if any)
  // Note: Payments reduce customer balance but don't directly affect cash
  // unless they're separate cash transactions

  return initialBalance + totalFromOrders;
}

/**
 * Load daily cash records
 * @returns {Promise<import('./types.js').DailyCashRecord[]>}
 */
export async function loadDailyRecords() {
  const records = await storageService.getItem(STORAGE_KEYS.DAILY_RECORDS);
  return records || [];
}

/**
 * Save daily cash records
 * @param {import('./types.js').DailyCashRecord[]} records - Array of daily records
 * @returns {Promise<void>}
 */
export async function saveDailyRecords(records) {
  await storageService.setItem(STORAGE_KEYS.DAILY_RECORDS, records);
}

/**
 * Get today's cash record
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').DailyCashRecord | null} Today's record
 */
export function getTodayRecord(records) {
  const today = getTodayDate();
  return records.find((r) => r.date === today) || null;
}

/**
 * Create or update today's cash record
 * @param {number} openingBalance - Opening balance
 * @param {number} currentBalance - Current balance
 * @param {number} totalIncome - Total income for today
 * @param {number} totalExpenses - Total expenses for today
 * @param {import('./types.js').DailyCashRecord[]} existingRecords - Existing records
 * @returns {Promise<import('./types.js').DailyCashRecord>} Updated record
 */
export async function updateTodayRecord(
  openingBalance,
  currentBalance,
  totalIncome,
  totalExpenses,
  existingRecords
) {
  const today = getTodayDate();
  const now = new Date().toISOString();

  const existingIndex = existingRecords.findIndex((r) => r.date === today);

  const record = {
    date: today,
    openingBalance,
    closingBalance: currentBalance,
    totalIncome,
    totalExpenses,
    updatedAt: now,
  };

  if (existingIndex === -1) {
    // Create new record
    record.createdAt = now;
    const updatedRecords = [...existingRecords, record];
    await saveDailyRecords(updatedRecords);
  } else {
    // Update existing record
    const existing = existingRecords[existingIndex];
    record.createdAt = existing.createdAt;
    record.notes = existing.notes;
    const updatedRecords = [...existingRecords];
    updatedRecords[existingIndex] = record;
    await saveDailyRecords(updatedRecords);
  }

  return record;
}

/**
 * Set daily opening balance
 * @param {number} openingBalance - Opening balance for today
 * @param {import('./types.js').DailyCashRecord[]} existingRecords - Existing records
 * @returns {Promise<import('./types.js').DailyCashRecord>} Updated record
 */
export async function setDailyOpeningBalance(openingBalance, existingRecords) {
  const today = getTodayDate();
  const now = new Date().toISOString();

  const existingIndex = existingRecords.findIndex((r) => r.date === today);

  if (existingIndex === -1) {
    // Create new record
    const record = {
      date: today,
      openingBalance,
      closingBalance: openingBalance,
      totalIncome: 0,
      totalExpenses: 0,
      createdAt: now,
      updatedAt: now,
    };
    const updatedRecords = [...existingRecords, record];
    await saveDailyRecords(updatedRecords);
    return record;
  } else {
    // Update existing record
    const existing = existingRecords[existingIndex];
    const record = {
      ...existing,
      openingBalance,
      updatedAt: now,
    };
    const updatedRecords = [...existingRecords];
    updatedRecords[existingIndex] = record;
    await saveDailyRecords(updatedRecords);
    return record;
  }
}

/**
 * Calculate daily income from orders
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @returns {number} Total income for the day
 */
export function calculateDailyIncome(date, orders) {
  return orders
    .filter((order) => {
      const orderDate = formatDate(new Date(order.createdAt));
      return orderDate === date;
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);
}

/**
 * Calculate daily expenses
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('./types.js').CashTransaction[]} transactions - All cash transactions
 * @returns {number} Total expenses for the day
 */
export function calculateDailyExpenses(date, transactions) {
  return transactions
    .filter((t) => {
      const transDate = formatDate(new Date(t.createdAt));
      return transDate === date && t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get weekly summary
 * @param {string} weekStartDate - Week start date (YYYY-MM-DD)
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').WeeklySummary} Weekly summary
 */
export function getWeeklySummary(weekStartDate, records) {
  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekRecords = records.filter((r) => {
    const recordDate = new Date(r.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  });

  const totalIncome = weekRecords.reduce((sum, r) => sum + r.totalIncome, 0);
  const totalExpenses = weekRecords.reduce((sum, r) => sum + r.totalExpenses, 0);
  const netCash = totalIncome - totalExpenses;

  const openingBalance = weekRecords.length > 0 ? weekRecords[0].openingBalance : 0;
  const closingBalance =
    weekRecords.length > 0 ? weekRecords[weekRecords.length - 1].closingBalance : 0;

  return {
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    totalIncome,
    totalExpenses,
    netCash,
    openingBalance,
    closingBalance,
  };
}

/**
 * Get current week summary
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').WeeklySummary} Current week summary
 */
export function getCurrentWeekSummary(records) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)

  return getWeeklySummary(formatDate(weekStart), records);
}

/**
 * Get monthly summary
 * @param {string} month - Month in YYYY-MM format
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').MonthlySummary} Monthly summary
 */
export function getMonthlySummary(month, records) {
  const monthRecords = records.filter((r) => r.date.startsWith(month));

  const totalIncome = monthRecords.reduce((sum, r) => sum + r.totalIncome, 0);
  const totalExpenses = monthRecords.reduce((sum, r) => sum + r.totalExpenses, 0);
  const netCash = totalIncome - totalExpenses;

  const openingBalance = monthRecords.length > 0 ? monthRecords[0].openingBalance : 0;
  const closingBalance =
    monthRecords.length > 0 ? monthRecords[monthRecords.length - 1].closingBalance : 0;

  // Get number of days in month
  const [year, monthNum] = month.split('-').map(Number);
  const daysCount = new Date(year, monthNum, 0).getDate();

  return {
    month,
    totalIncome,
    totalExpenses,
    netCash,
    openingBalance,
    closingBalance,
    daysCount,
  };
}

/**
 * Get current month summary
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').MonthlySummary} Current month summary
 */
export function getCurrentMonthSummary(records) {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return getMonthlySummary(month, records);
}

/**
 * Get all weekly summaries
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').WeeklySummary[]} Array of weekly summaries
 */
export function getAllWeeklySummaries(records) {
  if (records.length === 0) return [];

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sortedRecords[0].date);
  const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);

  // Get start of first week (Sunday)
  const firstWeekStart = new Date(firstDate);
  firstWeekStart.setDate(firstDate.getDate() - firstDate.getDay());

  const summaries = [];
  let currentWeekStart = new Date(firstWeekStart);

  while (currentWeekStart <= lastDate) {
    const summary = getWeeklySummary(formatDate(currentWeekStart), records);
    if (summary.totalIncome > 0 || summary.totalExpenses > 0) {
      summaries.push(summary);
    }
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return summaries;
}

/**
 * Get all monthly summaries
 * @param {import('./types.js').DailyCashRecord[]} records - All daily records
 * @returns {import('./types.js').MonthlySummary[]} Array of monthly summaries
 */
export function getAllMonthlySummaries(records) {
  if (records.length === 0) return [];

  const monthMap = new Map();

  records.forEach((record) => {
    const month = record.date.substring(0, 7); // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month).push(record);
  });

  return Array.from(monthMap.keys())
    .sort()
    .map((month) => getMonthlySummary(month, records))
    .filter((summary) => summary.totalIncome > 0 || summary.totalExpenses > 0);
}
