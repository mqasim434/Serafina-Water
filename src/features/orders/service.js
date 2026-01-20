/**
 * Orders Service
 * 
 * Business logic and calculations for order management
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';
import * as bottlesService from '../bottles/service.js';

const STORAGE_KEYS = {
  ORDERS: 'orders_data',
  CASH_BALANCE: 'cash_balance',
};

// Default price per bottle (can be made configurable)
const DEFAULT_PRICE_PER_BOTTLE = 50;

/**
 * Generate unique ID for order
 * @returns {string} Unique ID
 */
export function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all orders from storage
 * @returns {Promise<import('./types.js').Order[]>}
 */
export async function loadOrders() {
  const orders = await storageService.getItem(STORAGE_KEYS.ORDERS);
  return orders || [];
}

/**
 * Save all orders to storage
 * @param {import('./types.js').Order[]} orders - Array of orders
 * @returns {Promise<void>}
 */
export async function saveOrders(orders) {
  await storageService.setItem(STORAGE_KEYS.ORDERS, orders);
}

/**
 * Load cash balance from storage
 * @returns {Promise<import('./types.js').CashBalance>}
 */
export async function loadCashBalance() {
  const balance = await storageService.getItem(STORAGE_KEYS.CASH_BALANCE);
  return balance || { amount: 0, lastUpdated: new Date().toISOString() };
}

/**
 * Save cash balance to storage
 * @param {import('./types.js').CashBalance} balance - Cash balance
 * @returns {Promise<void>}
 */
export async function saveCashBalance(balance) {
  await storageService.setItem(STORAGE_KEYS.CASH_BALANCE, balance);
}

/**
 * Calculate order total
 * @param {number} quantity - Number of bottles
 * @param {number} price - Price per unit
 * @returns {number} Total amount
 */
export function calculateOrderTotal(quantity, price) {
  return quantity * price;
}

/**
 * Validate order data
 * @param {import('./types.js').OrderFormData} data - Order form data
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateOrder(data) {
  if (!data.customerId) {
    return { isValid: false, error: 'Customer is required' };
  }

  if (!data.productId) {
    return { isValid: false, error: 'Product is required' };
  }

  if (!data.quantity || data.quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }

  if (!data.price || data.price <= 0) {
    return { isValid: false, error: 'Price must be greater than 0' };
  }

  if (data.amountPaid === undefined || data.amountPaid === null || data.amountPaid < 0) {
    return { isValid: false, error: 'Amount paid must be 0 or greater' };
  }

  const totalAmount = calculateOrderTotal(data.quantity, data.price);
  if (data.amountPaid > totalAmount) {
    return { isValid: false, error: 'Amount paid cannot exceed total amount' };
  }

  return { isValid: true };
}

/**
 * Create a new order and update related systems
 * @param {import('./types.js').OrderFormData} data - Order form data
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @param {import('./types.js').CashBalance} currentCashBalance - Current cash balance
 * @param {import('../bottles/types.js').BottleTransaction[]} existingBottleTransactions - Existing bottle transactions
 * @param {import('../payments/types.js').Payment[]} existingPayments - Existing payments
 * @param {string} [createdBy] - User who created the order
 * @returns {Promise<{order: import('./types.js').Order, bottleTransaction: import('../bottles/types.js').BottleTransaction, payment: import('../payments/types.js').Payment | null, newCashBalance: import('./types.js').CashBalance}>}
 */
export async function createOrder(
  data,
  existingOrders,
  currentCashBalance,
  existingBottleTransactions,
  existingPayments,
  createdBy
) {
  // Validate order
  const validation = validateOrder(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calculate total
  const totalAmount = calculateOrderTotal(data.quantity, data.price);
  const amountPaid = data.amountPaid || 0;
  const outstandingAmount = totalAmount - amountPaid;

  // Create order
  const now = new Date().toISOString();
  const newOrder = {
    id: generateOrderId(),
    customerId: data.customerId,
    productId: data.productId,
    quantity: data.quantity,
    price: data.price,
    totalAmount,
    amountPaid,
    outstandingAmount,
    paymentMethod: amountPaid >= totalAmount ? 'cash' : 'credit',
    status: outstandingAmount > 0 ? 'pending' : 'completed',
    notes: data.notes || '',
    createdAt: now,
    createdBy: createdBy || null,
  };

  // Issue bottles to customer
  const bottleTransaction = await bottlesService.createTransaction(
    data.customerId,
    'issued',
    data.quantity,
    `Order #${newOrder.id}`,
    createdBy,
    existingBottleTransactions
  );

  // Create payment record if amount was paid
  let payment = null;
  if (amountPaid > 0) {
    const { createPayment } = await import('../payments/service.js');
    payment = await createPayment(
      {
        customerId: data.customerId,
        amount: amountPaid,
        paymentMethod: 'cash',
        orderId: newOrder.id,
        notes: `Payment for Order #${newOrder.id}`,
      },
      existingPayments,
      createdBy
    );
  }

  // Update cash on hand (only add the amount that was actually paid)
  const newCashBalance = {
    amount: currentCashBalance.amount + amountPaid,
    lastUpdated: now,
  };

  // Save order
  const updatedOrders = [...existingOrders, newOrder];
  await saveOrders(updatedOrders);

  // Save cash balance
  await saveCashBalance(newCashBalance);

  return {
    order: newOrder,
    bottleTransaction,
    payment,
    newCashBalance,
  };
}

/**
 * Get default price per bottle (deprecated - use product price)
 * @returns {number} Default price
 */
export function getDefaultPricePerBottle() {
  return DEFAULT_PRICE_PER_BOTTLE;
}

/**
 * Get orders for a specific customer
 * @param {string} customerId - Customer ID
 * @param {import('./types.js').Order[]} orders - All orders
 * @returns {import('./types.js').Order[]} Filtered orders
 */
export function getCustomerOrders(customerId, orders) {
  return orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Calculate total sales
 * @param {import('./types.js').Order[]} orders - All orders
 * @returns {number} Total sales amount
 */
export function calculateTotalSales(orders) {
  return orders.reduce((sum, order) => sum + order.totalAmount, 0);
}

/**
 * Get total orders count
 * @param {import('./types.js').Order[]} orders - All orders
 * @returns {number} Total orders count
 */
export function getTotalOrdersCount(orders) {
  return orders.length;
}
