/**
 * Customer Form Component
 * 
 * Form for adding/editing customers
 */

import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { productsService } from '../../../features/products/slice.js';

/**
 * Customer Form props
 * @typedef {Object} CustomerFormProps
 * @property {import('../types.js').Customer | null} customer - Customer to edit (null for new)
 * @property {function(import('../types.js').CustomerFormData): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

/**
 * Customer Form component
 * @param {CustomerFormProps} props
 */
export function CustomerForm({ customer, onSubmit, onCancel, isLoading }) {
  const { t, currentLanguage } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  
  // Memoize active products to prevent infinite loops
  const activeProducts = useMemo(() => {
    return productsService.getActiveProducts(products);
  }, [products]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    preferredLanguage: currentLanguage,
    productPrices: {},
    openingBalance: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing or when products change
  // Use products.length and customer?.id to create stable dependencies
  const productIdsString = useMemo(() => activeProducts.map(p => p.id).join(','), [activeProducts]);
  const customerId = customer?.id || null;
  
  useEffect(() => {
    if (customer) {
      // Build productPrices from customer's existing bottlePrices (for backward compatibility)
      // or from customer.productPrices (new structure)
      const productPrices = {};
      
      // If customer has new structure (productPrices), use it
      if (customer.productPrices) {
        activeProducts.forEach((product) => {
          // Use customer's price if set, otherwise fall back to product's default price
          productPrices[product.id] = customer.productPrices[product.id] !== undefined && customer.productPrices[product.id] !== ''
            ? customer.productPrices[product.id]
            : (product.price || '');
        });
      } else if (customer.bottlePrices) {
        // Backward compatibility: map old bottlePrices to new productPrices structure
        activeProducts.forEach((product) => {
          // Try to match by size
          const size = product.size.toLowerCase();
          if (size === '19l' && customer.bottlePrices.price19L) {
            productPrices[product.id] = customer.bottlePrices.price19L;
          } else if (size === '6l' && customer.bottlePrices.price6L) {
            productPrices[product.id] = customer.bottlePrices.price6L;
          } else if (size === '1.5l' && customer.bottlePrices.price1_5L) {
            productPrices[product.id] = customer.bottlePrices.price1_5L;
          } else if (size === '500ml' && customer.bottlePrices.price500ml) {
            productPrices[product.id] = customer.bottlePrices.price500ml;
          } else {
            productPrices[product.id] = '';
          }
        });
      }
      
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        preferredLanguage: customer.preferredLanguage || currentLanguage,
        productPrices: productPrices,
        openingBalance: customer.openingBalance || '',
      });
    } else {
      // Reset form for new customer - initialize productPrices with default prices from products
      const productPrices = {};
      activeProducts.forEach((product) => {
        // Use product's default price, or empty string if no price set
        productPrices[product.id] = product.price || '';
      });
      
      setFormData({
        name: '',
        phone: '',
        address: '',
        preferredLanguage: currentLanguage,
        productPrices: productPrices,
        openingBalance: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, currentLanguage, productIdsString]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle product prices (format: price_productId)
    if (name.startsWith('price_')) {
      const productId = name.replace('price_', '');
      setFormData((prev) => ({
        ...prev,
        productPrices: {
          ...prev.productPrices,
          [productId]: value === '' ? '' : parseFloat(value) || 0,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
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
    
    // Check if products exist
    if (activeProducts.length === 0) {
      setErrors({ general: t('addProductsFirst') });
      return;
    }
    
    // Basic validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };
  
  // Show message if no products exist
  if (activeProducts.length === 0 && !customer) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-yellow-600 mr-3 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-1">
              {t('noProducts')}
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              {t('addProductsFirstMessage')}
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-yellow-300 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-50"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t('name')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('name')}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          {t('phone')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('phone')}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          {t('address')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          value={formData.address}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.address ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('address')}
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      <div>
        <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
          {t('preferredLanguage')}
        </label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          value={formData.preferredLanguage}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="en">English</option>
          <option value="ur">Urdu</option>
        </select>
      </div>

      {/* Product Prices Section - Dynamic based on available products */}
      {activeProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('productPrices') || t('bottlePrices')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeProducts.map((product) => (
              <div key={product.id}>
                <label
                  htmlFor={`price_${product.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {product.name} ({product.size}) - {t('price')} (Rs.)
                  {product.price && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Default: Rs. {product.price.toLocaleString()})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  id={`price_${product.id}`}
                  name={`price_${product.id}`}
                  min="0"
                  step="0.01"
                  value={formData.productPrices[product.id] || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={product.price ? product.price.toString() : "0"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Opening Balance - Only for new customers */}
      {!customer && (
        <div>
          <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">
            {t('openingBalance')} (Rs.) {t('doNotUpdateAfterCreation')}
          </label>
          <input
            type="number"
            id="openingBalance"
            name="openingBalance"
            min="0"
            step="0.01"
            value={formData.openingBalance}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500">{t('openingBalanceNote')}</p>
        </div>
      )}

      {customer && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('openingBalance')}:</span> Rs.{' '}
            {(customer.openingBalance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t('openingBalanceNotEditable')}</p>
        </div>
      )}

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
          {isLoading ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}

