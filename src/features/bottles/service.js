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
 * Calculate outstanding bottles for a customer (only for returnable products)
 * This function calculates based on orders (which have product info) rather than just transactions
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {number} Outstanding bottles from returnable products only
 */
export function calculateOutstandingReturnable(customerId, transactions, orders, products) {
  // Get all orders for this customer with returnable products
  const customerReturnableOrders = orders.filter((order) => {
    if (order.customerId !== customerId) return false;
    const product = products.find((p) => p.id === order.productId);
    return product && product.isReturnable !== false; // Default to true if not set
  });

  // Calculate total bottles issued from returnable products (from orders)
  const totalIssuedReturnable = customerReturnableOrders.reduce((sum, order) => sum + order.quantity, 0);

  // Get all transactions for this customer
  const customerTransactions = transactions.filter((t) => t.customerId === customerId);

  // Get all issued transactions for this customer
  const totalIssued = customerTransactions
    .filter((t) => t.type === 'issued')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Get all returned transactions
  const totalReturned = customerTransactions
    .filter((t) => t.type === 'returned')
    .reduce((sum, t) => sum + t.quantity, 0);

  // If no returnable orders, return 0
  if (totalIssuedReturnable === 0) {
    return 0;
  }

  // Calculate the ratio of returnable issued to total issued
  // This helps us estimate how many returns are for returnable products
  const returnableRatio = totalIssued > 0 ? totalIssuedReturnable / totalIssued : 1;
  
  // Estimate returned bottles from returnable products
  // We assume returns are proportional to issued bottles
  // This is an approximation - ideally we'd track which returns are for which products
  const estimatedReturnedReturnable = Math.round(totalReturned * returnableRatio);

  // Calculate outstanding returnable bottles
  const outstandingReturnable = totalIssuedReturnable - estimatedReturnedReturnable;

  // Return max of 0 (don't return negative values)
  return Math.max(0, outstandingReturnable);
}

/**
 * Calculate global summary of outstanding bottles (returnable products only)
 * @param {import('./types.js').BottleTransaction[]} transactions - All transactions
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {{ totalOutstandingReturnable: number }} Summary of returnable outstanding bottles
 */
export function calculateGlobalSummaryReturnable(transactions, orders, products) {
  const customerIds = new Set((orders || []).map((o) => o.customerId));
  let totalOutstandingReturnable = 0;
  for (const customerId of customerIds) {
    totalOutstandingReturnable += calculateOutstandingReturnable(
      customerId,
      transactions,
      orders || [],
      products || []
    );
  }
  return { totalOutstandingReturnable };
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
