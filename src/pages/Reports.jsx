/**
 * Reports Page
 * 
 * Main page for generating and exporting reports (Admin only)
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import * as reportsService from '../features/reports/service.js';
import * as cashService from '../features/cash/service.js';
import { expensesService } from '../features/expenses/slice.js';
import { CustomerActivity } from '../features/reports/components/CustomerActivity.jsx';
import { ordersService, setOrders } from '../features/orders/slice.js';
import { productsService, setProducts } from '../features/products/slice.js';

const REPORT_TYPES = {
  CUSTOMER_BOTTLES: 'customer_bottles',
  OUTSTANDING_BOTTLES: 'outstanding_bottles',
  DUE_AMOUNTS: 'due_amounts',
  CASH_FLOW: 'cash_flow',
  CUSTOMER_ACTIVITY: 'customer_activity',
  PROFIT_REVENUE: 'profit_revenue',
  CUSTOMER_GROWTH: 'customer_growth',
};

export function Reports() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: customers } = useSelector((state) => state.customers);
  const { transactions } = useSelector((state) => state.bottles);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { items: expenses } = useSelector((state) => state.expenses);
  const { items: products } = useSelector((state) => state.products);

  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES.CUSTOMER_BOTTLES);
  const [startDate, setStartDate] = useState(cashService.getTodayDate());
  const [endDate, setEndDate] = useState(cashService.getTodayDate());
  const [periodFilter, setPeriodFilter] = useState(reportsService.PERIOD_MONTHLY);
  const [compareLastYear, setCompareLastYear] = useState(false);

  const { startDate: periodStart, endDate: periodEnd } = reportsService.getPeriodRange(
    periodFilter,
    periodFilter === reportsService.PERIOD_CUSTOM ? startDate : undefined,
    periodFilter === reportsService.PERIOD_CUSTOM ? endDate : undefined
  );

  // Backfill costPriceAtSale for existing orders (one-time; run when orders and products loaded)
  useEffect(() => {
    if (orders.length === 0 || products.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const updated = await ordersService.backfillOrdersCostPrice(orders, products);
        if (!cancelled) {
          dispatch(setOrders(updated));
        }
      } catch (e) {
        console.warn('Orders cost backfill:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, orders.length, products.length]);

  // Load products and orders if empty (for backfill and reports)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (products.length === 0) {
          const loadedProducts = await productsService.loadProducts();
          if (!cancelled && loadedProducts.length > 0) dispatch(setProducts(loadedProducts));
        }
        if (orders.length === 0) {
          const loadedOrders = await ordersService.loadOrders();
          if (!cancelled) dispatch(setOrders(loadedOrders));
        }
      } catch (e) {
        console.warn('Load reports data:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, orders.length, products.length]);

  const handleExportPDF = () => {
    let data = [];
    let headers = [];
    let title = '';

    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        data = reportsService.generateCustomerBottlesReport(customers, transactions, orders, products);
        headers = ['Customer Name', 'Issued', 'Returned', 'Outstanding'];
        title = 'Customer-wise Bottles Report';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Issued: r.issued,
          Returned: r.returned,
          Outstanding: r.outstanding,
        }));
        break;
      case REPORT_TYPES.OUTSTANDING_BOTTLES:
        const outstandingReport = reportsService.generateOutstandingBottlesReport(
          customers,
          transactions,
          orders,
          products
        );
        data = outstandingReport.customers;
        headers = ['Customer Name', 'Outstanding'];
        title = 'Outstanding Bottles Report';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Outstanding: r.outstanding,
        }));
        break;
      case REPORT_TYPES.DUE_AMOUNTS:
        data = reportsService.generateDueAmountsReport(customers, orders, payments);
        headers = ['Customer Name', 'Total Orders', 'Total Payments', 'Due Amount'];
        title = 'Due Amounts Report';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          'Total Orders': r.totalOrders,
          'Total Payments': r.totalPayments,
          'Due Amount': r.dueAmount,
        }));
        break;
      case REPORT_TYPES.CASH_FLOW:
        const cashFlowReport = reportsService.generateCashFlowReport(
          orders,
          expenses,
          startDate,
          endDate
        );
        data = cashFlowReport.entries;
        headers = ['Date', 'Income', 'Expenses', 'Net Cash', 'Balance'];
        title = 'Cash Flow Report';
        data = data.map((e) => ({
          Date: e.date,
          Income: e.income,
          Expenses: e.expenses,
          'Net Cash': e.netCash,
          Balance: e.balance,
        }));
        break;
      case REPORT_TYPES.CUSTOMER_ACTIVITY:
        data = reportsService.generateCustomerActivityReport(customers, orders, products, null);
        headers = ['Customer Name', 'Phone', 'Last Order Date', 'Days Since Last Order', 'Average Order Quantity', 'Most Frequent Product', 'Status'];
        title = 'Customer Activity Report';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Phone: r.phone,
          'Last Order Date': r.lastOrderDate || 'Never',
          'Days Since Last Order': r.daysSinceLastOrder !== null ? r.daysSinceLastOrder : 'Never',
          'Average Order Quantity': r.averageOrderQuantity.toFixed(2),
          'Most Frequent Product': r.mostFrequentProduct,
          Status: r.inactivityStatus,
        }));
        break;
      case REPORT_TYPES.PROFIT_REVENUE: {
        const profitReport = reportsService.generateProfitRevenueReport(orders, products, periodStart, periodEnd, { compareLastYear: false });
        data = profitReport.productBreakdown.map((r) => ({
          Product: r.productName,
          'Quantity Sold': r.quantitySold,
          Revenue: r.revenue,
          Cost: r.cost,
          Profit: r.profit,
        }));
        headers = ['Product', 'Quantity Sold', 'Revenue', 'Cost', 'Profit'];
        title = `Profit & Revenue Report (${periodStart} — ${periodEnd})`;
        break;
      }
      case REPORT_TYPES.CUSTOMER_GROWTH: {
        const growthReport = reportsService.generateCustomerGrowthReport(orders, periodStart, periodEnd, { compareLastYear: false });
        data = [{ 'Activated Customers': growthReport.activatedCount }];
        headers = ['Activated Customers'];
        title = `Customer Growth Report (${periodStart} — ${periodEnd})`;
        break;
      }
    }

    reportsService.exportToPDF(title, data, headers);
  };

  const handleExportExcel = () => {
    let data = [];
    let headers = [];
    let filename = '';

    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        data = reportsService.generateCustomerBottlesReport(customers, transactions, orders, products);
        headers = ['Customer Name', 'Issued', 'Returned', 'Outstanding'];
        filename = 'customer_bottles_report.csv';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Issued: r.issued,
          Returned: r.returned,
          Outstanding: r.outstanding,
        }));
        break;
      case REPORT_TYPES.OUTSTANDING_BOTTLES:
        const outstandingReport = reportsService.generateOutstandingBottlesReport(
          customers,
          transactions,
          orders,
          products
        );
        data = outstandingReport.customers;
        headers = ['Customer Name', 'Outstanding'];
        filename = 'outstanding_bottles_report.csv';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Outstanding: r.outstanding,
        }));
        break;
      case REPORT_TYPES.DUE_AMOUNTS:
        data = reportsService.generateDueAmountsReport(customers, orders, payments);
        headers = ['Customer Name', 'Total Orders', 'Total Payments', 'Due Amount'];
        filename = 'due_amounts_report.csv';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          'Total Orders': r.totalOrders,
          'Total Payments': r.totalPayments,
          'Due Amount': r.dueAmount,
        }));
        break;
      case REPORT_TYPES.CASH_FLOW:
        const cashFlowReport = reportsService.generateCashFlowReport(
          orders,
          expenses,
          startDate,
          endDate
        );
        data = cashFlowReport.entries;
        headers = ['Date', 'Income', 'Expenses', 'Net Cash', 'Balance'];
        filename = 'cash_flow_report.csv';
        data = data.map((e) => ({
          Date: e.date,
          Income: e.income,
          Expenses: e.expenses,
          'Net Cash': e.netCash,
          Balance: e.balance,
        }));
        break;
      case REPORT_TYPES.CUSTOMER_ACTIVITY:
        data = reportsService.generateCustomerActivityReport(customers, orders, products, null);
        headers = ['Customer Name', 'Phone', 'Last Order Date', 'Days Since Last Order', 'Average Order Quantity', 'Most Frequent Product', 'Status'];
        filename = 'customer_activity_report.csv';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          Phone: r.phone,
          'Last Order Date': r.lastOrderDate || 'Never',
          'Days Since Last Order': r.daysSinceLastOrder !== null ? r.daysSinceLastOrder : 'Never',
          'Average Order Quantity': r.averageOrderQuantity.toFixed(2),
          'Most Frequent Product': r.mostFrequentProduct,
          Status: r.inactivityStatus,
        }));
        break;
      case REPORT_TYPES.PROFIT_REVENUE: {
        const profitReport = reportsService.generateProfitRevenueReport(orders, products, periodStart, periodEnd, { compareLastYear: false });
        data = profitReport.productBreakdown.map((r) => ({
          Product: r.productName,
          'Quantity Sold': r.quantitySold,
          Revenue: r.revenue,
          Cost: r.cost,
          Profit: r.profit,
        }));
        headers = ['Product', 'Quantity Sold', 'Revenue', 'Cost', 'Profit'];
        filename = `profit_revenue_${periodStart}_${periodEnd}.csv`;
        break;
      }
      case REPORT_TYPES.CUSTOMER_GROWTH: {
        const growthReport = reportsService.generateCustomerGrowthReport(orders, periodStart, periodEnd, { compareLastYear: false });
        data = [{ 'Activated Customers': growthReport.activatedCount }];
        headers = ['Activated Customers'];
        filename = `customer_growth_${periodStart}_${periodEnd}.csv`;
        break;
      }
    }

    reportsService.exportToExcel(data, headers, filename);
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        const customerBottles = reportsService.generateCustomerBottlesReport(
          customers,
          transactions,
          orders,
          products
        );
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('issued')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('returned')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('outstanding')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerBottles.map((report) => (
                  <tr key={report.customerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.issued}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.returned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                      {report.outstanding}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case REPORT_TYPES.OUTSTANDING_BOTTLES:
        const outstandingReport = reportsService.generateOutstandingBottlesReport(
          customers,
          transactions,
          orders,
          products
        );
        return (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-blue-900">
                {t('totalOutstanding')}: {outstandingReport.totalOutstanding}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('customer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('outstanding')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outstandingReport.customers.map((report) => (
                    <tr key={report.customerId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                        {report.outstanding}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case REPORT_TYPES.DUE_AMOUNTS:
        const dueAmounts = reportsService.generateDueAmountsReport(customers, orders, payments);
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('totalOrders')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('totalPayments')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('outstandingBalance')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {dueAmounts.map((report) => (
                    <tr key={report.customerId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rs. {report.totalOrders.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rs. {report.totalPayments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        Rs. {report.dueAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );

      case REPORT_TYPES.CASH_FLOW:
        const cashFlowReport = reportsService.generateCashFlowReport(
          orders,
          expenses,
          startDate,
          endDate
        );
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">{t('totalIncome')}</p>
                <p className="text-xl font-bold text-green-900">
                  Rs. {cashFlowReport.totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{t('totalExpenses')}</p>
                <p className="text-xl font-bold text-red-900">
                  Rs. {cashFlowReport.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">{t('netCash')}</p>
                <p className="text-xl font-bold text-blue-900">
                  Rs. {cashFlowReport.netCashFlow.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('income')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('expenses')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('netCash')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('balance')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashFlowReport.entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        Rs. {entry.income.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        Rs. {entry.expenses.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rs. {entry.netCash.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        Rs. {entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case REPORT_TYPES.CUSTOMER_ACTIVITY:
        return <CustomerActivity customers={customers} orders={orders} products={products} />;

      case REPORT_TYPES.PROFIT_REVENUE: {
        const profitReport = reportsService.generateProfitRevenueReport(
          orders,
          products,
          periodStart,
          periodEnd,
          { compareLastYear }
        );
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {t('period')}: {periodStart} — {periodEnd}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">{t('totalRevenue')}</p>
                <p className="text-xl font-bold text-green-900">Rs. {profitReport.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{t('totalCost')}</p>
                <p className="text-xl font-bold text-red-900">Rs. {profitReport.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">{t('grossProfit')}</p>
                <p className="text-xl font-bold text-blue-900">Rs. {profitReport.totalProfit.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{t('profitMargin')}</p>
                <p className="text-xl font-bold text-gray-900">{profitReport.profitMarginPct}%</p>
              </div>
            </div>
            {(() => {
              const totalExpenses = expensesService.calculateExpensesInRange(periodStart, periodEnd, expenses || []);
              const netProfit = profitReport.totalProfit - totalExpenses;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700">{t('totalExpenses')}</p>
                    <p className="text-xl font-bold text-amber-900">Rs. {totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-700">{t('netProfit')}</p>
                    <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-indigo-900' : 'text-red-700'}`}>
                      Rs. {netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })()}
            {profitReport.comparison && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-amber-900">{t('compareWithLastYear')}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {t('totalRevenue')}: Rs. {profitReport.comparison.totalRevenue.toLocaleString()} | {t('grossProfit')}: Rs. {profitReport.comparison.totalProfit.toLocaleString()} | {t('profitMargin')}: {profitReport.comparison.profitMarginPct}%
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('product')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('quantitySold')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('revenue')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('cost')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('profit')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profitReport.productBreakdown.map((row) => (
                    <tr key={row.productId || row.productName}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.productName}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600">{row.quantitySold}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">Rs. {row.revenue.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">Rs. {row.cost.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-right text-blue-600">Rs. {row.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profitReport.productBreakdown.length === 0 && (
                <p className="py-4 text-center text-gray-500 text-sm">{t('noOrders')}</p>
              )}
            </div>
          </div>
        );
      }

      case REPORT_TYPES.CUSTOMER_GROWTH: {
        const growthReport = reportsService.generateCustomerGrowthReport(
          orders,
          periodStart,
          periodEnd,
          { compareLastYear }
        );
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {t('period')}: {periodStart} — {periodEnd}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <p className="text-sm text-blue-700">{t('activatedCustomers')}</p>
              <p className="text-3xl font-bold text-blue-900">{growthReport.activatedCount}</p>
            </div>
            {growthReport.comparison && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-900">{t('compareWithLastYear')}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {t('activatedCustomers')} {growthReport.comparison.activatedCount} · {t('difference')}: {growthReport.comparison.difference >= 0 ? '+' : ''}{growthReport.comparison.difference}
                </p>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports')}</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            {t('exportPDF')}
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            {t('exportExcel')}
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('selectReport')}
        </label>
        <select
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value={REPORT_TYPES.CUSTOMER_BOTTLES}>{t('customerBottlesReport')}</option>
          <option value={REPORT_TYPES.OUTSTANDING_BOTTLES}>{t('outstandingBottlesReport')}</option>
          <option value={REPORT_TYPES.DUE_AMOUNTS}>{t('dueAmountsReport')}</option>
          <option value={REPORT_TYPES.CASH_FLOW}>{t('cashFlowReport')}</option>
          <option value={REPORT_TYPES.CUSTOMER_ACTIVITY}>{t('customerActivityReport')}</option>
          <option value={REPORT_TYPES.PROFIT_REVENUE}>{t('profitRevenueReport')}</option>
          <option value={REPORT_TYPES.CUSTOMER_GROWTH}>{t('customerGrowthReport')}</option>
        </select>

        {/* Period filters for Profit & Revenue and Customer Growth */}
        {(selectedReport === REPORT_TYPES.PROFIT_REVENUE || selectedReport === REPORT_TYPES.CUSTOMER_GROWTH) && (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t('period')}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPeriodFilter(reportsService.PERIOD_DAILY)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${periodFilter === reportsService.PERIOD_DAILY ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t('daily')}
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter(reportsService.PERIOD_WEEKLY)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${periodFilter === reportsService.PERIOD_WEEKLY ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t('weekly')}
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter(reportsService.PERIOD_MONTHLY)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${periodFilter === reportsService.PERIOD_MONTHLY ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t('monthly')}
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter(reportsService.PERIOD_YTD)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${periodFilter === reportsService.PERIOD_YTD ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t('ytd')}
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter(reportsService.PERIOD_CUSTOM)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${periodFilter === reportsService.PERIOD_CUSTOM ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t('customRange')}
              </button>
            </div>
            {periodFilter === reportsService.PERIOD_CUSTOM && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={compareLastYear}
                onChange={(e) => setCompareLastYear(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('compareWithLastYear')}</span>
            </label>
          </div>
        )}

        {/* Date Range for Cash Flow */}
        {selectedReport === REPORT_TYPES.CASH_FLOW && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow p-6">{renderReportContent()}</div>
    </div>
  );
}
