/**
 * Customers With Outstanding Bottles Component
 * 
 * Displays a list of customers who have bottles to be returned
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { bottlesService } from '../slice.js';

/**
 * Customers With Outstanding Bottles props
 * @typedef {Object} CustomersWithOutstandingBottlesProps
 * @property {Function} onSelectCustomer - Callback when a customer is selected
 */
export function CustomersWithOutstandingBottles({ onSelectCustomer }) {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  // Calculate customers with outstanding bottles (only returnable products)
  const customersWithOutstanding = useMemo(() => {
    // Get unique customer IDs from orders
    const customerIds = new Set(orders.map((o) => o.customerId));
    
    // Calculate outstanding for each customer (only returnable products)
    return Array.from(customerIds)
      .map((customerId) => {
        const customer = customers.find((c) => c.id === customerId);
        if (!customer) return null;
        
        // Calculate outstanding bottles for returnable products only
        const outstanding = bottlesService.calculateOutstandingReturnable(
          customerId,
          transactions,
          orders,
          products
        );
        
        // Only include if outstanding > 0
        if (outstanding <= 0) return null;
        
        return {
          customerId,
          customer,
          outstanding,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => {
        // Sort by outstanding count (descending), then by customer name
        if (b.outstanding !== a.outstanding) {
          return b.outstanding - a.outstanding;
        }
        return a.customer.name.localeCompare(b.customer.name);
      });
  }, [transactions, customers, orders, products]);

  if (customersWithOutstanding.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('customersWithOutstandingBottles')}
        </h2>
        <p className="text-gray-500 text-center py-8">
          {t('noCustomersWithOutstandingBottles')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('customersWithOutstandingBottles')}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {t('selectCustomerToReturnBottles')}
        </p>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {customersWithOutstanding.map((item) => (
          <button
            key={item.customerId}
            type="button"
            onClick={() => onSelectCustomer(item.customerId)}
            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.customer.name}</p>
                {item.customer.phone && (
                  <p className="text-sm text-gray-500 mt-1">{item.customer.phone}</p>
                )}
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-medium text-gray-600">{t('outstanding')}</p>
                <p className="text-lg font-bold text-orange-600 mt-1">
                  {item.outstanding}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
