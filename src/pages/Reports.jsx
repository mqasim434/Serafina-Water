/**
 * Reports Page
 * 
 * Main page for generating and exporting reports
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import * as reportsService from '../features/reports/service.js';
import * as cashService from '../features/cash/service.js';
import { CustomerActivity } from '../features/reports/components/CustomerActivity.jsx';

const REPORT_TYPES = {
  CUSTOMER_BOTTLES: 'customer_bottles',
  OUTSTANDING_BOTTLES: 'outstanding_bottles',
  DUE_AMOUNTS: 'due_amounts',
  CASH_FLOW: 'cash_flow',
  CUSTOMER_ACTIVITY: 'customer_activity',
};

export function Reports() {
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

  const handleExportPDF = () => {
    let data = [];
    let headers = [];
    let title = '';

    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        data = reportsService.generateCustomerBottlesReport(customers, transactions);
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
          transactions
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
        headers = ['Customer Name', 'Opening Balance', 'Total Orders', 'Total Payments', 'Due Amount'];
        title = 'Due Amounts Report';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          'Opening Balance': r.openingBalance || 0,
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
    }

    reportsService.exportToPDF(title, data, headers);
  };

  const handleExportExcel = () => {
    let data = [];
    let headers = [];
    let filename = '';

    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        data = reportsService.generateCustomerBottlesReport(customers, transactions);
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
          transactions
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
        headers = ['Customer Name', 'Opening Balance', 'Total Orders', 'Total Payments', 'Due Amount'];
        filename = 'due_amounts_report.csv';
        data = data.map((r) => ({
          'Customer Name': r.customerName,
          'Opening Balance': r.openingBalance || 0,
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
    }

    reportsService.exportToExcel(data, headers, filename);
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case REPORT_TYPES.CUSTOMER_BOTTLES:
        const customerBottles = reportsService.generateCustomerBottlesReport(
          customers,
          transactions
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
          transactions
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
                    {t('openingBalance')}
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
                        Rs. {(report.openingBalance || 0).toLocaleString()}
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
        </select>

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
