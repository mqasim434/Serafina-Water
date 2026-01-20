/**
 * Expense List Component
 * 
 * Displays list of expenses
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { expensesService } from '../slice.js';

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
  const { items: expenses, categories } = useSelector((state) => state.expenses);

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (sortedExpenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t('noExpenses')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('expenseHistory')}</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedExpenses.map((expense) => (
          <div key={expense.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {getCategoryName(expense.category)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {expense.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(expense.createdAt).toLocaleString()}
                </p>
                {expense.description && (
                  <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                )}
              </div>
              <button
                onClick={() => onDelete(expense.id)}
                className="ml-4 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
