/**
 * Customers Page
 * 
 * Main page for customer management
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CustomerList } from '../features/customers/components/CustomerList.jsx';
import { CustomerForm } from '../features/customers/components/CustomerForm.jsx';
import { CustomerDetails } from '../features/customers/components/CustomerDetails.jsx';
import {
  setLoading,
  setCustomers,
  addCustomer,
  updateCustomerInState,
  removeCustomer,
  setError,
  setSelectedId,
} from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import { productsService } from '../features/products/slice.js';
import { setProducts } from '../features/products/slice.js';
import { useTranslation } from '../shared/hooks/useTranslation.js';

const VIEW_MODES = {
  LIST: 'list',
  ADD: 'add',
  EDIT: 'edit',
  DETAILS: 'details',
};

export function Customers() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: customers, isLoading, error, selectedId } = useSelector(
    (state) => state.customers
  );
  const { items: products } = useSelector((state) => state.products);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Load customers and products on mount - always load to ensure fresh data
  useEffect(() => {
    async function loadData() {
      // Only show loading if we don't have data yet
      if (customers.length === 0 || products.length === 0) {
        dispatch(setLoading(true));
      }
      try {
        const loadPromises = [customersService.loadCustomers()];
        
        // Load products if not already loaded
        if (products.length === 0) {
          loadPromises.push(productsService.loadProducts());
        } else {
          loadPromises.push(Promise.resolve(null));
        }
        
        const [loadedCustomers, loadedProducts] = await Promise.all(loadPromises);
        
        dispatch(setCustomers(loadedCustomers));
        
        if (loadedProducts !== null) {
          dispatch(setProducts(loadedProducts));
        }
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setViewMode(VIEW_MODES.ADD);
    dispatch(setSelectedId(null));
  };

  const handleSelect = (id) => {
    dispatch(setSelectedId(id));
    setViewMode(VIEW_MODES.DETAILS);
  };

  const handleEdit = () => {
    if (selectedId) {
      const customer = customersService.findCustomerById(selectedId, customers);
      if (customer) {
        setEditingCustomer(customer);
        setViewMode(VIEW_MODES.EDIT);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    dispatch(setLoading(true));
    try {
      await customersService.deleteCustomer(selectedId, customers);
      dispatch(removeCustomer(selectedId));
      setViewMode(VIEW_MODES.LIST);
      dispatch(setSelectedId(null));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFormSubmit = async (formData) => {
    dispatch(setLoading(true));
    try {
      if (viewMode === VIEW_MODES.ADD) {
        const newCustomer = await customersService.createCustomer(formData, customers);
        dispatch(addCustomer(newCustomer));
        dispatch(setSelectedId(newCustomer.id));
        setViewMode(VIEW_MODES.DETAILS);
      } else if (viewMode === VIEW_MODES.EDIT && editingCustomer) {
        const updatedCustomer = await customersService.updateCustomer(
          editingCustomer.id,
          formData,
          customers
        );
        dispatch(updateCustomerInState(updatedCustomer));
        dispatch(setSelectedId(updatedCustomer.id));
        setViewMode(VIEW_MODES.DETAILS);
      }
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setViewMode(VIEW_MODES.LIST);
    setEditingCustomer(null);
    if (selectedId) {
      setViewMode(VIEW_MODES.DETAILS);
    }
  };

  const selectedCustomer = selectedId
    ? customersService.findCustomerById(selectedId, customers)
    : null;

  // Show loading only if we're actually loading and have no data
  if (isLoading && customers.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('customers')}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: List or Form */}
        <div>
          {viewMode === VIEW_MODES.LIST || viewMode === VIEW_MODES.DETAILS ? (
            <CustomerList
              customers={customers}
              onSelect={handleSelect}
              onAdd={handleAdd}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {viewMode === VIEW_MODES.ADD ? t('addCustomer') : t('editCustomer')}
              </h2>
              <CustomerForm
                customer={editingCustomer}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>

        {/* Right column: Details or empty */}
        <div>
          {viewMode === VIEW_MODES.DETAILS && selectedCustomer && (
            <CustomerDetails
              customer={selectedCustomer}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {(viewMode === VIEW_MODES.ADD || viewMode === VIEW_MODES.EDIT) && (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              {t('details')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
