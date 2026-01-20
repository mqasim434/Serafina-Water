/**
 * Weekly Summary Card Component
 * 
 * Displays weekly cash summary
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import * as cashService from '../service.js';
import { ordersService } from '../../orders/slice.js';

/**
 * Weekly Summary Card component
 */
export function WeeklySummaryCard() {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);

  // Calculate weekly summary from orders
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);

  let totalIncome = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = cashService.formatDate(date);
    totalIncome += cashService.calculateDailyIncome(dateStr, orders);
  }

  const netCash = totalIncome; // Assuming no expenses for now

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('weeklySummary')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('thisWeek')}</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('totalIncome')}:</span>
          <span className="text-lg font-semibold text-green-600">
            Rs. {totalIncome.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('totalExpenses')}:</span>
          <span className="text-lg font-semibold text-red-600">Rs. 0</span>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">{t('netCash')}:</span>
            <span className="text-xl font-bold text-blue-600">
              Rs. {netCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
