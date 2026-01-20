/**
 * Cash Summary Component
 * 
 * Displays real-time cash on hand and daily summary
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import * as cashService from '../service.js';
import { ordersService } from '../../orders/slice.js';

/**
 * Cash Summary component
 */
export function CashSummary() {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);

  // Calculate real-time cash
  const realTimeCash = cashService.calculateRealTimeCash(orders, payments);

  // Calculate today's income from orders
  const today = cashService.getTodayDate();
  const todayIncome = cashService.calculateDailyIncome(today, orders);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('cashManagement')}</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">{t('cashOnHand')}</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              Rs. {realTimeCash.toLocaleString()}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">{t('today')} {t('income')}</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              Rs. {todayIncome.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
