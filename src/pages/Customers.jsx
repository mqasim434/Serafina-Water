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
  setError,
  setSelectedId,
} from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import { productsService } from '../features/products/slice.js';
import { setProducts } from '../features/products/slice.js';
import { setOrders } from '../features/orders/slice.js';
import { setPayments } from '../features/payments/slice.js';
import { setTransactions } from '../features/bottles/slice.js';
import { ordersService } from '../features/orders/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import { bottlesService } from '../features/bottles/slice.js';
import { setUsers } from '../features/users/slice.js';
import { usersService } from '../features/users/slice.js';
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
  const { items: users } = useSelector((state) => state.users);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Load customers, products, orders, payments, bottle transactions on mount
  useEffect(() => {
    async function loadData() {
      if (customers.length === 0 || products.length === 0) {
        dispatch(setLoading(true));
      }
      try {
        const [loadedCustomers, loadedProducts, loadedOrders, loadedPayments, loadedTransactions, loadedUsers] = await Promise.all([
          customersService.loadCustomers(),
          products.length === 0 ? productsService.loadProducts() : Promise.resolve(null),
          ordersService.loadOrders(),
          paymentsService.loadPayments(),
          bottlesService.loadTransactions(),
          users.length === 0 ? usersService.loadUsers().catch(() => null) : Promise.resolve(null),
        ]);
        dispatch(setCustomers(loadedCustomers));
        if (loadedProducts) dispatch(setProducts(loadedProducts));
        dispatch(setOrders(loadedOrders));
        dispatch(setPayments(loadedPayments));
        dispatch(setTransactions(loadedTransactions));
        if (loadedUsers) dispatch(setUsers(loadedUsers));
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

  const handleDeactivate = async () => {
    if (!selectedId) return;
    if (!window.confirm('Deactivate this customer? They will not be able to place orders, return bottles, or make payments.')) {
      return;
    }
    dispatch(setLoading(true));
    try {
      const updated = await customersService.deactivateCustomer(selectedId, customers);
      dispatch(updateCustomerInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleActivate = async () => {
    if (!selectedId) return;
    dispatch(setLoading(true));
    try {
      const updated = await customersService.activateCustomer(selectedId, customers);
      dispatch(updateCustomerInState(updated));
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
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
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
