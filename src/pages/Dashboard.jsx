/**
 * Dashboard Page
 * 
 * Main dashboard with key metrics widgets
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import * as cashService from '../features/cash/service.js';
import { bottlesService } from '../features/bottles/slice.js';
import { expensesService } from '../features/expenses/slice.js';

/**
 * Dashboard Widget Component
 * @param {Object} props
 * @param {string} props.title - Widget title
 * @param {string | number} props.value - Widget value
 * @param {string} props.icon - Icon SVG path
 * @param {string} props.bgColor - Background color class
 * @param {string} props.textColor - Text color class
 */
function DashboardWidget({ title, value, icon, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-lg shadow-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textColor} opacity-90`}>{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
        </div>
        <div className={`${textColor} opacity-20`}>
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { transactions } = useSelector((state) => state.bottles);
  const { items: expenses } = useSelector((state) => state.expenses);
  const { cashBalance } = useSelector((state) => state.orders);

  // Calculate today's deliveries (today's orders)
  const today = cashService.getTodayDate();
  const todayDeliveries = orders.filter((order) => {
    const orderDate = cashService.formatDate(new Date(order.createdAt));
    return orderDate === today;
  });
  const todayDeliveriesCount = todayDeliveries.length;
  const todayDeliveriesAmount = todayDeliveries.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  // Calculate outstanding bottles
  const globalSummary = bottlesService.calculateGlobalSummary(transactions);
  const outstandingBottles = globalSummary.totalOutstanding;

  // Cash on hand
  const cashOnHand = cashBalance?.amount || 0;

  // Calculate today's expenses
  const todayExpenses = expenses.filter((expense) => {
    const expenseDate = cashService.formatDate(new Date(expense.createdAt));
    return expenseDate === today;
  });
  const todayExpensesAmount = expensesService.calculateTotalExpenses(todayExpenses);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('welcome')}</p>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Deliveries */}
        <DashboardWidget
          title={t('todayDeliveries')}
          value={todayDeliveriesCount}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          bgColor="bg-blue-500"
          textColor="text-white"
        />

        {/* Outstanding Bottles */}
        <DashboardWidget
          title={t('outstandingBottles')}
          value={outstandingBottles}
          icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          bgColor="bg-orange-500"
          textColor="text-white"
        />

        {/* Cash on Hand */}
        <DashboardWidget
          title={t('cashOnHand')}
          value={`Rs. ${cashOnHand.toLocaleString()}`}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          bgColor="bg-green-500"
          textColor="text-white"
        />

        {/* Today's Expenses */}
        <DashboardWidget
          title={t('todayExpenses')}
          value={`Rs. ${todayExpensesAmount.toLocaleString()}`}
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          bgColor="bg-red-500"
          textColor="text-white"
        />
      </div>

      {/* Additional Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Deliveries Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('todayDeliveries')}</h2>
          {todayDeliveriesCount === 0 ? (
            <p className="text-gray-500">{t('noDeliveriesToday')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('totalOrders')}:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {todayDeliveriesCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('totalAmount')}:</span>
                <span className="text-lg font-semibold text-green-600">
                  Rs. {todayDeliveriesAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Today's Expenses Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('todayExpenses')}</h2>
          {todayExpensesAmount === 0 ? (
            <p className="text-gray-500">{t('noExpensesToday')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('totalExpenses')}:</span>
                <span className="text-lg font-semibold text-red-600">
                  Rs. {todayExpensesAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('expenseCount')}:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {todayExpenses.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}