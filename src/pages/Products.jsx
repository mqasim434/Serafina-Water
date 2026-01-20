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
  removeProduct,
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
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

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
      isActive: true,
    });
    setFormErrors({});
    setViewMode(VIEW_MODES.ADD);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      size: product.size,
      description: product.description || '',
      price: product.price || '',
      isActive: product.isActive,
    });
    setFormErrors({});
    setViewMode(VIEW_MODES.EDIT);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    dispatch(setLoading(true));
    try {
      const currentProducts = products;
      await productsService.deleteProduct(id, currentProducts);
      dispatch(removeProduct(id));
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
    if (!formData.price || formData.price === '') {
      newErrors.price = 'Price is required';
    }
    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) < 0)) {
      newErrors.price = 'Price must be a non-negative number';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      if (editingProduct) {
        const updated = await productsService.updateProduct(
          editingProduct.id,
          formData,
          products
        );
        dispatch(updateProductInState(updated));
      } else {
        const newProduct = await productsService.createProduct(formData, products);
        dispatch(addProduct(newProduct));
      }

      setViewMode(VIEW_MODES.LIST);
      setEditingProduct(null);
      setFormData({
        name: '',
        size: '',
        description: '',
        price: '',
        isActive: true,
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
      isActive: true,
    });
    setFormErrors({});
  };

  const activeProducts = productsService.getActiveProducts(products);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('products')}</h1>
        {viewMode === VIEW_MODES.LIST && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('addProduct')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {viewMode === VIEW_MODES.LIST && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No products found. Add your first product to get started.</p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('addProduct')}
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('size')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('description')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rs. {(product.price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(viewMode === VIEW_MODES.ADD || viewMode === VIEW_MODES.EDIT) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
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

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                {t('price')} (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  formErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
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

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
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
        </div>
      )}
    </div>
  );
}
