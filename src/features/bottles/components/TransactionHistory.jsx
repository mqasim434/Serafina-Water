/**
 * Transaction History Component
 * 
 * Displays list of bottle transactions
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { bottlesService } from '../slice.js';

/**
 * Transaction History props
 * @typedef {Object} TransactionHistoryProps
 * @property {string} [customerId] - Optional customer ID to filter transactions
 */

/**
 * Transaction History component
 * @param {TransactionHistoryProps} props
 */
export function TransactionHistory({ customerId }) {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);

  const displayTransactions = customerId
    ? bottlesService.getCustomerTransactions(customerId, transactions)
    : [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getCustomerName = (id) => {
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('transactionHistory')}</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {displayTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('noTransactions')}</div>
        ) : (
          displayTransactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {!customerId && (
                    <p className="text-sm font-medium text-gray-900">
                      {getCustomerName(transaction.customerId)}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'issued'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {transaction.type === 'issued' ? t('issued') : t('returned')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {transaction.quantity} {t('bottles')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {transaction.notes && (
                    <p className="mt-1 text-sm text-gray-500">{transaction.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
