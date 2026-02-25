/**
 * WhatsApp integration for delivery notifications.
 * Opens WhatsApp with order summary when order is marked delivered.
 * Uses api.whatsapp.com/send (not wa.me) for proper emoji display on desktop and mobile.
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

  // Build line item strings
  const itemStrsEn = [];
  const itemStrsUr = [];
  lineItems.forEach((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const name = product ? `${product.name} (${product.size})` : 'Item';
    const qty = item.quantity ?? 0;
    const price = item.price ?? 0;
    const lineTotal = qty * price;
    const amt = lineTotal.toLocaleString();
    itemStrsEn.push(`* ${name} x ${qty} – Rs. ${amt}`);
    itemStrsUr.push(`* ${name} x ${qty} – ${amt} روپے`);
  });

  const proofBlock = deliveryProofPhotoUrl
    ? ['', 'Delivery proof photo (tap to view):', deliveryProofPhotoUrl]
    : [];
  const proofBlockUr = deliveryProofPhotoUrl
    ? ['', 'ڈیلیوری ثبوت فوٹو (دیکھنے کے لیے ٹیپ کریں):', deliveryProofPhotoUrl]
    : [];

  // Emojis via Unicode escapes for reliable encoding across devices
  const E = { party: '\u{1F389}', wave: '\u{1F44B}', truck: '\u{1F69A}', drop: '\u{1F4A7}', check: '\u2713' };

  // English section
  const en = [
    `${E.party} Order #${order.orderNumber} – Delivered ${E.party}`,
    '',
    `Hi ${custName} ${E.wave}`,
    '',
    `Your order has been delivered successfully ${E.truck}`,
    '',
    ...itemStrsEn,
    '',
    `Total: Rs. ${total.toLocaleString()}`,
    '',
    `Thank you for choosing Serafina Water ${E.drop}`,
    ...(outstanding > 0
      ? [
          '',
          `Amount paid: Rs. ${paid.toLocaleString()}`,
          remaining > 0 ? `Remaining balance: Rs. ${remaining.toLocaleString()}` : `Paid in full ${E.check}`,
        ]
      : []),
    ...proofBlock,
  ];

  // Urdu section
  const ur = [
    `${E.party} آرڈر نمبر ${order.orderNumber} – ڈیلیور ہو گیا ہے ${E.party}`,
    '',
    `السلام علیکم ${custName} ${E.wave}`,
    '',
    `آپ کا آرڈر کامیابی کے ساتھ ڈیلیور کر دیا گیا ہے ${E.truck}`,
    '',
    ...itemStrsUr,
    '',
    `کل رقم: ${total.toLocaleString()} روپے`,
    '',
    `سیرافینا واٹر کا انتخاب کرنے کا شکریہ ${E.drop}`,
    ...(outstanding > 0
      ? [
          '',
          `ادا شدہ رقم: ${paid.toLocaleString()} روپے`,
          remaining > 0 ? `باقی رقم: ${remaining.toLocaleString()} روپے` : `مکمل ادائیگی ${E.check}`,
        ]
      : []),
    ...proofBlockUr,
  ];

  return en.join('\n') + '\n\n--------------------\n\n' + ur.join('\n');
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
  // Use api.whatsapp.com/send instead of wa.me for proper emoji display (wa.me has known emoji encoding bugs)
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
