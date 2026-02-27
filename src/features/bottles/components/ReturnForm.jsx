/**
 * Return Form Component
 *
 * Form for recording bottle returns with multiple products (like Place Order)
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import { productsService } from '../../products/slice.js';

const defaultLineItem = () => ({
  id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  productId: '',
  quantity: '',
});

/**
 * Return Form props
 * @typedef {Object} ReturnFormProps
 * @property {string} customerId - Customer ID
 * @property {number} [maxReturnable] - Maximum bottles that can be returned
 * @property {function(string, Array<{productId: string, quantity: number}>, string): void} onSubmit - Submit handler (customerId, items, notes)
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

  const [items, setItems] = useState([defaultLineItem()]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const totalQuantity = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity);
    return sum + (q && !isNaN(q) ? q : 0);
  }, 0);

  const handleItemChange = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
    if (errors[`item_${itemId}`]) {
      setErrors((prev) => ({ ...prev, [`item_${itemId}`]: undefined }));
    }
  };

  const addLine = () => {
    setItems((prev) => [...prev, defaultLineItem()]);
  };

  const removeLine = (itemId) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== itemId);
      return next.length > 0 ? next : [defaultLineItem()];
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    const validItems = [];

    items.forEach((item) => {
      if (!item.productId) {
        newErrors[`item_${item.id}`] = t('product') + ' ' + (t('required') || 'is required');
        return;
      }
      const qty = parseFloat(item.quantity);
      if (!item.quantity || qty <= 0) {
        newErrors[`item_${item.id}`] = t('quantity') + ' ' + (t('required') || 'must be > 0');
        return;
      }
      validItems.push({
        productId: item.productId,
        quantity: qty,
      });
    });

    if (validItems.length === 0) {
      setErrors(newErrors);
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (maxReturnable !== undefined && totalQuantity > maxReturnable) {
      setErrors((prev) => ({
        ...prev,
        total: `Cannot return ${totalQuantity} bottles. Customer only has ${maxReturnable} returnable bottles outstanding.`,
      }));
      return;
    }

    onSubmit(customerId, validItems, notes.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{t('orderItems') || 'Order items'}</h3>
        <button
          type="button"
          onClick={addLine}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + {t('addItem') || 'Add item'}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-3 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                {t('item') || 'Item'} {index + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(item.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                  aria-label={t('remove') || 'Remove'}
                >
                  {t('remove') || 'Remove'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  {t('product')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                  className={`block w-full px-2 py-1.5 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('selectProduct')}</option>
                  {returnableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.size})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  {t('quantity')} <span className="text-red-500">*</span>
                  {maxReturnable !== undefined && (
                    <span className="text-xs text-gray-500 ml-1">(Max total: {maxReturnable})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  className={`block w-full px-2 py-1.5 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
              </div>
            </div>
            {errors[`item_${item.id}`] && (
              <p className="text-sm text-red-600">{errors[`item_${item.id}`]}</p>
            )}
          </div>
        ))}
      </div>

      {errors.total && (
        <p className="text-sm text-red-600">{errors.total}</p>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          {t('notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
