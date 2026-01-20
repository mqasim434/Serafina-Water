/**
 * Bottles Service
 * 
 * All business logic and calculations for bottle tracking
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'bottles_transactions';

/**
 * Generate unique ID for transaction
 * @returns {string} Unique ID
 */
export function generateTransactionId() {
  return `bottle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all transactions from storage
 * @returns {Promise<import('./types.js').BottleTransaction[]>}
 */
export async function loadTransactions() {
  const transactions = await storageService.getItem(STORAGE_KEY);
  return transactions || [];
}

/**
 * Save all transactions to storage
 * @param {import('./types.js').BottleTransaction[]} transactions - Array of transactions
 * @returns {Promise<void>}
 */
export async function saveTransactions(transactions) {
  await storageService.setItem(STORAGE_KEY, transactions);
}

/**
 * Create a new transaction
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').TransactionType} type - Transaction type
 * @param {number} quantity - Number of bottles
 * @param {string} [notes] - Optional notes
 * @param {string} [createdBy] - User who created the transaction
 * @param {import('./types.js').BottleTransaction[]} existingTransactions - Existing transactions
 * @returns {Promise<import('./types.js').BottleTransaction>} Created transaction
 */
export async function createTransaction(
  customerId,
  type,
  quantity,
  notes,
  createdBy,
  existingTransactions
) {
  if (!customerId || !type || !quantity || quantity <= 0) {
    throw new Error('Invalid transaction data');
  }

  if (type !== 'issued' && type !== 'returned') {
    throw new Error('Transaction type must be "issued" or "returned"');
  }

  const newTransaction = {
    id: generateTransactionId(),
    customerId,
    type,
    quantity,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: createdBy || null,
  };

  const updatedTransactions = [...existingTransactions, newTransaction];
  await saveTransactions(updatedTransactions);

  return newTransaction;
}

/**
 * Calculate customer bottle balance
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @returns {import('./types.js').CustomerBottleBalance} Customer balance
 */
export function calculateCustomerBalance(customerId, transactions) {
  const customerTransactions = transactions.filter((t) => t.customerId === customerId);

  const issued = customerTransactions
    .filter((t) => t.type === 'issued')
    .reduce((sum, t) => sum + t.quantity, 0);

  const returned = customerTransactions
    .filter((t) => t.type === 'returned')
    .reduce((sum, t) => sum + t.quantity, 0);

  const outstanding = issued - returned;

  return {
    customerId,
    issued,
    returned,
    outstanding,
  };
}

/**
 * Calculate outstanding bottles for a customer
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @returns {number} Outstanding bottles (can be negative if returned more than issued)
 */
export function calculateOutstanding(customerId, transactions) {
  const balance = calculateCustomerBalance(customerId, transactions);
  return balance.outstanding;
}

/**
 * Calculate global bottle summary
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @returns {import('./types.js').BottleSummary} Global summary
 */
export function calculateGlobalSummary(transactions) {
  const totalIssued = transactions
    .filter((t) => t.type === 'issued')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalReturned = transactions
    .filter((t) => t.type === 'returned')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOutstanding = totalIssued - totalReturned;

  // Get unique customer IDs
  const uniqueCustomerIds = new Set(transactions.map((t) => t.customerId));
  const totalCustomers = uniqueCustomerIds.size;

  return {
    totalIssued,
    totalReturned,
    totalOutstanding,
    totalCustomers,
  };
}

/**
 * Get all customer balances
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @returns {import('./types.js').CustomerBottleBalance[]} Array of customer balances
 */
export function getAllCustomerBalances(transactions) {
  const customerIds = new Set(transactions.map((t) => t.customerId));
  
  return Array.from(customerIds).map((customerId) =>
    calculateCustomerBalance(customerId, transactions)
  );
}

/**
 * Get transactions for a specific customer
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @returns {import('./types.js').BottleTransaction[]} Filtered transactions
 */
export function getCustomerTransactions(customerId, transactions) {
  return transactions
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Delete a transaction
 * @param {string} transactionId - Transaction ID
 * @param {import('./types.js').BottleTransaction[]} existingTransactions - Existing transactions
 * @returns {Promise<void>}
 */
export async function deleteTransaction(transactionId, existingTransactions) {
  const updatedTransactions = existingTransactions.filter((t) => t.id !== transactionId);
  await saveTransactions(updatedTransactions);
}

/**
 * Validate transaction can be created
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').TransactionType} type - Transaction type
 * @param {number} quantity - Number of bottles
 * @param {import('./types.js').BottleTransaction[]} transactions - Existing transactions
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateTransaction(customerId, type, quantity, transactions) {
  if (!customerId) {
    return { isValid: false, error: 'Customer ID is required' };
  }

  if (type !== 'issued' && type !== 'returned') {
    return { isValid: false, error: 'Transaction type must be issued or returned' };
  }

  if (!quantity || quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }

  // If returning bottles, check if customer has enough outstanding
  if (type === 'returned') {
    const outstanding = calculateOutstanding(customerId, transactions);
    if (outstanding < quantity) {
      return {
        isValid: false,
        error: `Cannot return ${quantity} bottles. Customer only has ${outstanding} outstanding.`,
      };
    }
  }

  return { isValid: true };
}
