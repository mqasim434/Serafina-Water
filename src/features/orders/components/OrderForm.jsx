/**
 * Order Form Component
 *
 * Form for placing orders with multiple line items and payment handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import { productsService } from '../../products/slice.js';

/** Check if product name contains "dispenser" (case-insensitive) */
function isDispenserProduct(product) {
  return (product?.name || '').toLowerCase().includes('dispenser');
}

/** Set to true to show "Has Dispenser" checkbox in Place Order */
const SHOW_HAS_DISPENSER_CHECKBOX = false;

/**
 * Order Form props
 * @typedef {Object} OrderFormProps
 * @property {string} customerId - Customer ID
 * @property {function(Object): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

const defaultLineItem = () => ({
  id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  productId: '',
  quantity: '',
  price: '',
});

/**
 * Order Form component
 * @param {OrderFormProps} props
 */
export function OrderForm({ customerId, onSubmit, onCancel, isLoading: externalIsLoading }) {
  const { t } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  const { items: customers } = useSelector((state) => state.customers);

  const activeProducts = productsService.getActiveProducts(products);
  const customer = customers.find((c) => c.id === customerId);

  // Filter out dispenser products if customer already has dispenser
  const orderableProducts = useMemo(() => {
    if (!customer?.hasDispenser) return activeProducts;
    return activeProducts.filter((p) => !isDispenserProduct(p));
  }, [activeProducts, customer?.hasDispenser]);

  const [items, setItems] = useState([defaultLineItem()]);
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [hasDispenser, setHasDispenser] = useState(!!customer?.hasDispenser);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isSubmitting || externalIsLoading;

  const totalAmount =
    items.length > 0
      ? Math.round(
          items.reduce((sum, item) => {
            const q = parseFloat(item.quantity);
            const p = parseFloat(item.price);
            return sum + (q && p ? q * p : 0);
          }, 0) * 100
        ) / 100
      : 0;

  const outstandingAmount = Math.round((totalAmount - (parseFloat(amountPaid) || 0)) * 100) / 100;

  const setPriceForProduct = useCallback(
    (productId, itemId) => {
      if (!productId || !customer) return;
      const product = orderableProducts.find((p) => p.id === productId);
      if (!product) return;
      const customerPrice = customer.productPrices?.[product.id];
      const price = customerPrice ?? product.price ?? 0;
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, price: price.toString() } : it))
      );
    },
    [customer, orderableProducts]
  );

  // Sync hasDispenser when customer changes
  useEffect(() => {
    setHasDispenser(!!customer?.hasDispenser);
  }, [customer?.id, customer?.hasDispenser]);

  const handleItemChange = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
    if (field === 'productId') {
      setPriceForProduct(value, itemId);
    }
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

    items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`item_${item.id}`] = t('product') + ' ' + (t('required') || 'is required');
        return;
      }
      const product = orderableProducts.find((p) => p.id === item.productId);
      const qty = parseFloat(item.quantity);
      let pr = parseFloat(item.price);
      // Resolve price from product when empty or invalid (e.g. dispenser with price 0)
      if ((item.price === '' || item.price === undefined || item.price === null || isNaN(pr) || pr < 0) && product) {
        pr = customer?.productPrices?.[product.id] ?? product.price ?? 0;
      }
      if (!item.quantity || qty <= 0) {
        newErrors[`item_${item.id}`] = t('quantity') + ' ' + (t('required') || 'must be > 0');
        return;
      }
      if (isNaN(pr) || pr < 0) {
        newErrors[`item_${item.id}`] = t('price') + ' ' + (t('required') || 'is required');
        return;
      }
      validItems.push({
        productId: item.productId,
        quantity: qty,
        price: pr,
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
    if (amountPaid !== '' && parseFloat(amountPaid) < 0) {
      setErrors((prev) => ({ ...prev, amountPaid: 'Amount paid cannot be negative' }));
      return;
    }
    if (amountPaid !== '' && parseFloat(amountPaid) > totalAmount) {
      setErrors((prev) => ({ ...prev, amountPaid: 'Amount paid cannot exceed total' }));
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      items: validItems,
      amountPaid: parseFloat(amountPaid) || 0,
      notes: notes.trim(),
      hasDispenser,
    });
  };

  // Clear isSubmitting only when parent has finished (externalIsLoading false) - no rush to clear
  useEffect(() => {
    if (!externalIsLoading && isSubmitting) {
      const timer = setTimeout(() => setIsSubmitting(false), 150);
      return () => clearTimeout(timer);
    }
  }, [externalIsLoading, isSubmitting]);

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
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
                  {orderableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.size}) — Rs. {(product.price || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  {t('quantity')} <span className="text-red-500">*</span>
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  {t('price')} (Rs.) {(() => {
                    const product = orderableProducts.find((p) => p.id === item.productId);
                    const isFree = product && (product.price === 0 || product.price === '0');
                    return !isFree && <span className="text-red-500">*</span>;
                  })()}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  readOnly={!!item.productId}
                  onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                  className={`block w-full px-2 py-1.5 border rounded text-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                  } ${item.productId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0.00"
                />
              </div>
            </div>
            {errors[`item_${item.id}`] && (
              <p className="text-sm text-red-600">{errors[`item_${item.id}`]}</p>
            )}
          </div>
        ))}
      </div>

      {totalAmount > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">{t('totalAmount')}:</span>
            <span className="text-sm font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {SHOW_HAS_DISPENSER_CHECKBOX && activeProducts.some(isDispenserProduct) && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasDispenser"
            checked={hasDispenser}
            onChange={(e) => setHasDispenser(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hasDispenser" className="text-sm font-medium text-gray-700">
            {t('hasDispenser') || 'Has Dispenser'}
          </label>
        </div>
      )}

      <div>
        <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">
          {t('amountPaid')} (Rs.)
        </label>
        <input
          type="number"
          id="amountPaid"
          min="0"
          step="0.01"
          max={totalAmount}
          value={amountPaid}
          onChange={(e) => {
            setAmountPaid(e.target.value);
            if (errors.amountPaid) setErrors((prev) => ({ ...prev, amountPaid: undefined }));
          }}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.amountPaid ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="0"
        />
        {errors.amountPaid && (
          <p className="mt-1 text-sm text-red-600">{errors.amountPaid}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {outstandingAmount > 0
            ? `${t('outstandingAmount')}: Rs. ${outstandingAmount.toLocaleString()}`
            : totalAmount > 0
              ? t('fullyPaid')
              : ''}
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          {t('notes')}
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={t('notes')}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
        <LoadingButton type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t('cancel')}
        </LoadingButton>
        <LoadingButton type="submit" isLoading={isLoading} className="w-full sm:w-auto sm:min-w-[140px]">
          {t('placeOrder')}
        </LoadingButton>
      </div>
    </form>
  );
}
