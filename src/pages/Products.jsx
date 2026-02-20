/**
 * Products Page
 * 
 * Admin-only page for managing bottle products
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import {
  setLoading,
  setProducts,
  addProduct,
  updateProductInState,
  setError,
  productsService,
} from '../features/products/slice.js';

const VIEW_MODES = {
  LIST: 'list',
  ADD: 'add',
  EDIT: 'edit',
};

export function Products() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: products, isLoading, error } = useSelector((state) => state.products);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    description: '',
    price: '',
    costPrice: '',
    isActive: true,
    isReturnable: true,
    trackStock: true,
    lowStockThreshold: 0,
    freeItem: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAddStock, setShowAddStock] = useState(false);
  const [addStockProduct, setAddStockProduct] = useState(null);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockError, setAddStockError] = useState('');

  // Load products on mount
  useEffect(() => {
    async function loadData() {
      if (products.length === 0) {
        dispatch(setLoading(true));
      }
      try {
        const loadedProducts = await productsService.loadProducts();
        dispatch(setProducts(loadedProducts));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
  }, [dispatch, products.length]);

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      size: '',
      description: '',
      price: '',
      costPrice: '',
      isActive: true,
      isReturnable: true,
      trackStock: true,
      lowStockThreshold: 0,
      freeItem: false,
    });
    setFormErrors({});
    setViewMode(VIEW_MODES.ADD);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    const isFree = (product.price === 0 || product.price === '0');
    setFormData({
      name: product.name,
      size: product.size,
      description: product.description || '',
      price: isFree ? '0' : ((product.price !== undefined && product.price !== null) ? String(product.price) : ''),
      costPrice: product.costPrice ?? '',
      isActive: product.isActive,
      isReturnable: product.isReturnable !== undefined ? product.isReturnable : true,
      trackStock: product.trackStock !== undefined ? product.trackStock : true,
      lowStockThreshold: product.lowStockThreshold ?? 0,
      freeItem: isFree,
    });
    setFormErrors({});
    setViewMode(VIEW_MODES.EDIT);
  };

  const handleAddStockClick = (product) => {
    setAddStockProduct(product);
    setAddStockQty('');
    setAddStockError('');
    setShowAddStock(true);
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(addStockQty, 10);
    if (!addStockProduct || !qty || qty <= 0) {
      setAddStockError('Enter a valid quantity');
      return;
    }
    setAddStockError('');
    dispatch(setLoading(true));
    try {
      const updated = await productsService.addStockPurchase(addStockProduct.id, qty, products);
      dispatch(updateProductInState(updated));
      setShowAddStock(false);
      setAddStockProduct(null);
      setAddStockQty('');
    } catch (err) {
      setAddStockError(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm(t('confirmDeactivateProduct'))) {
      return;
    }

    dispatch(setLoading(true));
    try {
      const updated = await productsService.deactivateProduct(id, products);
      dispatch(updateProductInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm(t('confirmActivateProduct'))) {
      return;
    }

    dispatch(setLoading(true));
    try {
      const updated = await productsService.activateProduct(id, products);
      dispatch(updateProductInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.size.trim()) {
      newErrors.size = 'Size is required';
    }
    const priceVal = parseFloat(formData.price);
    if (formData.freeItem) {
      // Free item: price is 0, no validation needed
    } else if (formData.price === '' || formData.price === undefined || formData.price === null) {
      newErrors.price = 'Price is required';
    } else if (isNaN(priceVal) || priceVal < 0) {
      newErrors.price = 'Price must be a non-negative number';
    }
    if (formData.costPrice === '' || formData.costPrice === undefined || formData.costPrice === null) {
      newErrors.costPrice = 'Cost price is required';
    }
    if (formData.costPrice !== '' && formData.costPrice != null && (isNaN(formData.costPrice) || parseFloat(formData.costPrice) < 0)) {
      newErrors.costPrice = 'Cost price must be a non-negative number';
    }
    if (formData.trackStock) {
      const threshold = formData.lowStockThreshold;
      if (threshold === '' || threshold === undefined || threshold === null) {
        newErrors.lowStockThreshold = 'Low stock threshold is required';
      } else if (isNaN(threshold) || parseInt(threshold, 10) < 0) {
        newErrors.lowStockThreshold = 'Low stock threshold must be a non-negative number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const submitData = {
        ...formData,
        price: formData.freeItem ? 0 : formData.price,
      };
      if (editingProduct) {
        const updated = await productsService.updateProduct(
          editingProduct.id,
          submitData,
          products
        );
        dispatch(updateProductInState(updated));
      } else {
        const newProduct = await productsService.createProduct(submitData, products);
        dispatch(addProduct(newProduct));
      }

      setViewMode(VIEW_MODES.LIST);
      setEditingProduct(null);
      setFormData({
        name: '',
        size: '',
        description: '',
        price: '',
        costPrice: '',
        isActive: true,
        isReturnable: true,
        trackStock: true,
        lowStockThreshold: 0,
        freeItem: false,
      });
      setFormErrors({});
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setViewMode(VIEW_MODES.LIST);
    setEditingProduct(null);
    setFormData({
      name: '',
      size: '',
      description: '',
      price: '',
      costPrice: '',
      isActive: true,
      isReturnable: true,
      trackStock: true,
      lowStockThreshold: 0,
      freeItem: false,
    });
    setFormErrors({});
  };

  const activeProducts = productsService.getActiveProducts(products);
  const inactiveProducts = productsService.getInactiveProducts(products);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{t('products')}</h1>
        {viewMode === VIEW_MODES.LIST && (
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            {t('addProduct')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {viewMode === VIEW_MODES.LIST && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeProducts.length === 0 && inactiveProducts.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
              <p className="mb-4">{t('noProductsFound')}</p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                {t('addProduct')}
              </button>
            </div>
          ) : (
            <>
              {/* Active products */}
              {activeProducts.length > 0 && (
                <>
              {/* Mobile card layout */}
              <div className="block sm:hidden divide-y divide-gray-200">
                {activeProducts.map((product) => (
                  <div key={product.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <span className="text-sm font-medium text-gray-900 shrink-0">
                        Rs. {(product.price || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{product.size}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span>{t('stock')}: {product.trackStock !== false ? (product.currentStock ?? 0) : '-'}</span>
                      <span>{t('readyToShip')}: {product.trackStock !== false ? (product.readyToShip ?? 0) : '-'}</span>
                    </div>
                    {product.trackStock !== false && (
                      <button
                        type="button"
                        onClick={() => handleAddStockClick(product)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >
                        {t('addStock')}
                      </button>
                    )}
                    {product.description ? (
                      <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                    ) : null}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="flex-1 py-2 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded border border-blue-200"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(product.id)}
                        className="flex-1 py-2 text-amber-600 hover:bg-amber-50 font-medium text-sm rounded border border-amber-200"
                      >
                        {t('deactivate')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('name')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('size')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('price')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('stock')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('readyToShip')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('description')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.size}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rs. {(product.price || 0).toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.trackStock !== false ? (product.currentStock ?? 0) : '-'}
                          {product.trackStock !== false && (
                            <button
                              type="button"
                              onClick={() => handleAddStockClick(product)}
                              className="ml-2 text-blue-600 hover:text-blue-900 text-xs"
                            >
                              {t('addStock')}
                            </button>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.trackStock !== false ? (product.readyToShip ?? 0) : '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                          {product.description || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => handleDeactivate(product.id)}
                            className="text-amber-600 hover:text-amber-900"
                          >
                            {t('deactivate')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}

              {/* Deactivated products section */}
              {inactiveProducts.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-4 sm:px-6">
                    {t('deactivatedProducts')}
                  </h3>
                  {/* Mobile: deactivated cards */}
                  <div className="block sm:hidden divide-y divide-gray-200">
                    {inactiveProducts.map((product) => (
                      <div key={product.id} className="p-4 space-y-2 bg-gray-50">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-medium text-gray-600">{product.name}</span>
                          <span className="text-sm font-medium text-gray-600 shrink-0">
                            Rs. {(product.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{product.size}</p>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="flex-1 py-2 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded border border-blue-200"
                          >
                            {t('edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActivate(product.id)}
                            className="flex-1 py-2 text-green-600 hover:bg-green-50 font-medium text-sm rounded border border-green-200"
                          >
                            {t('activate')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: deactivated table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('name')}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('size')}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('price')}
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-50 divide-y divide-gray-200">
                        {inactiveProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-100">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                              {product.name}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.size}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              Rs. {(product.price || 0).toLocaleString()}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleActivate(product.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                {t('activate')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {(viewMode === VIEW_MODES.ADD || viewMode === VIEW_MODES.EDIT) && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            {editingProduct ? t('editProduct') : t('addProduct')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 19L Bottle"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                {t('size')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.size ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 19L, 6L, 1.5L, 500ml"
              />
              {formErrors.size && (
                <p className="mt-1 text-sm text-red-600">{formErrors.size}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('description')}
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('description')}
              />
            </div>

            <div className="flex items-center mb-2">
              <input
                id="freeItem"
                type="checkbox"
                checked={formData.freeItem}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    freeItem: checked,
                    price: checked ? '0' : formData.price,
                  });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="freeItem" className="ml-2 block text-sm text-gray-900">
                {t('freeItem') || 'Free item'}
              </label>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                {t('price')} (Rs.) {!formData.freeItem && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                disabled={formData.freeItem}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.price ? 'border-red-300' : 'border-gray-300'
                } ${formData.freeItem ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="0.00"
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">
                {t('costPrice')} (Rs.) — {t('adminOnlyProfit')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="costPrice"
                min="0"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.costPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formErrors.costPrice && (
                <p className="mt-1 text-sm text-red-600">{formErrors.costPrice}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                {t('active')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isReturnable"
                type="checkbox"
                checked={formData.isReturnable}
                onChange={(e) => setFormData({ ...formData, isReturnable: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isReturnable" className="ml-2 block text-sm text-gray-900">
                {t('returnable') || 'Returnable'}
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="trackStock"
                type="checkbox"
                checked={formData.trackStock}
                onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="trackStock" className="ml-2 block text-sm text-gray-900">
                {t('trackStock')}
              </label>
            </div>

            {formData.trackStock && (
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
                  {t('lowStockThreshold')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  min="0"
                  required
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    formErrors.lowStockThreshold ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.lowStockThreshold && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lowStockThreshold}</p>
                )}
              </div>
            )}

            {editingProduct && formData.trackStock && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('currentStock')} ({t('readOnly')})
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{editingProduct.currentStock ?? 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('readyToShip')}
                  </label>
                  <p className="mt-1 text-sm text-gray-500">{editingProduct.readyToShip ?? 0}</p>
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? t('loading') : t('save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Stock Modal (Admin only) */}
      {showAddStock && addStockProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 sm:p-6 my-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('addStock')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {addStockProduct.name} ({addStockProduct.size}) — {t('currentStock')}: {addStockProduct.currentStock ?? 0}
            </p>
            <form onSubmit={handleAddStockSubmit}>
              <div className="mb-4">
                <label htmlFor="addStockQty" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('quantityPurchased')}
                </label>
                <input
                  type="number"
                  id="addStockQty"
                  min="1"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {addStockError && (
                <p className="text-sm text-red-600 mb-3">{addStockError}</p>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddStock(false); setAddStockProduct(null); setAddStockQty(''); setAddStockError(''); }}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
