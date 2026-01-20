/**
 * Payments Service
 * 
 * Business logic and calculations for payment management
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'payments_data';

/**
 * Generate unique ID for payment
 * @returns {string} Unique ID
 */
export function generatePaymentId() {
  return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all payments from storage
 * @returns {Promise<import('./types.js').Payment[]>}
 */
export async function loadPayments() {
  const payments = await storageService.getItem(STORAGE_KEY);
  return payments || [];
}

/**
 * Save all payments to storage
 * @param {import('./types.js').Payment[]} payments - Array of payments
 * @returns {Promise<void>}
 */
export async function savePayments(payments) {
  await storageService.setItem(STORAGE_KEY, payments);
}

/**
 * Validate payment data
 * @param {import('./types.js').PaymentFormData} data - Payment form data
 * @param {number} [maxAmount] - Maximum allowed payment amount (customer balance)
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validatePayment(data, maxAmount) {
  if (!data.customerId) {
    return { isValid: false, error: 'Customer is required' };
  }

  if (!data.amount || data.amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than 0' };
  }

  if (!data.paymentMethod) {
    return { isValid: false, error: 'Payment method is required' };
  }

  if (maxAmount !== undefined && data.amount > maxAmount) {
    return {
      isValid: false,
      error: `Payment amount cannot exceed outstanding balance of ${maxAmount.toLocaleString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Create a new payment
 * @param {import('./types.js').PaymentFormData} data - Payment form data
 * @param {import('./types.js').Payment[]} existingPayments - Existing payments
 * @param {string} [createdBy] - User who created the payment
 * @returns {Promise<import('./types.js').Payment>} Created payment
 */
export async function createPayment(data, existingPayments, createdBy) {
  const validation = validatePayment(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const now = new Date().toISOString();
  const newPayment = {
    id: generatePaymentId(),
    customerId: data.customerId,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    orderId: data.orderId || null,
    notes: data.notes || '',
    createdAt: now,
    createdBy: createdBy || null,
  };

  const updatedPayments = [...existingPayments, newPayment];
  await savePayments(updatedPayments);

  return newPayment;
}

/**
 * Calculate customer balance
 * @param {string} customerId - Customer ID
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('./types.js').Payment[]} payments - All payments
 * @returns {import('./types.js').CustomerBalance} Customer balance
 */
export function calculateCustomerBalance(customerId, orders, payments, customers) {
  // Get customer opening balance
  const customer = customers?.find((c) => c.id === customerId);
  const openingBalance = customer?.openingBalance || 0;

  // Calculate total from orders
  const customerOrders = orders.filter((o) => o.customerId === customerId);
  const totalOrders = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate total payments
  const customerPayments = payments.filter((p) => p.customerId === customerId);
  const totalPayments = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate balance (opening balance + orders - payments)
  const balance = openingBalance + totalOrders - totalPayments;

  return {
    customerId,
    openingBalance,
    totalOrders,
    totalPayments,
    balance,
  };
}

/**
 * Calculate outstanding balance for a customer
 * @param {string} customerId - Customer ID
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('./types.js').Payment[]} payments - All payments
 * @returns {number} Outstanding balance (can be negative if overpaid)
 */
export function calculateOutstandingBalance(customerId, orders, payments, customers) {
  const balance = calculateCustomerBalance(customerId, orders, payments, customers);
  return balance.balance;
}

/**
 * Get payments for a specific customer
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').Payment[]} payments - All payments
 * @returns {import('./types.js').Payment[]} Filtered payments
 */
export function getCustomerPayments(customerId, payments) {
  return payments
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get payment history for a customer
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').Payment[]} payments - All payments
 * @returns {import('./types.js').Payment[]} Payment history
 */
export function getPaymentHistory(customerId, payments) {
  return getCustomerPayments(customerId, payments);
}

/**
 * Get all customer balances
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('./types.js').Payment[]} payments - All payments
 * @returns {import('./types.js').CustomerBalance[]} Array of customer balances
 */
export function getAllCustomerBalances(orders, payments, customers) {
  const customerIds = new Set([
    ...orders.map((o) => o.customerId),
    ...payments.map((p) => p.customerId),
    ...(customers || []).map((c) => c.id),
  ]);

  return Array.from(customerIds).map((customerId) =>
    calculateCustomerBalance(customerId, orders, payments, customers)
  );
}

/**
 * Check if payment is full payment
 * @param {number} paymentAmount - Payment amount
 * @param {number} outstandingBalance - Outstanding balance
 * @returns {boolean} True if payment amount equals or exceeds balance
 */
export function isFullPayment(paymentAmount, outstandingBalance) {
  return paymentAmount >= outstandingBalance;
}

/**
 * Check if payment is partial payment
 * @param {number} paymentAmount - Payment amount
 * @param {number} outstandingBalance - Outstanding balance
 * @returns {boolean} True if payment amount is less than balance
 */
export function isPartialPayment(paymentAmount, outstandingBalance) {
  return paymentAmount > 0 && paymentAmount < outstandingBalance;
}

/**
 * Delete a payment
 * @param {string} paymentId - Payment ID
 * @param {import('./types.js').Payment[]} existingPayments - Existing payments
 * @returns {Promise<void>}
 */
export async function deletePayment(paymentId, existingPayments) {
  const updatedPayments = existingPayments.filter((p) => p.id !== paymentId);
  await savePayments(updatedPayments);
}
