/**
 * WhatsApp integration for delivery notifications.
 * Opens WhatsApp with order summary when order is marked delivered.
 */

import { getOrderLineItems } from '../orders/service.js';

/**
 * Format phone number for WhatsApp (digits only, with country code).
 * Handles Pakistan format: 03001234567 -> 923001234567
 * @param {string} phone - Raw phone number
 * @returns {string} Phone for wa.me (digits only, with country code) or empty if invalid
 */
export function formatPhoneForWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '';
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  if (!digits.startsWith('92') && digits.length === 10) return '92' + digits;
  return digits;
}

/**
 * Build order summary text for WhatsApp message
 * @param {Object} order - Order object
 * @param {Object} customer - Customer object
 * @param {import('../products/types.js').Product[]} products - Products array
 * @returns {string} Order summary text
 */
export function buildOrderSummaryForWhatsApp(order, customer, products) {
  const lineItems = getOrderLineItems(order);

  const lines = [
    `*Order #${order.orderNumber}* - Delivered ✓`,
    '',
    `Hi ${customer?.name || 'Customer'}!`,
    '',
    'Your order has been delivered:',
  ];

  lineItems.forEach((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const name = product ? `${product.name} (${product.size})` : 'Item';
    const qty = item.quantity ?? 0;
    const price = item.price ?? 0;
    const lineTotal = qty * price;
    lines.push(`• ${name} x ${qty} — Rs. ${lineTotal.toLocaleString()}`);
  });

  lines.push('');
  lines.push(`*Total: Rs. ${(order.totalAmount ?? 0).toLocaleString()}*`);
  lines.push('');
  lines.push('Thank you for your order! 🙏');

  return lines.join('\n');
}

/**
 * Open WhatsApp with order summary to customer's phone
 * @param {Object} order - Order object
 * @param {Object} customer - Customer object
 * @param {import('../products/types.js').Product[]} products - Products array
 * @returns {boolean} True if WhatsApp was opened, false if no valid phone
 */
export function openWhatsAppWithOrderSummary(order, customer, products) {
  const phone = formatPhoneForWhatsApp(customer?.phone);
  if (!phone) return false;

  const message = buildOrderSummaryForWhatsApp(order, customer, products);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
