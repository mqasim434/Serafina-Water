/**
 * Dashboard Page
 * 
 * Main dashboard with key metrics widgets
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import * as cashService from '../features/cash/service.js';
import { bottlesService, setTransactions } from '../features/bottles/slice.js';
import { expensesService, setExpenses } from '../features/expenses/slice.js';
import { waterQualityService, setEntries } from '../features/waterQuality/slice.js';
import { formatTime12h } from '../features/waterQuality/service.js';
import { ordersService, setOrders, setCashBalance } from '../features/orders/slice.js';
import { productsService, setProducts } from '../features/products/slice.js';
import { customersService, setCustomers } from '../features/customers/slice.js';

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
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { transactions } = useSelector((state) => state.bottles);
  const { items: products } = useSelector((state) => state.products);
  const { items: expenses } = useSelector((state) => state.expenses);
  const { cashBalance } = useSelector((state) => state.orders);
  const { items: waterQualityEntries } = useSelector((state) => state.waterQuality);
  const { items: customers } = useSelector((state) => state.customers);

  // Load all dashboard data on mount so cards reflect real-time data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [
          loadedOrders,
          loadedCashBalance,
          loadedTransactions,
          loadedProducts,
          loadedExpenses,
          loadedEntries,
          loadedCustomers,
        ] = await Promise.all([
          ordersService.loadOrders(),
          ordersService.loadCashBalance(),
          bottlesService.loadTransactions(),
          productsService.loadProducts(),
          expensesService.loadExpenses(),
          waterQualityService.loadWaterQualityEntries(),
          customersService.loadCustomers(),
        ]);
        dispatch(setOrders(loadedOrders));
        dispatch(setCashBalance(loadedCashBalance));
        dispatch(setTransactions(loadedTransactions));
        dispatch(setProducts(loadedProducts));
        dispatch(setExpenses(loadedExpenses));
        dispatch(setEntries(loadedEntries));
        dispatch(setCustomers(loadedCustomers || []));
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    }
    loadDashboardData();
  }, [dispatch]);

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

  // Outstanding bottles: current day only (today's issued minus today's returned, returnable products)
  const todayTransactions = transactions.filter((t) => {
    const txDate = cashService.formatDate(new Date(t.createdAt));
    return txDate === today;
  });
  const returnableSummaryToday = bottlesService.calculateGlobalSummaryReturnable(
    todayTransactions,
    todayDeliveries,
    products
  );
  const outstandingBottles = returnableSummaryToday.totalOutstandingReturnable;

  // Bottles issued and returned today (from bottle transactions)
  const todaySummary = bottlesService.calculateGlobalSummary(todayTransactions);
  const bottlesIssuedToday = todaySummary.totalIssued;
  const bottlesReturnedToday = todaySummary.totalReturned;

  // Total customers
  const totalCustomers = customers?.length ?? 0;

  // Calculate today's expenses (used for Today's Expenses card and for cash in hand)
  const todayExpenses = expenses.filter((expense) => {
    const expenseDate = cashService.formatDate(new Date(expense.createdAt));
    return expenseDate === today;
  });
  const todayExpensesAmount = expensesService.calculateTotalExpenses(todayExpenses);

  // Cash in hand: current day only (today's order income minus today's expenses)
  const cashOnHand = Math.max(0, todayDeliveriesAmount - todayExpensesAmount);

  // Get latest water quality entry (alerts shown based on most recent entry only)
  const latestEntry = waterQualityService.getLatestEntry(waterQualityEntries);

  // Low stock alerts
  const lowStockProducts = productsService.getLowStockProducts(products);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('welcome')}</p>
      </div>

      {/* Row 1: Bottles Issued, Bottles Returned, Outstanding Bottles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <DashboardWidget
          title={t('bottlesIssuedToday')}
          value={bottlesIssuedToday}
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          bgColor="bg-cyan-500"
          textColor="text-white"
        />
        <DashboardWidget
          title={t('bottlesReturnedToday')}
          value={bottlesReturnedToday}
          icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          bgColor="bg-teal-500"
          textColor="text-white"
        />
        <DashboardWidget
          title={t('outstandingBottles')}
          value={outstandingBottles}
          icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          bgColor="bg-orange-500"
          textColor="text-white"
        />
      </div>

      {/* Row 2: Total Customers, Cash on Hand, Today's Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <DashboardWidget
          title={t('totalCustomers')}
          value={totalCustomers}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          bgColor="bg-indigo-500"
          textColor="text-white"
        />
        <DashboardWidget
          title={t('cashOnHand')}
          value={`Rs. ${cashOnHand.toLocaleString()}`}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          bgColor="bg-green-500"
          textColor="text-white"
        />
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
                    {formatTime12h(latestEntry.time)}
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm text-white opacity-90">
                  <span>{t('pH')}:</span>
                  <span className="font-semibold">{latestEntry.pH}</span>
                </div>
                <div className="flex justify-between text-sm text-white opacity-90">
                  <span>{t('tds')}:</span>
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

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            {t('lowStockAlerts')}
          </h2>
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between bg-amber-100/80 rounded-lg px-4 py-2"
              >
                <span className="font-medium text-amber-900">
                  {product.name} ({product.size}) — {t('currentStock')}: {product.currentStock ?? 0} / {t('lowStockThreshold')}: {product.lowStockThreshold ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water Quality Alerts (based on most recent entry only) */}
      {latestEntry && (latestEntry.status === 'critical' || latestEntry.status === 'warning') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('waterQualityAlerts')}</h2>
          {latestEntry.status === 'critical' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-600 font-bold text-lg mr-2">🔴</span>
                <span className="text-red-900 font-semibold">{t('criticalAlerts')}</span>
              </div>
              <p className="text-sm text-red-700 mt-2">{t('criticalWaterQualityIssues')}</p>
              <p className="text-sm text-red-600 mt-1">
                {t('lastEntry')}: {new Date(latestEntry.date).toLocaleDateString()}
                {latestEntry.time && ` ${formatTime12h(latestEntry.time)}`}
              </p>
            </div>
          )}
          {latestEntry.status === 'warning' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-600 font-bold text-lg mr-2">🟡</span>
                <span className="text-yellow-900 font-semibold">{t('warnings')}</span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">{t('minorWaterQualityIssues')}</p>
              <p className="text-sm text-yellow-600 mt-1">
                {t('lastEntry')}: {new Date(latestEntry.date).toLocaleDateString()}
                {latestEntry.time && ` ${formatTime12h(latestEntry.time)}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stock Overview (Total Stock & Ready to Ship per product) */}
      {products.some((p) => p.isActive && p.trackStock !== false) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stockOverview')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('product')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('currentStock')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('readyToShip')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products
                  .filter((p) => p.isActive && p.trackStock !== false)
                  .map((product) => {
                    const isLowStock = (product.currentStock ?? 0) < (product.lowStockThreshold ?? 0);
                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 ${isLowStock ? 'bg-amber-50' : ''}`}
                      >
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {product.name} ({product.size})
                          {isLowStock && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-900">
                              {t('lowStockAlert')}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-2 ${isLowStock ? 'text-amber-800 font-semibold' : 'text-gray-600'}`}>
                          {product.currentStock ?? 0}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {(product.readyToShip ?? 0) > 0 ? product.readyToShip : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
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