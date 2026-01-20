/**
 * Customer Details Component
 * 
 * Displays customer details with edit/delete actions
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { productsService } from '../../../features/products/slice.js';

/**
 * Customer Details props
 * @typedef {Object} CustomerDetailsProps
 * @property {import('../types.js').Customer} customer - Customer to display
 * @property {function(): void} onEdit - Handler for edit button
 * @property {function(): void} onDelete - Handler for delete button
 */

/**
 * Customer Details component
 * @param {CustomerDetailsProps} props
 */
export function CustomerDetails({ customer, onEdit, onDelete }) {
  const { t } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  const activeProducts = productsService.getActiveProducts(products);

  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t('noCustomers')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('customerDetails')}</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('edit')}
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">{t('name')}</label>
          <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">{t('phone')}</label>
          <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">{t('address')}</label>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{customer.address}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">{t('preferredLanguage')}</label>
          <p className="mt-1 text-sm text-gray-900">
            {customer.preferredLanguage === 'en' ? 'English' : 'Urdu'}
          </p>
        </div>

        {(customer.openingBalance || customer.openingBalance === 0) && (
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('openingBalance')}</label>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              Rs. {(customer.openingBalance || 0).toLocaleString()}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('productPrices') || t('bottlePrices')}</label>
          <div className="grid grid-cols-2 gap-3">
            {customer.productPrices && activeProducts.length > 0 ? (
              activeProducts.map((product) => {
                const price = customer.productPrices[product.id];
                if (price && price > 0) {
                  return (
                    <div key={product.id}>
                      <span className="text-xs text-gray-500">{product.name} ({product.size}):</span>
                      <p className="text-sm font-medium text-gray-900">
                        Rs. {(price || 0).toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }).filter(Boolean)
            ) : customer.bottlePrices ? (
              // Backward compatibility: show old bottlePrices if productPrices doesn't exist
              <>
                {customer.bottlePrices.price19L > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">19L:</span>
                    <p className="text-sm font-medium text-gray-900">
                      Rs. {(customer.bottlePrices.price19L || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {customer.bottlePrices.price6L > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">6L:</span>
                    <p className="text-sm font-medium text-gray-900">
                      Rs. {(customer.bottlePrices.price6L || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {customer.bottlePrices.price1_5L > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">1.5L:</span>
                    <p className="text-sm font-medium text-gray-900">
                      Rs. {(customer.bottlePrices.price1_5L || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {customer.bottlePrices.price500ml > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">500ml:</span>
                    <p className="text-sm font-medium text-gray-900">
                      Rs. {(customer.bottlePrices.price500ml || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            ) : null}
            {(!customer.productPrices || Object.keys(customer.productPrices).length === 0) &&
             (!customer.bottlePrices || 
              (customer.bottlePrices.price19L === 0 && 
               customer.bottlePrices.price6L === 0 && 
               customer.bottlePrices.price1_5L === 0 && 
               customer.bottlePrices.price500ml === 0)) && (
              <p className="text-sm text-gray-500 col-span-2">{t('noPricesSet')}</p>
            )}
          </div>
        </div>

        {customer.createdAt && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Created</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(customer.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

