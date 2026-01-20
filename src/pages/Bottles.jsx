/**
 * Bottles Page
 * 
 * Main page with Orders and Returns tabs
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OrderForm } from '../features/orders/components/OrderForm.jsx';
import { ReturnForm } from '../features/bottles/components/ReturnForm.jsx';
import { ReceiptTemplate } from '../features/receipts/components/ReceiptTemplate.jsx';
import { BottleSummary } from '../features/bottles/components/BottleSummary.jsx';
import { CustomerBottleBalance } from '../features/bottles/components/CustomerBottleBalance.jsx';
import { TransactionHistory } from '../features/bottles/components/TransactionHistory.jsx';
import {
  setLoading,
  setTransactions,
  addTransaction,
  setError,
} from '../features/bottles/slice.js';
import { bottlesService } from '../features/bottles/slice.js';
import { setCustomers } from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import { setProducts } from '../features/products/slice.js';
import { productsService } from '../features/products/slice.js';
import { setOrders, addOrder } from '../features/orders/slice.js';
import { ordersService } from '../features/orders/slice.js';
import { setPayments, addPayment } from '../features/payments/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import { setCashBalance } from '../features/orders/slice.js';
import { cashService } from '../features/cash/service.js';
import { generateReceiptData, printReceipt, shareReceiptViaWhatsApp } from '../features/receipts/service.js';
import { useTranslation } from '../shared/hooks/useTranslation.js';

const TABS = {
  ORDERS: 'orders',
  RETURNS: 'returns',
};

export function Bottles() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { transactions, isLoading, error } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: products } = useSelector((state) => state.products);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState(TABS.ORDERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Load all necessary data on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const [
          loadedTransactions,
          loadedCustomers,
          loadedProducts,
          loadedOrders,
          loadedPayments,
        ] = await Promise.all([
          bottlesService.loadTransactions(),
          customers.length === 0 ? customersService.loadCustomers() : Promise.resolve(null),
          products.length === 0 ? productsService.loadProducts() : Promise.resolve(null),
          ordersService.loadOrders(),
          paymentsService.loadPayments(),
        ]);

        dispatch(setTransactions(loadedTransactions));
        if (loadedCustomers) dispatch(setCustomers(loadedCustomers));
        if (loadedProducts) dispatch(setProducts(loadedProducts));
        dispatch(setOrders(loadedOrders));
        dispatch(setPayments(loadedPayments));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Handle order submission
  const handleOrderSubmit = async (orderData) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      // Get current cash balance
      const currentCashBalance = await cashService.loadCurrentBalance();
      const cashBalanceObj = { 
        amount: typeof currentCashBalance === 'number' ? currentCashBalance : (currentCashBalance?.amount || 0), 
        lastUpdated: new Date().toISOString() 
      };

      // Create order
      const result = await ordersService.createOrder(
        {
          customerId: selectedCustomerId,
          ...orderData,
        },
        orders,
        cashBalanceObj,
        transactions,
        payments,
        user?.id || null
      );

      // Update Redux state
      dispatch(addOrder(result.order));
      dispatch(addTransaction(result.bottleTransaction));
      if (result.payment) {
        dispatch(addPayment(result.payment));
      }
      dispatch(setCashBalance(result.newCashBalance));

      // Show receipt
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const product = products.find((p) => p.id === result.order.productId);
      const receiptData = generateReceiptData(result.order, customer, product);
      setLastOrder({ order: result.order, receiptData, customer, product });
      setShowReceipt(true);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle return submission
  const handleReturnSubmit = async (customerId, quantity, notes) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const newTransaction = await bottlesService.createTransaction(
        customerId,
        'returned',
        quantity,
        notes,
        user?.id || null,
        transactions
      );

      dispatch(addTransaction(newTransaction));
      setSelectedCustomerId(customerId);
      setActiveTab(TABS.ORDERS); // Switch back to orders tab
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handlePrintReceipt = () => {
    if (lastOrder) {
      printReceipt('receipt-template');
    }
  };

  const handleShareReceipt = () => {
    if (lastOrder) {
      shareReceiptViaWhatsApp(lastOrder.receiptData, lastOrder.customer?.phone);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastOrder(null);
    setSelectedCustomerId('');
  };

  const getMaxReturnable = (customerId) => {
    if (!customerId) return undefined;
    return bottlesService.calculateOutstanding(customerId, transactions);
  };

  if (isLoading && transactions.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('bottles')}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab(TABS.ORDERS);
              setShowReceipt(false);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === TABS.ORDERS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('orders')}
          </button>
          <button
            onClick={() => {
              setActiveTab(TABS.RETURNS);
              setShowReceipt(false);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === TABS.RETURNS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('returns')}
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <ReceiptTemplate
                receiptData={lastOrder.receiptData}
                id="receipt-template"
                showActions={true}
                onPrint={handlePrintReceipt}
                onShare={handleShareReceipt}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCloseReceipt}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === TABS.ORDERS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('placeOrder')}</h2>

            <div className="mb-4">
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                {t('customer')} <span className="text-red-500">*</span>
              </label>
              <select
                id="customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('selectCustomer')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && (
              <OrderForm
                customerId={selectedCustomerId}
                onSubmit={handleOrderSubmit}
                onCancel={() => setSelectedCustomerId('')}
                isLoading={isLoading}
              />
            )}
          </div>

          <div>
            {selectedCustomerId && (
              <>
                <CustomerBottleBalance customerId={selectedCustomerId} />
                <div className="mt-6">
                  <TransactionHistory customerId={selectedCustomerId} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === TABS.RETURNS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('returnBottles')}</h2>

            <div className="mb-4">
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                {t('customer')} <span className="text-red-500">*</span>
              </label>
              <select
                id="customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('selectCustomer')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && (
              <ReturnForm
                customerId={selectedCustomerId}
                maxReturnable={getMaxReturnable(selectedCustomerId)}
                onSubmit={handleReturnSubmit}
                onCancel={() => setSelectedCustomerId('')}
                isLoading={isLoading}
              />
            )}
          </div>

          <div>
            {selectedCustomerId && (
              <>
                <CustomerBottleBalance customerId={selectedCustomerId} />
                <div className="mt-6">
                  <TransactionHistory customerId={selectedCustomerId} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Section */}
      {activeTab === TABS.ORDERS && !selectedCustomerId && (
        <BottleSummary />
      )}
    </div>
  );
}
