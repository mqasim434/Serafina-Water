/**
 * Return Form Component
 * 
 * Simple form for recording bottle returns (optionally with product for stock increase)
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import { productsService } from '../../products/slice.js';

/**
 * Return Form props
 * @typedef {Object} ReturnFormProps
 * @property {string} customerId - Customer ID
 * @property {number} [maxReturnable] - Maximum bottles that can be returned
 * @property {function(string, number, string, string|null): void} onSubmit - Submit handler (customerId, quantity, notes, productId)
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

/**
 * Return Form component
 * @param {ReturnFormProps} props
 */
export function ReturnForm({ customerId, maxReturnable, onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  const returnableProducts = productsService.getActiveProducts(products).filter((p) => p.isReturnable !== false);

  const [formData, setFormData] = useState({
    quantity: '',
    notes: '',
    productId: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (maxReturnable !== undefined && parseFloat(formData.quantity) > maxReturnable) {
      newErrors.quantity = `Cannot return more than ${maxReturnable} bottles`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(customerId, parseFloat(formData.quantity), formData.notes, formData.productId || null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {returnableProducts.length > 0 && (
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
            {t('product')} ({t('forStockReturn')})
          </label>
          <select
            id="productId"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">{t('selectProduct')} ({t('optional')})</option>
            {returnableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.size})
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          {t('quantity')} <span className="text-red-500">*</span>
          {maxReturnable !== undefined && (
            <span className="text-xs text-gray-500 ml-2">
              (Max: {maxReturnable})
            </span>
          )}
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          min="1"
          max={maxReturnable}
          value={formData.quantity}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.quantity ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
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
        <LoadingButton type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t('cancel')}
        </LoadingButton>
        <LoadingButton type="submit" isLoading={isLoading} variant="warning">
          {t('recordReturn')}
        </LoadingButton>
      </div>
    </form>
  );
}
