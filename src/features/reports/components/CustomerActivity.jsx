/**
 * Customer Activity Component
 * 
 * Displays inactive customers with filters for 30, 60, and 90+ days
 */

import { useState } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { generateCustomerActivityReport } from '../service.js';

/**
 * Customer Activity props
 * @typedef {Object} CustomerActivityProps
 * @property {import('../../customers/types.js').Customer[]} customers - All customers
 * @property {import('../../orders/types.js').Order[]} orders - All orders
 * @property {import('../../products/types.js').Product[]} products - All products
 */

/**
 * Customer Activity component
 * @param {CustomerActivityProps} props
 */
export function CustomerActivity({ customers, orders, products }) {
  const { t } = useTranslation();
  const [filterDays, setFilterDays] = useState(null); // null = all (30+), 30, 60, 90

  // Generate report data
  const activityData = generateCustomerActivityReport(customers, orders, products, filterDays);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case '90_days':
        return 'bg-red-100 text-red-800';
      case '60_days':
        return 'bg-orange-100 text-orange-800';
      case '30_days':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_orders':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case '90_days':
        return t('noOrder90Days');
      case '60_days':
        return t('noOrder60Days');
      case '30_days':
        return t('noOrder30Days');
      case 'no_orders':
        return t('noOrders');
      default:
        return t('active');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('filterByInactivity')}
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDays(null)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterDays === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('allInactive')} (30+)
          </button>
          <button
            onClick={() => setFilterDays(30)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterDays === 30
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('show30Days')}
          </button>
          <button
            onClick={() => setFilterDays(60)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterDays === 60
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('show60Days')}
          </button>
          <button
            onClick={() => setFilterDays(90)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterDays === 90
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('show90Days')}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {t('showingResults')}: {activityData.length} {t('customers')}
      </div>

      {/* Table */}
      {activityData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {t('noInactiveCustomers')}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('lastOrderDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('daysSinceLastOrder')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('averageOrderQuantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('mostFrequentProduct')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activityData.map((report) => (
                  <tr key={report.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.lastOrderDate || t('never')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.daysSinceLastOrder !== null
                        ? `${report.daysSinceLastOrder} ${t('days')}`
                        : t('never')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.averageOrderQuantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.mostFrequentProduct}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          report.inactivityStatus
                        )}`}
                      >
                        {getStatusLabel(report.inactivityStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
