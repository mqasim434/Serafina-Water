/**
 * Bottle Transaction Form Component
 * 
 * Form for issuing or returning bottles
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { useSelector } from 'react-redux';

/**
 * Bottle Transaction Form props
 * @typedef {Object} BottleTransactionFormProps
 * @property {string} customerId - Customer ID
 * @property {'issued' | 'returned'} type - Transaction type
 * @property {function(string, string, number, string): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 * @property {number} [maxReturnable] - Maximum returnable bottles (for return transactions)
 */

/**
 * Bottle Transaction Form component
 * @param {BottleTransactionFormProps} props
 */
export function BottleTransactionForm({
  customerId,
  type,
  onSubmit,
  onCancel,
  isLoading,
  maxReturnable,
}) {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);

  const [formData, setFormData] = useState({
    quantity: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const customer = customers.find((c) => c.id === customerId);

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

    const quantity = parseInt(formData.quantity, 10);
    const newErrors = {};

    if (!formData.quantity || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (type === 'returned' && maxReturnable !== undefined && quantity > maxReturnable) {
      newErrors.quantity = `Cannot return more than ${maxReturnable} bottles`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(customerId, type, quantity, formData.notes.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {customer && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Customer:</span> {customer.name}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          {t('quantity')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          min="1"
          value={formData.quantity}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.quantity ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('quantity')}
        />
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
        {type === 'returned' && maxReturnable !== undefined && (
          <p className="mt-1 text-sm text-gray-500">
            Maximum returnable: {maxReturnable} {t('outstanding')}
          </p>
        )}
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
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
            type === 'issued'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isLoading ? t('loading') : type === 'issued' ? t('issueBottles') : t('returnBottles')}
        </button>
      </div>
    </form>
  );
}
