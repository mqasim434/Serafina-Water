/**
 * WhatsApp integration for delivery notifications.
 * Opens WhatsApp with order summary when order is marked delivered.
 */

import { getOrderLineItems } from '../orders/service.js';
import { shortenUrl } from './urlShortener.js';

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
 * Build order summary text for WhatsApp message (English + Urdu)
 * @param {Object} order - Order object
 * @param {Object} customer - Customer object
 * @param {import('../products/types.js').Product[]} products - Products array
 * @param {number} [amountPaid] - Amount paid on delivery
 * @param {number} [outstandingAmount] - Outstanding amount for this order (before payment)
 * @param {string} [deliveryProofPhotoUrl] - URL of delivery proof photo (included as clickable link; wa.me does not support image attachments)
 * @returns {string} Order summary text
 */
export function buildOrderSummaryForWhatsApp(order, customer, products, amountPaid = 0, outstandingAmount, deliveryProofPhotoUrl) {
  const lineItems = getOrderLineItems(order);
  const outstanding = outstandingAmount ?? order.outstandingAmount ?? 0;
  const paid = amountPaid ?? 0;
  const remaining = Math.max(0, outstanding - paid);
  const total = order.totalAmount ?? 0;
  const custName = customer?.name || 'Customer';

  // Build line item strings (shared)
  const itemStrsEn = [];
  const itemStrsUr = [];
  lineItems.forEach((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const name = product ? `${product.name} (${product.size})` : 'Item';
    const qty = item.quantity ?? 0;
    const price = item.price ?? 0;
    const lineTotal = qty * price;
    const amt = lineTotal.toLocaleString();
    itemStrsEn.push(`• ${name} x ${qty} — Rs. ${amt}`);
    itemStrsUr.push(`• ${name} x ${qty} — Rs. ${amt}`);
  });

  const proofBlock = deliveryProofPhotoUrl
    ? ['', 'Delivery proof photo (tap to view):', deliveryProofPhotoUrl]
    : [];
  const proofBlockUr = deliveryProofPhotoUrl
    ? ['', 'ڈیلیوری ثبوت فوٹو (دیکھنے کے لیے ٹیپ کریں):', deliveryProofPhotoUrl]
    : [];

  // English section
  const en = [
    `*Order #${order.orderNumber}* - Delivered ✓`,
    '',
    `Hi ${custName}!`,
    '',
    'Your order has been delivered:',
    ...itemStrsEn,
    '',
    `*Total: Rs. ${total.toLocaleString()}*`,
    ...(outstanding > 0
      ? [
          '',
          `Amount paid: Rs. ${paid.toLocaleString()}`,
          remaining > 0 ? `Remaining balance: Rs. ${remaining.toLocaleString()}` : 'Paid in full ✓',
        ]
      : []),
    ...proofBlock,
    '',
    'Thank you for your order! 🙏',
  ];

  // Urdu section
  const ur = [
    `*آرڈر #${order.orderNumber}* - ڈیلیور شدہ ✓`,
    '',
    `سلام ${custName}!`,
    '',
    'آپ کا آرڈر ڈیلیور ہو گیا ہے:',
    ...itemStrsUr,
    '',
    `*کل: Rs. ${total.toLocaleString()}*`,
    ...(outstanding > 0
      ? [
          '',
          `ادا شدہ رقم: Rs. ${paid.toLocaleString()}`,
          remaining > 0 ? `باقی رقم: Rs. ${remaining.toLocaleString()}` : 'مکمل ادائیگی ✓',
        ]
      : []),
    ...proofBlockUr,
    '',
    'آپ کے آرڈر کا شکریہ! 🙏',
  ];

  return en.join('\n') + '\n\n─────────────────\n\n' + ur.join('\n');
}

/**
 * Open WhatsApp with order summary to customer's phone.
 * Shortens the delivery proof image URL when present to keep the message and wa.me link within limits.
 * @param {Object} order - Order object
 * @param {Object} customer - Customer object
 * @param {import('../products/types.js').Product[]} products - Products array
 * @param {number} [amountPaid] - Amount paid on delivery
 * @param {number} [outstandingAmount] - Outstanding amount for this order (before payment)
 * @param {string} [deliveryProofPhotoUrl] - URL of delivery proof photo (shortened before inclusion)
 * @returns {Promise<boolean>} True if WhatsApp was opened, false if no valid phone
 */
export async function openWhatsAppWithOrderSummary(order, customer, products, amountPaid = 0, outstandingAmount, deliveryProofPhotoUrl) {
  const phone = formatPhoneForWhatsApp(customer?.phone);
  if (!phone) return false;

  const photoUrlToUse = deliveryProofPhotoUrl ? await shortenUrl(deliveryProofPhotoUrl) : deliveryProofPhotoUrl;
  const message = buildOrderSummaryForWhatsApp(order, customer, products, amountPaid, outstandingAmount, photoUrlToUse);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
