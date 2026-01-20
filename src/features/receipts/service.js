/**
 * Receipts Service
 * 
 * Business logic for receipt generation, PDF export, and sharing
 * No React/Redux dependencies - pure JavaScript functions
 */

/**
 * Format date for receipt
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatReceiptDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format currency for receipt
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

/**
 * Generate receipt data from order
 * @param {import('../orders/types.js').Order} order - Order object
 * @param {import('../customers/types.js').Customer} customer - Customer object
 * @returns {Object} Receipt data
 */
export function generateReceiptData(order, customer, product = null) {
  const productName = product ? `${product.name} (${product.size})` : 'Water Bottles';
  
  return {
    receiptNumber: order.id,
    date: formatReceiptDate(order.createdAt),
    customerName: customer?.name || 'Unknown',
    customerPhone: customer?.phone || 'N/A',
    customerAddress: customer?.address || 'N/A',
    items: [
      {
        description: productName,
        quantity: order.quantity,
        unitPrice: order.price || order.pricePerBottle || 0,
        total: order.totalAmount,
      },
    ],
    subtotal: order.totalAmount,
    total: order.totalAmount,
    amountPaid: order.amountPaid || 0,
    outstandingAmount: order.outstandingAmount || 0,
    paymentMethod: order.paymentMethod,
    notes: order.notes || '',
  };
}

/**
 * Generate WhatsApp share text
 * @param {Object} receiptData - Receipt data
 * @returns {string} WhatsApp share text
 */
export function generateWhatsAppShareText(receiptData) {
  const lines = [
    `*Receipt #${receiptData.receiptNumber}*`,
    `*Serafina Water*`,
    '',
    `Date: ${receiptData.date}`,
    `Customer: ${receiptData.customerName}`,
    `Phone: ${receiptData.customerPhone}`,
    '',
    '*Items:*',
    `${receiptData.items[0].description} x ${receiptData.items[0].quantity}`,
    `Unit Price: ${formatCurrency(receiptData.items[0].unitPrice)}`,
    '',
    `*Total: ${formatCurrency(receiptData.total)}*`,
    `Payment: ${receiptData.paymentMethod}`,
    '',
    'Thank you for your business!',
  ];

  if (receiptData.notes) {
    lines.push('', `Notes: ${receiptData.notes}`);
  }

  return lines.join('\n');
}

/**
 * Generate WhatsApp share URL
 * @param {string} text - Text to share
 * @param {string} phoneNumber - Customer phone number (optional)
 * @returns {string} WhatsApp share URL
 */
export function generateWhatsAppShareUrl(text, phoneNumber = null) {
  const encodedText = encodeURIComponent(text);
  
  if (phoneNumber) {
    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    // Add country code if not present (assuming Pakistan +92)
    const phone = cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone}`;
    return `https://wa.me/${phone}?text=${encodedText}`;
  }
  
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Print receipt
 * @param {string} elementId - ID of the element to print
 */
export function printReceipt(elementId) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.error('printReceipt can only be called in browser environment');
    return;
  }
  
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Receipt element not found');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print receipt');
    return;
  }

  // Get the receipt HTML
  const receiptHTML = element.innerHTML;

  // Write to print window
  const htmlContent = [
    '<!DOCTYPE html>',
    '<html>',
    '  <head>',
    '    <title>Receipt</title>',
    '    <style>',
    '      @media print {',
    '        @page {',
    '          size: A4;',
    '          margin: 1cm;',
    '        }',
    '        body {',
    '          margin: 0;',
    '          padding: 0;',
    '        }',
    '      }',
    '      body {',
    '        font-family: Arial, sans-serif;',
    '        padding: 20px;',
    '        max-width: 600px;',
    '        margin: 0 auto;',
    '      }',
    '      .receipt-header {',
    '        text-align: center;',
    '        border-bottom: 2px solid #000;',
    '        padding-bottom: 10px;',
    '        margin-bottom: 20px;',
    '      }',
    '      .receipt-body {',
    '        margin: 20px 0;',
    '      }',
    '      .receipt-footer {',
    '        border-top: 2px solid #000;',
    '        padding-top: 10px;',
    '        margin-top: 20px;',
    '        text-align: center;',
    '      }',
    '      table {',
    '        width: 100%;',
    '        border-collapse: collapse;',
    '        margin: 15px 0;',
    '      }',
    '      th, td {',
    '        padding: 8px;',
    '        text-align: left;',
    '        border-bottom: 1px solid #ddd;',
    '      }',
    '      th {',
    '        background-color: #f5f5f5;',
    '        font-weight: bold;',
    '      }',
    '      .text-right {',
    '        text-align: right;',
    '      }',
    '      .text-center {',
    '        text-align: center;',
    '      }',
    '      .total-row {',
    '        font-weight: bold;',
    '        font-size: 1.1em;',
    '      }',
    '    </style>',
    '  </head>',
    '  <body>',
    '    ' + receiptHTML,
    '  </body>',
    '</html>'
  ].join('\n');
  
  printWindow.document.write(htmlContent);

  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };
}

/**
 * Generate PDF from receipt element
 * Uses browser's print to PDF functionality
 * @param {string} elementId - ID of the element to convert to PDF
 * @param {string} filename - Filename for PDF
 */
export function generatePDF(elementId, filename = 'receipt.pdf') {
  // For now, we'll use the print function which allows "Save as PDF"
  // In a production app, you might want to use a library like jsPDF or html2pdf.js
  printReceipt(elementId);
  
  // Note: For actual PDF download, you would need to install a library:
  // npm install jspdf html2canvas
  // Then use it to convert the HTML element to PDF
}

/**
 * Download receipt as PDF (using print dialog)
 * @param {string} elementId - ID of the element to convert
 */
export function downloadReceiptAsPDF(elementId) {
  printReceipt(elementId);
  // Browser's print dialog will allow user to "Save as PDF"
}

/**
 * Share receipt via WhatsApp
 * @param {Object} receiptData - Receipt data
 * @param {string} phoneNumber - Customer phone number (optional)
 */
export function shareReceiptViaWhatsApp(receiptData, phoneNumber = null) {
  if (typeof window === 'undefined') {
    console.error('shareReceiptViaWhatsApp can only be called in browser environment');
    return;
  }
  
  const shareText = generateWhatsAppShareText(receiptData);
  const shareUrl = generateWhatsAppShareUrl(shareText, phoneNumber);
  window.open(shareUrl, '_blank');
