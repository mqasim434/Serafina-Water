/**
 * Payments Page
 * 
 * Main page for payment management
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { PaymentForm } from '../features/payments/components/PaymentForm.jsx';
import { PaymentHistory } from '../features/payments/components/PaymentHistory.jsx';
import { CustomerBalanceCard } from '../features/payments/components/CustomerBalanceCard.jsx';
import { CustomerSearch } from '../features/customers/components/CustomerSearch.jsx';
import {
  setLoading,
  setPayments,
  addPayment,
  setError,
} from '../features/payments/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import { ordersService, setOrders, setCashBalance } from '../features/orders/slice.js';
import { setCustomers } from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import * as cashService from '../features/cash/service.js';

const VIEW_MODES = {
  LIST: 'list',
  PAYMENT: 'payment',
};

export function Payments() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: customers } = useSelector((state) => state.customers);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments, isLoading, error } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Keep for list view search

  // Load payments, orders, and customers on mount - always ensure customers are loaded
  useEffect(() => {
    async function loadData() {
      // Only show loading if we don't have data yet
      if (payments.length === 0 || customers.length === 0) {
        dispatch(setLoading(true));
      }
      try {
        const loadPromises = [paymentsService.loadPayments()];
        
        // Load orders if not already loaded
        if (orders.length === 0) {
          loadPromises.push(ordersService.loadOrders());
        } else {
          loadPromises.push(Promise.resolve(null));
        }
        
        // Always load customers to ensure they're available
        loadPromises.push(customersService.loadCustomers());
        
        const [loadedPayments, loadedOrders, loadedCustomers] = await Promise.all(loadPromises);
        
        dispatch(setPayments(loadedPayments));
        
        if (loadedOrders !== null) {
          dispatch(setOrders(loadedOrders));
        }
        
        // Always update customers if we loaded them
        if (loadedCustomers && loadedCustomers.length > 0) {
          dispatch(setCustomers(loadedCustomers));
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

  const handleRecordPayment = () => {
    setViewMode(VIEW_MODES.PAYMENT);
    setSelectedCustomerId('');
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    setViewMode(VIEW_MODES.PAYMENT);
  };

  const handleFormSubmit = async (customerId, amount, paymentMethod, notes) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Get current cash balance
      const currentCashBalance = await cashService.loadCurrentBalance();
      const cashBalanceObj = { 
        amount: typeof currentCashBalance === 'number' ? currentCashBalance : (currentCashBalance?.amount || 0), 
        lastUpdated: new Date().toISOString() 
      };

      const result = await paymentsService.createPayment(
        {
          customerId,
          amount,
          paymentMethod,
          notes,
        },
        payments,
        user?.id || null,
        cashBalanceObj.amount
      );

      dispatch(addPayment(result.payment));
      
      // Update cash balance if payment was cash
      if (result.newCashBalance !== undefined) {
        dispatch(setCashBalance({ 
          amount: result.newCashBalance, 
          lastUpdated: new Date().toISOString() 
        }));
      }
      
      setViewMode(VIEW_MODES.LIST);
      setSelectedCustomerId(customerId);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setViewMode(VIEW_MODES.LIST);
    setSelectedCustomerId('');
  };

  const getOutstandingBalance = (customerId) => {
    return paymentsService.calculateOutstandingBalance(customerId, orders, payments, customers);
  };

  // Get all customers with balances
  const customerBalances = paymentsService.getAllCustomerBalances(orders, payments, customers);
  let customersWithBalance = customerBalances
    .filter((cb) => cb.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  
  // Apply search filter
  const filteredCustomersWithBalance = searchQuery.trim() 
    ? (() => {
        const query = searchQuery.toLowerCase().trim();
        return customersWithBalance.filter((cb) => {
          const customer = customers.find((c) => c.id === cb.customerId);
          if (!customer) return false;
          const name = (customer.name || '').toLowerCase();
          const phone = (customer.phone || '').toString();
          return name.includes(query) || phone.includes(query);
        });
      })()
    : customersWithBalance;

  if (isLoading && payments.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('payments')}</h1>
        <button
          onClick={handleRecordPayment}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {t('recordPayment')}
        </button>
      </div>

      {viewMode === VIEW_MODES.LIST && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('search') + ' ' + t('customers').toLowerCase() + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {viewMode === VIEW_MODES.LIST && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customers with Outstanding Balance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('outstandingBalance')}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredCustomersWithBalance.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery.trim() ? t('noResults') || 'No results found' : t('noPayments')}
                </div>
              ) : (
                filteredCustomersWithBalance.map((balance) => {
                  const customer = customers.find((c) => c.id === balance.customerId);
                  if (!customer) return null;
                  return (
                    <button
                      key={balance.customerId}
                      onClick={() => handleCustomerSelect(balance.customerId)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            Rs. {balance.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Customer Details */}
          {selectedCustomerId && (
            <div className="space-y-6">
              <CustomerBalanceCard customerId={selectedCustomerId} />
              <PaymentHistory customerId={selectedCustomerId} />
            </div>
          )}
        </div>
      )}

      {viewMode === VIEW_MODES.PAYMENT && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('newPayment')}</h2>

            {!selectedCustomerId && (
              <div className="mb-4">
                {customers.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    {t('loadingCustomers') || 'Loading customers...'}
                  </div>
                ) : (
                  <CustomerSearch
                    customers={customers}
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    required={true}
                    placeholder={t('search') + ' ' + t('customer').toLowerCase() + '...'}
                    getDisplayText={(customer) => {
                      const balance = getOutstandingBalance(customer.id);
                      return `${customer.name} ${balance > 0 ? `- Rs. ${balance.toLocaleString()}` : ''}`;
                    }}
                  />
                )}
              </div>
            )}

            {selectedCustomerId && (
              <PaymentForm
                customerId={selectedCustomerId}
                outstandingBalance={getOutstandingBalance(selectedCustomerId)}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            )}
          </div>

          <div>
            {selectedCustomerId && (
              <>
                <CustomerBalanceCard customerId={selectedCustomerId} />
                <div className="mt-6">
                  <PaymentHistory customerId={selectedCustomerId} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
