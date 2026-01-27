/**
 * Customer Bottle Balance Component
 * 
 * Displays bottle balance for a specific customer
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { bottlesService } from '../slice.js';

/**
 * Customer Bottle Balance props
 * @typedef {Object} CustomerBottleBalanceProps
 * @property {string} customerId - Customer ID
 */

/**
 * Customer Bottle Balance component
 * @param {CustomerBottleBalanceProps} props
 */
export function CustomerBottleBalance({ customerId }) {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  const balance = bottlesService.calculateCustomerBalance(customerId, transactions);
  const outstandingReturnable = bottlesService.calculateOutstandingReturnable(
    customerId,
    transactions,
    orders,
    products
  );
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('customerBalance')}</h2>
        <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t('issued')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{balance.issued}</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t('returned')}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{balance.returned}</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t('outstanding')}</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                outstandingReturnable > 0
                  ? 'text-orange-600'
                  : outstandingReturnable < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {outstandingReturnable}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
