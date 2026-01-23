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
import { waterQualityService } from '../features/waterQuality/slice.js';

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
  const { items: waterQualityEntries } = useSelector((state) => state.waterQuality);

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

  // Get water quality alerts
  const criticalEntries = waterQualityService.getCriticalEntries(waterQualityEntries);
  const warningEntries = waterQualityService.getEntriesWithAlerts(waterQualityEntries).filter(
    (entry) => entry.status === 'warning'
  );
  const latestEntry = waterQualityService.getLatestEntry(waterQualityEntries);

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

      {/* Water Quality Status Widget */}
      {latestEntry && (
        <div
          className={`rounded-lg shadow-lg p-6 ${
            latestEntry.status === 'normal'
              ? 'bg-green-500'
              : latestEntry.status === 'warning'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium text-white opacity-90`}>
                {t('recentWaterQuality')}
              </p>
              <p className={`text-lg font-semibold text-white mt-2`}>
                {new Date(latestEntry.date).toLocaleDateString()}
                {latestEntry.time && (
                  <span className="text-sm font-normal ml-2 opacity-90">
                    {latestEntry.time}
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm text-white opacity-90">
                  <span>pH:</span>
                  <span className="font-semibold">{latestEntry.pH}</span>
                </div>
                <div className="flex justify-between text-sm text-white opacity-90">
                  <span>TDS:</span>
                  <span className="font-semibold">{latestEntry.tds} ppm</span>
                </div>
                <div className="flex justify-between text-sm text-white opacity-90">
                  <span>{t('chlorine')}:</span>
                  <span className="font-semibold">{latestEntry.chlorine}</span>
                </div>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    latestEntry.status === 'normal'
                      ? 'bg-white text-green-600'
                      : latestEntry.status === 'warning'
                      ? 'bg-white text-yellow-600'
                      : 'bg-white text-red-600'
                  }`}
                >
                  {latestEntry.status === 'normal'
                    ? t('normal')
                    : latestEntry.status === 'warning'
                    ? t('warning')
                    : t('critical')}
                </span>
              </div>
            </div>
            <div className="text-white opacity-20 ml-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Water Quality Alerts */}
      {(criticalEntries.length > 0 || warningEntries.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('waterQualityAlerts')}</h2>
          {criticalEntries.length > 0 && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 font-bold text-lg mr-2">🔴</span>
                  <span className="text-red-900 font-semibold">
                    {t('criticalAlerts')}: {criticalEntries.length}
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-2">{t('criticalWaterQualityIssues')}</p>
              </div>
            </div>
          )}
          {warningEntries.length > 0 && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 font-bold text-lg mr-2">🟡</span>
                  <span className="text-yellow-900 font-semibold">
                    {t('warnings')}: {warningEntries.length}
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">{t('minorWaterQualityIssues')}</p>
              </div>
            </div>
          )}
          {latestEntry && (
            <div className="mt-4 text-sm text-gray-600">
              {t('lastEntry')}: {new Date(latestEntry.date).toLocaleDateString()} -{' '}
              {latestEntry.status === 'normal' ? (
                <span className="text-green-600">{t('normal')}</span>
              ) : latestEntry.status === 'warning' ? (
                <span className="text-yellow-600">{t('warning')}</span>
              ) : (
                <span className="text-red-600">{t('critical')}</span>
              )}
            </div>
          )}
        </div>
      )}

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