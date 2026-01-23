/**
 * Expense Form Component
 * 
 * Form for adding expenses
 */

import { useState } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import * as cashService from '../../../features/cash/service.js';

/**
 * Expense Form props
 * @typedef {Object} ExpenseFormProps
 * @property {function(string, string, number, string): void} onSubmit - Submit handler (title, description, amount, date)
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 * @property {number} [availableCash] - Available cash balance
 */

/**
 * Expense Form component
 * @param {ExpenseFormProps} props
 */
export function ExpenseForm({ onSubmit, onCancel, isLoading, availableCash }) {
  const { t } = useTranslation();
  const today = cashService.getTodayDate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: today,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    const newErrors = {};

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = t('expenseTitleRequired') || 'Expense title is required';
    }

    if (!formData.date || formData.date.trim() === '') {
      newErrors.date = t('dateRequired');
    }

    if (!formData.amount || amount <= 0) {
      newErrors.amount = t('expenseAmountRequired') || 'Expense amount must be greater than 0';
    }

    if (availableCash !== undefined && amount > availableCash) {
      newErrors.amount = t('expenseAmountExceedsCash') || `Amount cannot exceed available cash of ${availableCash.toLocaleString()}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData.title.trim(), formData.description.trim(), amount, formData.date);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {availableCash !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">{t('cashOnHand')}:</span>
            <span className="text-lg font-bold text-blue-900">
              Rs. {availableCash.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t('expenseTitle') || 'Expense Title'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('expenseTitle') || 'Enter expense title'}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          {t('date')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          max={today}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.date ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          {t('expenseAmount')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.amount ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('expenseAmount')}
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t('expenseDescription')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={t('expenseDescription')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isLoading ? t('loading') : t('addExpense')}
        </button>
      </div>
    </form>
  );
}
