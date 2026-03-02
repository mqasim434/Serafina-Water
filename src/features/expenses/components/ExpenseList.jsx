/**
 * Expense List Component
 *
 * Displays list of expenses with date filters, search, totals, and Excel export
 */

import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import { expensesService } from '../slice.js';
import { isAdmin } from '../../auth/service.js';
import { exportToExcel } from '../../reports/service.js';
import * as cashService from '../../cash/service.js';

const DATE_FILTERS = {
  ALL: 'all',
  LAST_MONTH: 'lastMonth',
  YTD: 'ytd',
  CUSTOM: 'custom',
};

/**
 * Expense List props
 * @typedef {Object} ExpenseListProps
 * @property {function(string): void} onDelete - Delete handler
 * @property {boolean} isLoading - Loading state
 */
export function ExpenseList({ onDelete, isLoading }) {
  const { t } = useTranslation();
  const { items: expenses } = useSelector((state) => state.expenses);
  const { items: users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const today = cashService.getTodayDate();
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageModalUrl, setImageModalUrl] = useState(null);

  useEffect(() => {
    if (!imageModalUrl) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setImageModalUrl(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageModalUrl]);

  const { startDate, endDate } = useMemo(() => {
    if (dateFilter === DATE_FILTERS.ALL) return { startDate: null, endDate: null };
    if (dateFilter === DATE_FILTERS.CUSTOM) {
      return { startDate: customStart || null, endDate: customEnd || null };
    }
    return expensesService.getQuickFilterDateRange(dateFilter);
  }, [dateFilter, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (startDate && endDate) {
      result = expensesService.filterExpensesByDateRange(result, startDate, endDate);
    }
    result = expensesService.filterExpensesBySearch(result, searchQuery);
    return [...result].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [expenses, startDate, endDate, searchQuery]);

  const totalFiltered = useMemo(
    () => expensesService.calculateTotalExpenses(filteredExpenses),
    [filteredExpenses]
  );

  const totalsByCategory = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      const cat = e.title || (t('other') || 'Other');
      map[cat] = (map[cat] || 0) + e.amount;
    });
    return map;
  }, [filteredExpenses, t]);

  const getUserName = (id) => {
    if (!id) return '-';
    if (user?.id === id) return user.displayName || user.username || id;
    const u = users?.find((x) => x.id === id);
    return u ? (u.displayName || u.username || id) : id;
  };

  const handleExportExcel = () => {
    const isAdminUser = isAdmin(user);
    const headers = ['Date', 'Category', 'Amount', 'Notes/Description'];
    if (isAdminUser) headers.push('Created By');

    const data = filteredExpenses.map((expense) => {
      const row = {
        Date: new Date(expense.date).toLocaleDateString(),
        Category: expense.title || '-',
        Amount: expense.amount,
        'Notes/Description': expense.description || '-',
      };
      if (isAdminUser) {
        row['Created By'] = expense.createdBy ? getUserName(expense.createdBy) : '-';
      }
      return row;
    });

    const filename = `expenses-${today}.xlsx`;
    exportToExcel(data, headers, filename);
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
        {t('noExpenses')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Date filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('expenseHistory')}</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">{t('date')}:</span>
          <button
            type="button"
            onClick={() => setDateFilter(DATE_FILTERS.ALL)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              dateFilter === DATE_FILTERS.ALL ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all') || 'All'}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(DATE_FILTERS.LAST_MONTH)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              dateFilter === DATE_FILTERS.LAST_MONTH ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('lastMonth')}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(DATE_FILTERS.YTD)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              dateFilter === DATE_FILTERS.YTD ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('ytd')}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(DATE_FILTERS.CUSTOM)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              dateFilter === DATE_FILTERS.CUSTOM ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('customRange')}
          </button>
          {dateFilter === DATE_FILTERS.CUSTOM && (
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search') + ' ' + (t('expenseDescription') || 'notes') + ', ' + (t('expenseTitle') || 'category') + ', ' + (t('expenseAmount') || 'amount')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Totals */}
        <div className="flex flex-wrap gap-4 items-center pt-2">
          <div className="font-semibold text-gray-900">
            {t('totalExpenses')}: Rs. {totalFiltered.toLocaleString()}
          </div>
          {Object.keys(totalsByCategory).length > 0 && (
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {Object.entries(totalsByCategory).map(([cat, amt]) => (
                <span key={cat}>
                  {cat}: Rs. {amt.toLocaleString()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            {t('exportExcel')}
          </button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          {(startDate || searchQuery) ? (t('noExpensesMatchFilter') || 'No expenses match the current filters.') : t('noExpenses')}
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-gray-900">{expense.title}</span>
                  <span className="text-sm font-semibold text-red-600 shrink-0">
                    Rs. {expense.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
                {expense.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{expense.description}</p>
                )}
                {expense.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageModalUrl(expense.imageUrl)}
                    className="rounded border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={t('viewImage') || 'View image'}
                  >
                    <img
                      src={expense.imageUrl}
                      alt={t('expenseImage') || 'Receipt'}
                      className="w-16 h-16 object-cover"
                    />
                  </button>
                )}
                <LoadingButton
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(expense.id)}
                  isLoading={isLoading}
                  className="w-full border border-red-200"
                >
                  {t('delete')}
                </LoadingButton>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expenseTitle') || 'Title'}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expenseDescription')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expenseAmount')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {t('image') || 'Image'}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                      {expense.title}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {expense.description || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      Rs. {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {expense.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setImageModalUrl(expense.imageUrl)}
                          className="rounded border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title={t('viewImage') || 'View image'}
                        >
                          <img
                            src={expense.imageUrl}
                            alt={t('expenseImage') || 'Receipt'}
                            className="w-12 h-12 object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <LoadingButton
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(expense.id)}
                        isLoading={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t('delete')}
                      </LoadingButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Image modal */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('expenseImage') || 'Expense image'}
        >
          <button
            type="button"
            onClick={() => setImageModalUrl(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold z-10"
            aria-label={t('close')}
          >
            ×
          </button>
          <img
            src={imageModalUrl}
            alt={t('expenseImage') || 'Receipt'}
            className="max-w-full max-h-[calc(100vh-2rem)] object-contain rounded shadow-lg m-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
