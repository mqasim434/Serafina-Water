/**
 * Payment History Component
 * 
 * Displays payment history for a customer
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { paymentsService } from '../slice.js';

/**
 * Payment History props
 * @typedef {Object} PaymentHistoryProps
 * @property {string} customerId - Customer ID
 */

/**
 * Payment History component
 * @param {PaymentHistoryProps} props
 */
export function PaymentHistory({ customerId }) {
  const { t } = useTranslation();
  const { items: payments } = useSelector((state) => state.payments);

  const customerPayments = paymentsService.getPaymentHistory(customerId, payments);

  if (customerPayments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t('noPayments')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('paymentHistory')}</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {customerPayments.map((payment) => (
          <div key={payment.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {payment.paymentMethod}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {payment.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(payment.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
                {payment.notes && (
                  <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
