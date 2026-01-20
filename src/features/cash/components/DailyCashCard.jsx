/**
 * Daily Cash Card Component
 * 
 * Displays daily opening/closing balance and summary
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import * as cashService from '../service.js';
import { ordersService } from '../../orders/slice.js';

/**
 * Daily Cash Card component
 */
export function DailyCashCard() {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);

  // For now, we'll calculate from orders
  // In a full implementation, this would load from daily records
  const today = cashService.getTodayDate();
  const todayIncome = cashService.calculateDailyIncome(today, orders);
  const realTimeCash = cashService.calculateRealTimeCash(orders, payments);

  // Calculate opening balance (current balance - today's income)
  const openingBalance = Math.max(0, realTimeCash - todayIncome);
  const closingBalance = realTimeCash;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('dailySummary')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('today')}: {today}</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('openingBalance')}:</span>
          <span className="text-lg font-semibold text-gray-900">
            Rs. {openingBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('totalIncome')}:</span>
          <span className="text-lg font-semibold text-green-600">
            +Rs. {todayIncome.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('totalExpenses')}:</span>
          <span className="text-lg font-semibold text-red-600">
            -Rs. 0
          </span>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">{t('closingBalance')}:</span>
            <span className="text-2xl font-bold text-blue-600">
              Rs. {closingBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
