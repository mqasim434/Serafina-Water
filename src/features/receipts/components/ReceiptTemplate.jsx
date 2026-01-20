/**
 * Receipt Template Component
 * 
 * Printable receipt layout
 */

import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { formatCurrency } from '../service.js';

/**
 * Receipt Template props
 * @typedef {Object} ReceiptTemplateProps
 * @property {Object} receiptData - Receipt data object
 * @property {string} [id] - Element ID for printing
 * @property {boolean} [showActions] - Show action buttons (print, share)
 * @property {function()} [onPrint] - Print handler
 * @property {function()} [onShare] - Share handler
 */

/**
 * Receipt Template component
 * @param {ReceiptTemplateProps} props
 */
export function ReceiptTemplate({
  receiptData,
  id = 'receipt-template',
  showActions = false,
  onPrint,
  onShare,
}) {
  const { t } = useTranslation();

  if (!receiptData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        {t('noReceipt')}
      </div>
    );
  }

  return (
    <div id={id} className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      {/* Receipt Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('appName')}</h1>
        <p className="text-sm text-gray-600 mt-2">Water Bottle Delivery Service</p>
      </div>

      {/* Receipt Info */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">{t('receiptNumber')}:</span>
          <span className="font-semibold">#{receiptData.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t('date')}:</span>
          <span>{receiptData.date}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-gray-900 mb-2">{t('customer')}</h2>
        <p className="text-sm text-gray-700">{receiptData.customerName}</p>
        <p className="text-sm text-gray-700">{receiptData.customerPhone}</p>
        <p className="text-sm text-gray-700">{receiptData.customerAddress}</p>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 px-4 font-semibold">{t('description')}</th>
              <th className="text-center py-2 px-4 font-semibold">{t('quantity')}</th>
              <th className="text-right py-2 px-4 font-semibold">{t('unitPrice')}</th>
              <th className="text-right py-2 px-4 font-semibold">{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">{item.description}</td>
                <td className="py-3 px-4 text-center">{item.quantity}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-4 text-right font-medium">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-lg font-semibold border-t-2 border-gray-800 pt-4">
          <span>{t('totalAmount')}:</span>
          <span className="text-blue-600">{formatCurrency(receiptData.total)}</span>
        </div>
        {receiptData.amountPaid !== undefined && receiptData.amountPaid > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{t('amountPaid')}:</span>
            <span>{formatCurrency(receiptData.amountPaid)}</span>
          </div>
        )}
        {receiptData.outstandingAmount !== undefined && receiptData.outstandingAmount > 0 && (
          <div className="flex justify-between text-sm font-semibold text-orange-600">
            <span>{t('outstandingAmount')}:</span>
            <span>{formatCurrency(receiptData.outstandingAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('paymentMethod')}:</span>
          <span className="capitalize">{receiptData.paymentMethod}</span>
        </div>
      </div>

      {/* Notes */}
      {receiptData.notes && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">{t('notes')}:</span> {receiptData.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center border-t-2 border-gray-800 pt-4 mt-6">
        <p className="text-sm text-gray-600">{t('thankYou')}</p>
        <p className="text-xs text-gray-500 mt-2">
          {t('receiptFooter')}
        </p>
      </div>

      {/* Action Buttons (hidden when printing) */}
      {showActions && (
        <div className="mt-6 flex justify-center gap-4 print:hidden">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('print')}
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t('shareWhatsApp')}
            </button>
          )}
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
