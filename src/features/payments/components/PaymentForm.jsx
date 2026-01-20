/**
 * Payment Form Component
 * 
 * Form for recording payments (full or partial)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';

/**
 * Payment Form props
 * @typedef {Object} PaymentFormProps
 * @property {string} customerId - Customer ID
 * @property {number} outstandingBalance - Outstanding balance
 * @property {function(string, number, string, string): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

/**
 * Payment Form component
 * @param {PaymentFormProps} props
 */
export function PaymentForm({
  customerId,
  outstandingBalance,
  onSubmit,
  onCancel,
  isLoading,
}) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
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

  const handleFullPayment = () => {
    setFormData((prev) => ({
      ...prev,
      amount: outstandingBalance.toString(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    const newErrors = {};

    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0';
    }

    if (amount > outstandingBalance) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ${outstandingBalance.toLocaleString()}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(customerId, amount, formData.paymentMethod, formData.notes.trim());
  };

  const isFullPayment = formData.amount && parseFloat(formData.amount) >= outstandingBalance;
  const remainingBalance = formData.amount
    ? Math.max(0, outstandingBalance - parseFloat(formData.amount))
    : outstandingBalance;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-900">{t('outstandingBalance')}:</span>
          <span className="text-lg font-bold text-blue-900">
            Rs. {outstandingBalance.toLocaleString()}
          </span>
        </div>
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-300">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">{t('remainingBalance')}:</span>
              <span className="font-semibold text-blue-900">
                Rs. {remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            {t('paymentAmount')} <span className="text-red-500">*</span>
          </label>
          {outstandingBalance > 0 && (
            <button
              type="button"
              onClick={handleFullPayment}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('fullPayment')}
            </button>
          )}
        </div>
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
          placeholder={t('paymentAmount')}
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        {isFullPayment && (
          <p className="mt-1 text-sm text-green-600 font-medium">{t('fullPayment')}</p>
        )}
        {formData.amount &&
          parseFloat(formData.amount) > 0 &&
          parseFloat(formData.amount) < outstandingBalance && (
            <p className="mt-1 text-sm text-orange-600 font-medium">{t('partialPayment')}</p>
          )}
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
          {t('paymentMethod')} <span className="text-red-500">*</span>
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="cash">{t('cash')}</option>
          <option value="bank">Bank Transfer</option>
          <option value="mobile">Mobile Payment</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          {t('notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={t('notes')}
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? t('loading') : t('recordPayment')}
        </button>
      </div>
    </form>
  );
}
