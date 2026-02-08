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
  ORDER_NUMBER: 'order_number_counter',
};

// Default price per bottle (can be made configurable)
const DEFAULT_PRICE_PER_BOTTLE = 50;

/**
 * Get next order number (integer, auto-increment, never reused)
 * @returns {Promise<number>} Next order number
 */
export async function getNextOrderNumber() {
  const { getDocument, setDocument } = await import('../../shared/services/firestore.js');
  
  try {
    // Get current order number counter
    const counterDoc = await getDocument(STORAGE_KEYS.ORDER_NUMBER, 'counter');
    let currentNumber = 0;
    
    if (counterDoc && counterDoc.lastOrderNumber !== undefined) {
      currentNumber = counterDoc.lastOrderNumber;
    }
    
    // Increment and save
    const nextNumber = currentNumber + 1;
    await setDocument(STORAGE_KEYS.ORDER_NUMBER, 'counter', { lastOrderNumber: nextNumber }, true);
    
    return nextNumber;
  } catch (error) {
    console.error('Error getting next order number:', error);
    // Fallback: calculate from existing orders
    const orders = await loadOrders();
    if (orders.length === 0) {
      // First order
      await setDocument(STORAGE_KEYS.ORDER_NUMBER, 'counter', { lastOrderNumber: 1 }, true);
      return 1;
    }
    // Find max order number from existing orders
    const maxOrderNumber = Math.max(...orders.map(o => o.orderNumber || 0));
    const nextNumber = maxOrderNumber + 1;
    await setDocument(STORAGE_KEYS.ORDER_NUMBER, 'counter', { lastOrderNumber: nextNumber }, true);
    return nextNumber;
  }
}

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
 * @returns {number} Total amount (rounded to 2 decimal places)
 */
export function calculateOrderTotal(quantity, price) {
  return Math.round((quantity * price) * 100) / 100;
}

/**
 * Get line items from an order (supports legacy single-item and multi-item)
 * @param {import('./types.js').Order} order - Order
 * @returns {{ productId: string, quantity: number, price: number, costPriceAtSale?: number }[]}
 */
export function getOrderLineItems(order) {
  if (order.items && order.items.length > 0) {
    return order.items;
  }
  if (order.productId != null) {
    return [{
      productId: order.productId,
      quantity: order.quantity ?? 0,
      price: order.price ?? 0,
      costPriceAtSale: order.costPriceAtSale,
    }];
  }
  return [];
}

/**
 * Get total quantity across all line items in an order
 * @param {import('./types.js').Order} order - Order
 * @returns {number}
 */
export function getOrderTotalQuantity(order) {
  const items = getOrderLineItems(order);
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/**
 * Validate order data (single item or items array)
 * @param {import('./types.js').OrderFormData} data - Order form data
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateOrder(data) {
  if (!data.customerId) {
    return { isValid: false, error: 'Customer is required' };
  }

  const items = data.items && data.items.length > 0
    ? data.items
    : data.productId
      ? [{ productId: data.productId, quantity: data.quantity, price: data.price }]
      : [];

  if (items.length === 0) {
    return { isValid: false, error: 'At least one product is required' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId) {
      return { isValid: false, error: `Product is required for item ${i + 1}` };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { isValid: false, error: `Quantity must be greater than 0 for item ${i + 1}` };
    }
    const priceNum = Number(item.price);
    const hasValidPrice = (item.price === 0 || item.price === '0') || (item.price != null && item.price !== '' && Number.isFinite(priceNum) && priceNum >= 0);
    if (!hasValidPrice) {
      return { isValid: false, error: `Price is required for item ${i + 1}` };
    }
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + calculateOrderTotal(item.quantity, item.price),
    0
  );
  const amountPaid = data.amountPaid ?? 0;
  if (amountPaid < 0) {
    return { isValid: false, error: 'Amount paid must be 0 or greater' };
  }
  if (amountPaid > totalAmount) {
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
 * @param {import('../products/types.js').Product[]} [existingProducts] - Existing products (to store cost at sale)
 * @returns {Promise<{order: import('./types.js').Order, bottleTransaction: import('../bottles/types.js').BottleTransaction, payment: import('../payments/types.js').Payment | null, newCashBalance: import('./types.js').CashBalance}>}
 */
export async function createOrder(
  data,
  existingOrders,
  currentCashBalance,
  existingBottleTransactions,
  existingPayments,
  createdBy,
  existingProducts = []
) {
  // Normalize items: always resolve price from product (fixes free items like dispenser where form may pass empty/undefined)
  const useItems = data.items && data.items.length > 0;
  const normalizedData = useItems
    ? {
        ...data,
        items: data.items.map((item) => {
          const product = existingProducts.find((p) => p.id === item.productId);
          const priceNum = Number(item.price);
          const fromItemValid = (item.price === 0 || item.price === '0' || (Number.isFinite(priceNum) && priceNum >= 0));
          const fromProduct = product != null ? (product.price ?? 0) : 0;
          const resolvedPrice = fromItemValid ? priceNum : fromProduct;
          return { ...item, price: Number.isFinite(resolvedPrice) ? resolvedPrice : 0 };
        }),
      }
    : data;

  // Validate order
  const validation = validateOrder(normalizedData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const lineItems = useItems
    ? (normalizedData.items || data.items).map((item) => {
        const product = existingProducts.find((p) => p.id === item.productId);
        const costPriceAtSale = product ? (product.costPrice ?? 0) : 0;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          costPriceAtSale,
        };
      })
    : (() => {
        const product = existingProducts.find((p) => p.id === data.productId);
        const costPriceAtSale = product ? (product.costPrice ?? 0) : 0;
        return [{
          productId: data.productId,
          quantity: data.quantity,
          price: data.price,
          costPriceAtSale,
        }];
      })();

  const totalAmount = Math.round(
    lineItems.reduce((sum, item) => sum + calculateOrderTotal(item.quantity, item.price), 0) * 100
  ) / 100;
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const amountPaid = Math.round((data.amountPaid || 0) * 100) / 100;
  const outstandingAmount = Math.round((totalAmount - amountPaid) * 100) / 100;

  // Get next order number
  const orderNumber = await getNextOrderNumber();

  const now = new Date().toISOString();
  const deliveryDate = now.slice(0, 10); // YYYY-MM-DD
  const newOrder = {
    id: generateOrderId(),
    orderNumber,
    customerId: data.customerId,
    ...(useItems
      ? { items: lineItems }
      : {
          productId: lineItems[0].productId,
          quantity: lineItems[0].quantity,
          price: lineItems[0].price,
          costPriceAtSale: lineItems[0].costPriceAtSale,
        }),
    totalAmount,
    amountPaid,
    outstandingAmount,
    paymentMethod: amountPaid >= totalAmount ? 'cash' : 'credit',
    status: outstandingAmount > 0 ? 'pending' : 'completed',
    delivery_date: deliveryDate,
    notes: data.notes || '',
    createdAt: now,
    createdBy: createdBy || null,
  };

  // Issue bottles to customer (total quantity for all items)
  const bottleTransaction = await bottlesService.createTransaction(
    data.customerId,
    'issued',
    totalQuantity,
    `Order #${newOrder.orderNumber}`,
    createdBy,
    existingBottleTransactions
  );

  // Create payment record if amount was paid
  let payment = null;
  let finalCashBalance = currentCashBalance.amount + amountPaid; // Default: add payment amount
  if (amountPaid > 0) {
    const { createPayment } = await import('../payments/service.js');
    const paymentResult = await createPayment(
      {
        customerId: data.customerId,
        amount: amountPaid,
        paymentMethod: 'cash',
        orderId: newOrder.id,
        notes: `Payment for Order #${newOrder.orderNumber}`,
      },
      existingPayments,
      createdBy,
      currentCashBalance.amount // Pass current cash balance
    );
    payment = paymentResult.payment;
    // Use the updated cash balance from payment service if available
    // (payment service updates cash when paymentMethod is 'cash')
    if (paymentResult.newCashBalance !== undefined) {
      finalCashBalance = paymentResult.newCashBalance;
    }
  }

  // Update cash on hand (only add the amount that was actually paid)
  const newCashBalance = {
    amount: finalCashBalance,
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
 * Backfill costPriceAtSale for orders that are missing it (one-time; uses current product costPrice).
 * Does not change orders that already have costPriceAtSale.
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {Promise<import('./types.js').Order[]>} Updated orders (saved to storage if any changed)
 */
export async function backfillOrdersCostPrice(existingOrders, products) {
  let changed = false;
  const updated = existingOrders.map((order) => {
    if (order.costPriceAtSale !== undefined && order.costPriceAtSale !== null) {
      return order;
    }
    const product = products.find((p) => p.id === order.productId);
    const cost = product ? (product.costPrice ?? 0) : 0;
    changed = true;
    return { ...order, costPriceAtSale: cost };
  });
  if (changed) {
    await saveOrders(updated);
  }
  return updated;
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

/**
 * Format a date (Date or ISO string) to local YYYY-MM-DD
 * @param {Date | string} date
 * @returns {string}
 */
function toLocalDateString(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get delivery date for an order (YYYY-MM-DD, local timezone)
 * @param {import('./types.js').Order} order - Order
 * @returns {string} Delivery date
 */
export function getOrderDeliveryDate(order) {
  if (order.delivery_date) return order.delivery_date;
  if (order.createdAt) return toLocalDateString(order.createdAt);
  return toLocalDateString(new Date());
}

/**
 * Get delivery status for display: pending | ready | delivered
 * @param {import('./types.js').Order} order - Order
 * @returns {'pending' | 'ready' | 'delivered'}
 */
export function getDeliveryStatus(order) {
  const s = order.status;
  if (s === 'delivered' || s === 'shipped') return 'delivered';
  if (s === 'ready') return 'ready';
  return 'pending';
}

/**
 * Get orders that are pending (not yet marked ready for delivery)
 * @param {import('./types.js').Order[]} orders - All orders
 * @param {string | null} [deliveryDate] - YYYY-MM-DD; if null/undefined, returns ALL pending (no date filter)
 * @returns {import('./types.js').Order[]}
 */
export function getOrdersPendingDelivery(orders, deliveryDate) {
  return orders.filter((o) => {
    if (getDeliveryStatus(o) !== 'pending') return false;
    if (deliveryDate != null && deliveryDate !== '') {
      if (getOrderDeliveryDate(o) !== deliveryDate) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Get orders that are ready for driver (marked ready, not yet delivered)
 * @param {import('./types.js').Order[]} orders - All orders
 * @param {string | null} [deliveryDate] - YYYY-MM-DD; if null/undefined, returns ALL ready (no date filter)
 * @returns {import('./types.js').Order[]}
 */
export function getOrdersReadyForDelivery(orders, deliveryDate) {
  return orders.filter((o) => {
    if (getDeliveryStatus(o) !== 'ready') return false;
    if (deliveryDate != null && deliveryDate !== '') {
      if (getOrderDeliveryDate(o) !== deliveryDate) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Get orders that have been delivered (for delivered tab)
 * @param {import('./types.js').Order[]} orders - All orders
 * @param {string | null} [deliveryDate] - YYYY-MM-DD to filter by date; null = show all
 * @returns {import('./types.js').Order[]}
 */
export function getOrdersDelivered(orders, deliveryDate) {
  return orders.filter((o) => {
    if (getDeliveryStatus(o) !== 'delivered') return false;
    if (deliveryDate == null || deliveryDate === '') return true;
    const deliveredDate = o.deliveredAt
      ? toLocalDateString(new Date(o.deliveredAt))
      : getOrderDeliveryDate(o);
    return deliveredDate === deliveryDate;
  }).sort((a, b) => new Date(b.deliveredAt || b.createdAt) - new Date(a.deliveredAt || a.createdAt));
}

/**
 * Mark an order as pending (revert from ready)
 * @param {string} orderId - Order ID
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @returns {Promise<import('./types.js').Order>}
 */
export async function markOrderPending(orderId, existingOrders) {
  const i = existingOrders.findIndex((o) => o.id === orderId);
  if (i === -1) throw new Error('Order not found');
  const order = existingOrders[i];
  if (getDeliveryStatus(order) !== 'ready') {
    throw new Error('Order is not ready (cannot revert to pending)');
  }
  const updated = { ...order, status: 'pending', updatedAt: new Date().toISOString() };
  const next = [...existingOrders];
  next[i] = updated;
  await saveOrders(next);
  return updated;
}

/**
 * Mark an order as ready for delivery
 * @param {string} orderId - Order ID
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @returns {Promise<import('./types.js').Order>}
 */
export async function markOrderReady(orderId, existingOrders) {
  const i = existingOrders.findIndex((o) => o.id === orderId);
  if (i === -1) throw new Error('Order not found');
  const order = existingOrders[i];
  if (getDeliveryStatus(order) !== 'pending') {
    throw new Error('Order is not pending for delivery');
  }
  const updated = { ...order, status: 'ready', updatedAt: new Date().toISOString() };
  const next = [...existingOrders];
  next[i] = updated;
  await saveOrders(next);
  return updated;
}

/**
 * Mark an order as delivered (with optional payment and delivery proof)
 * @param {string} orderId - Order ID
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @param {{ amountPaid?: number, deliveryProofPhotoUrl?: string, deliveryProofFileId?: string, deliveredBy?: string }} options
 * @param {import('../payments/types.js').Payment[]} existingPayments - Existing payments
 * @param {number} currentCashBalance - Current cash balance (for cash payment)
 * @returns {Promise<{ order: import('./types.js').Order, payment?: import('../payments/types.js').Payment, newCashBalance?: import('./types.js').CashBalance }>}
 */
export async function markOrderDelivered(
  orderId,
  existingOrders,
  options,
  existingPayments,
  currentCashBalance
) {
  const { amountPaid = 0, deliveryProofPhotoUrl, deliveryProofFileId, deliveredBy } = options;
  const i = existingOrders.findIndex((o) => o.id === orderId);
  if (i === -1) throw new Error('Order not found');
  const order = existingOrders[i];
  if (getDeliveryStatus(order) === 'delivered') {
    throw new Error('Order is already delivered');
  }
  const now = new Date().toISOString();
  let payment = null;
  let newCashBalance = currentCashBalance;
  const paid = Math.round((amountPaid || 0) * 100) / 100;
  const newAmountPaid = (order.amountPaid || 0) + paid;
  const newOutstanding = Math.round((order.totalAmount - newAmountPaid) * 100) / 100;
  if (paid > 0) {
    const { createPayment } = await import('../payments/service.js');
    const res = await createPayment(
      {
        customerId: order.customerId,
        amount: paid,
        paymentMethod: 'cash',
        orderId: order.id,
        notes: `Delivery payment - Order #${order.orderNumber}`,
      },
      existingPayments,
      deliveredBy || null,
      currentCashBalance
    );
    payment = res.payment;
    if (res.newCashBalance !== undefined) newCashBalance = res.newCashBalance;
  }
  const updatedOrder = {
    ...order,
    status: 'delivered',
    amountPaid: newAmountPaid,
    outstandingAmount: Math.max(0, newOutstanding),
    paymentMethod: newOutstanding <= 0 ? 'cash' : 'credit',
    deliveryProofPhotoUrl: deliveryProofPhotoUrl || order.deliveryProofPhotoUrl,
    deliveryProofFileId: deliveryProofFileId || order.deliveryProofFileId,
    deliveredAt: now,
    deliveredBy: deliveredBy || null,
    updatedAt: now,
  };
  const nextOrders = [...existingOrders];
  nextOrders[i] = updatedOrder;
  await saveOrders(nextOrders);
  return {
    order: updatedOrder,
    payment,
    newCashBalance: typeof newCashBalance === 'number' ? newCashBalance : undefined,
  };
}

/**
 * Mark an order as shipped and decrease product stock (and Ready to Ship if > 0)
 * @param {string} orderId - Order ID
 * @param {import('./types.js').Order[]} existingOrders - Existing orders
 * @param {import('../products/types.js').Product[]} existingProducts - Existing products
 * @returns {Promise<{order: import('./types.js').Order, products: import('../products/types.js').Product[]}>}
 */
export async function markOrderAsShipped(orderId, existingOrders, existingProducts) {
  const orderIndex = existingOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found');
  }
  const order = existingOrders[orderIndex];
  if (order.status === 'shipped') {
    return { order, products: existingProducts };
  }
  const lineItems = getOrderLineItems(order);
  let updatedProducts = [...existingProducts];
  for (const item of lineItems) {
    const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
    if (productIndex === -1) {
      throw new Error(`Product not found for order: ${item.productId}`);
    }
    const product = updatedProducts[productIndex];
    const trackStock = product.trackStock !== false;
    const qty = item.quantity || 0;
    if (trackStock && qty > 0) {
      const currentStock = (product.currentStock ?? 0) - qty;
      const readyToShip = Math.max(0, (product.readyToShip ?? 0) - qty);
      updatedProducts[productIndex] = {
        ...product,
        currentStock: Math.max(0, currentStock),
        readyToShip,
        updatedAt: new Date().toISOString(),
      };
    }
  }
  await storageService.setItem('products_data', updatedProducts);
  const updatedOrder = { ...order, status: 'shipped', updatedAt: new Date().toISOString() };
  const updatedOrders = [...existingOrders];
  updatedOrders[orderIndex] = updatedOrder;
  await saveOrders(updatedOrders);
  return { order: updatedOrder, products: updatedProducts };
}
