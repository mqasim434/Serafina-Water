/**
 * Order Form Component
 * 
 * Form for placing orders with payment handling
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { productsService } from '../../products/slice.js';

/**
 * Order Form props
 * @typedef {Object} OrderFormProps
 * @property {string} customerId - Customer ID
 * @property {function(Object): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

/**
 * Order Form component
 * @param {OrderFormProps} props
 */
export function OrderForm({ customerId, onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  const { items: customers } = useSelector((state) => state.customers);

  const activeProducts = productsService.getActiveProducts(products);
  const customer = customers.find((c) => c.id === customerId);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    price: '',
    amountPaid: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Calculate total when product, quantity, or price changes (round to 2 decimal places)
  const totalAmount = formData.productId && formData.quantity && formData.price
    ? Math.round(parseFloat(formData.quantity) * parseFloat(formData.price) * 100) / 100
    : 0;

  const outstandingAmount = Math.round((totalAmount - (parseFloat(formData.amountPaid) || 0)) * 100) / 100;

  // Set default price when product is selected
  useEffect(() => {
    if (formData.productId && customer) {
      const product = activeProducts.find((p) => p.id === formData.productId);
      if (product) {
        // Use customer's price if available, otherwise use product's default price
        const customerPrice = customer.productPrices?.[product.id];
        const price = customerPrice || product.price || 0;
        setFormData((prev) => ({ ...prev, price: price.toString() }));
      }
    }
  }, [formData.productId, customer, activeProducts]);

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
    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.amountPaid && parseFloat(formData.amountPaid) < 0) {
      newErrors.amountPaid = 'Amount paid cannot be negative';
    }
    if (formData.amountPaid && parseFloat(formData.amountPaid) > totalAmount) {
      newErrors.amountPaid = 'Amount paid cannot exceed total amount';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      productId: formData.productId,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      amountPaid: parseFloat(formData.amountPaid) || 0,
      notes: formData.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
          {t('product')} <span className="text-red-500">*</span>
        </label>
        <select
          id="productId"
          name="productId"
          value={formData.productId}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.productId ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        >
          <option value="">{t('selectProduct')}</option>
          {activeProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.size}) - Rs. {(product.price || 0).toLocaleString()}
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
        )}
      </div>

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
          required
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          {t('price')} (Rs.) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="price"
          name="price"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.price ? 'border-red-300' : 'border-gray-300'
          }`}
          required
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
      </div>

      {/* Order Summary */}
      {totalAmount > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">{t('totalAmount')}:</span>
            <span className="text-sm font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">
          {t('amountPaid')} (Rs.)
        </label>
        <input
          type="number"
          id="amountPaid"
          name="amountPaid"
          min="0"
          step="0.01"
          max={totalAmount}
          value={formData.amountPaid}
          onChange={handleChange}
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
            : t('fullyPaid')}
        </p>
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? t('loading') : t('placeOrder')}
        </button>
      </div>
    </form>
  );
}
