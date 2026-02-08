/**
 * Expense List Component
 * 
 * Displays list of expenses
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';

/**
 * Expense List props
 * @typedef {Object} ExpenseListProps
 * @property {function(string): void} onDelete - Delete handler
 */

/**
 * Expense List component
 * @param {ExpenseListProps} props
 */
export function ExpenseList({ onDelete }) {
  const { t } = useTranslation();
  const { items: expenses } = useSelector((state) => state.expenses);

  const sortedExpenses = [...expenses].sort((a, b) => {
    // Sort by date (newest first), then by createdAt
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (sortedExpenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
        {t('noExpenses')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('expenseHistory')}</h2>
      </div>

      {/* Mobile card layout */}
      <div className="block sm:hidden divide-y divide-gray-200">
        {sortedExpenses.map((expense) => (
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
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="w-full py-2 text-red-600 hover:bg-red-50 font-medium text-sm rounded border border-red-200"
            >
              {t('delete')}
            </button>
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
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedExpenses.map((expense) => (
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
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
