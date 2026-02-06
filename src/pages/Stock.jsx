/**
 * Stock Page
 *
 * Stock & Ready to Ship: Admin + Staff can update Ready to Ship per product.
 * Staff cannot edit total stock or product setup (handled on Products page, admin only).
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import {
  setLoading,
  setProducts,
  updateProductInState,
  setError,
  productsService,
} from '../features/products/slice.js';

export function Stock() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: products, isLoading, error } = useSelector((state) => state.products);

  const [editingRts, setEditingRts] = useState({}); // { productId: value }
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (products.length === 0) {
        dispatch(setLoading(true));
      }
      try {
        const loaded = await productsService.loadProducts();
        dispatch(setProducts(loaded));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }
    loadData();
  }, [dispatch, products.length]);

  const trackedProducts = products.filter(
    (p) => p.isActive && p.trackStock !== false
  );

  const lowStockProducts = productsService.getLowStockProducts(products);

  const handleReadyToShipChange = (productId, value) => {
    setEditingRts((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSaveReadyToShip = async (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const raw = editingRts[productId];
    const num = raw !== undefined && raw !== '' ? Math.max(0, parseInt(String(raw), 10) || 0) : (product.readyToShip ?? 0);
    setSavingId(productId);
    dispatch(setError(null));
    try {
      const updated = await productsService.updateReadyToShip(productId, num, products);
      dispatch(updateProductInState(updated));
      setEditingRts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('stockOverview')}</h1>
        <p className="text-gray-600 mt-2">
          {t('readyToShip')} — {t('stockOverview')}.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-base font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            {t('lowStockAlerts')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <span
                key={product.id}
                className="inline-flex items-center bg-amber-100 text-amber-900 px-3 py-1.5 rounded text-sm font-medium"
              >
                {product.name} ({product.size}) — {t('currentStock')}: {product.currentStock ?? 0} / {t('lowStockThreshold')}: {product.lowStockThreshold ?? 0}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {trackedProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('noStockTrackingProducts')}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('currentStock')} ({t('readOnly')})
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('readyToShip')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trackedProducts.map((product) => {
                const currentRts = product.readyToShip ?? 0;
                const editVal = editingRts[product.id];
                const displayRts = editVal !== undefined ? editVal : currentRts;
                const isSaving = savingId === product.id;
                const isLowStock = (product.currentStock ?? 0) < (product.lowStockThreshold ?? 0);
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${isLowStock ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name} ({product.size})
                      {isLowStock && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-900">
                          {t('lowStockAlert')}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'text-amber-800 font-semibold' : 'text-gray-500'}`}>
                      {product.currentStock ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min={0}
                        max={product.currentStock ?? 0}
                        value={displayRts}
                        onChange={(e) => handleReadyToShipChange(product.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        type="button"
                        onClick={() => handleSaveReadyToShip(product.id)}
                        disabled={isSaving}
                        className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                      >
                        {isSaving ? t('loading') : t('save')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
