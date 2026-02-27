/**
 * DeliveredOrderDetails – read-only view of a delivered order with proof photo.
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { ordersService } from '../../orders/slice.js';
import { getDeliveredByDisplay } from '../utils.js';

/**
 * @param {Object} props
 * @param {import('../../orders/types.js').Order} props.order
 * @param {import('../../customers/types.js').Customer} [props.customer]
 * @param {import('../../products/types.js').Product[]} props.products
 * @param {function(): void} props.onClose
 */
export function DeliveredOrderDetails({ order, customer, products, onClose }) {
  const { t } = useTranslation();
  const { items: users } = useSelector((state) => state.users);
  const lineItems = ordersService.getOrderLineItems(order);
  const deliveredByDisplay = getDeliveredByDisplay(order.deliveredBy, users);
  const totalQty = ordersService.getOrderTotalQuantity(order);
  const productSummary = lineItems
    .map((item) => {
      const p = products.find((pr) => pr.id === item.productId);
      return p ? `${p.name} (${p.size || '-'}) × ${item.quantity}` : null;
    })
    .filter(Boolean)
    .join(', ') || '-';

  const deliveredAt = order.deliveredAt
    ? new Date(order.deliveredAt).toLocaleString()
    : null;

  return (
    <div
      className="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('order')} #{order.orderNumber}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label={t('close')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {customer && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('customer')}</p>
                <p className="text-gray-900">{customer.name}</p>
                {customer.phone && (
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                )}
              </div>
              {customer.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('address')}</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{customer.address}</p>
                </div>
              )}
            </>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">{t('product')} / {t('quantity')}</p>
            <p className="text-gray-900">{productSummary} (total: {totalQty})</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">{t('totalAmount') || 'Total'}</p>
            <p className="text-gray-900 font-semibold">Rs. {(order.totalAmount ?? 0).toLocaleString()}</p>
          </div>

          {deliveredAt && (
            <div>
              <p className="text-sm font-medium text-gray-500">{t('deliveredAt') || 'Delivered at'}</p>
              <p className="text-gray-900 text-sm">{deliveredAt}</p>
            </div>
          )}

          {deliveredByDisplay && (
            <div>
              <p className="text-sm font-medium text-gray-500">{t('deliveredBy')}</p>
              <p className="text-gray-900 text-sm">{deliveredByDisplay}</p>
            </div>
          )}

          {order.deliveryProofPhotoUrl && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">{t('deliveryProofPhoto') || 'Delivery proof photo'}</p>
              <a
                href={order.deliveryProofPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={order.deliveryProofPhotoUrl}
                  alt={t('deliveryProofPhoto') || 'Delivery proof'}
                  className="w-full max-h-72 object-contain bg-gray-50"
                />
              </a>
              <p className="text-xs text-gray-500 mt-1">
                {t('clickToOpen') || 'Click image to open in new tab'}
              </p>
            </div>
          )}

          {!order.deliveryProofPhotoUrl && (
            <p className="text-sm text-gray-500 italic">{t('noDeliveryProof') || 'No delivery proof photo'}</p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
