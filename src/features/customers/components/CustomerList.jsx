/**
 * Customer List Component
 * 
 * Displays list of customers with search functionality
 */

import { useState } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { customersService } from '../slice.js';

/**
 * Customer List props
 * @typedef {Object} CustomerListProps
 * @property {import('../types.js').Customer[]} customers - Array of customers
 * @property {function(string): void} onSelect - Handler when customer is selected
 * @property {function(): void} onAdd - Handler for add button
 */

/**
 * Customer List component
 * @param {CustomerListProps} props
 */
export function CustomerList({ customers, onSelect, onAdd }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCustomers = customersService.searchCustomers(searchQuery, customers);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('customers')}</h2>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('addCustomer')}
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search')}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="divide-y divide-gray-200">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('noCustomers')}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => onSelect(customer.id)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">{customer.address}</p>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {customer.preferredLanguage === 'en' ? 'EN' : 'UR'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

