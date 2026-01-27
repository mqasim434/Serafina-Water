/**
 * Customer Balance Card Component
 * 
 * Displays customer balance summary
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { paymentsService } from '../slice.js';

/**
 * Customer Balance Card props
 * @typedef {Object} CustomerBalanceCardProps
 * @property {string} customerId - Customer ID
 */

/**
 * Customer Balance Card component
 * @param {CustomerBalanceCardProps} props
 */
export function CustomerBalanceCard({ customerId }) {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { items: customers } = useSelector((state) => state.customers);

  const balance = paymentsService.calculateCustomerBalance(customerId, orders, payments, customers);
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('balance')}</h2>
        <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">{t('totalOrders')}:</span>
          <span className="text-sm font-medium text-gray-900">
            Rs. {balance.totalOrders.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">{t('totalPayments')}:</span>
          <span className="text-sm font-medium text-green-600">
            Rs. {balance.totalPayments.toLocaleString()}
          </span>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">
              {t('outstandingBalance')}:
            </span>
            <span
              className={`text-xl font-bold ${
                balance.balance > 0
                  ? 'text-orange-600'
                  : balance.balance < 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              Rs. {balance.balance.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {t('Balance Calculation') || 'Calculation: Total Orders - Total Payments'}
          </div>
        </div>
      </div>
    </div>
  );
}
