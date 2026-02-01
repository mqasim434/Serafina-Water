/**
 * Low Stock Banner
 *
 * Shows an in-app banner when any product is below its low stock threshold.
 * Alert triggers once per low stock event (dismiss hides until next time stock goes low).
 */

import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { productsService, dismissLowStockAlert } from '../slice.js';

export function LowStockBanner() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: products, dismissedLowStockProductIds } = useSelector((state) => state.products);

  const lowStockProducts = productsService.getLowStockProducts(products);
  const visible = lowStockProducts.filter(
    (p) => !dismissedLowStockProductIds.includes(p.id)
  );

  if (visible.length === 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-amber-800 font-semibold" aria-hidden="true">
          ⚠
        </span>
        <span className="text-amber-900 font-medium">{t('lowStockAlerts')}:</span>
        {visible.map((product) => (
          <span
            key={product.id}
            className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-2 py-1 rounded text-sm"
          >
            {product.name} ({product.size}) — {t('currentStock')}: {product.currentStock ?? 0} ({t('lowStockThreshold')}: {product.lowStockThreshold ?? 0})
            <button
              type="button"
              onClick={() => dispatch(dismissLowStockAlert(product.id))}
              className="text-amber-700 hover:text-amber-900 font-medium ml-1"
              aria-label={t('dismissAlert')}
            >
              {t('dismissAlert')}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
