/**
 * Bottle Summary Component
 * 
 * Displays global bottle summary
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { bottlesService } from '../slice.js';

/**
 * Bottle Summary component
 */
export function BottleSummary() {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);

  const summary = bottlesService.calculateGlobalSummary(transactions);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('globalSummary')}</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">{t('totalIssued')}</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{summary.totalIssued}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">{t('totalReturned')}</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{summary.totalReturned}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-600">{t('totalOutstanding')}</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{summary.totalOutstanding}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">{t('totalCustomers')}</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{summary.totalCustomers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
