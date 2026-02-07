/**
 * Place Orders Page
 *
 * Page for placing orders and managing recent orders
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OrderForm } from '../features/orders/components/OrderForm.jsx';
import { BottleSummary } from '../features/bottles/components/BottleSummary.jsx';
import { CustomerBottleBalance } from '../features/bottles/components/CustomerBottleBalance.jsx';
import { TransactionHistory } from '../features/bottles/components/TransactionHistory.jsx';
import { CustomerSearch } from '../features/customers/components/CustomerSearch.jsx';
import {
  setLoading,
  setTransactions,
  setError,
  addTransaction,
} from '../features/bottles/slice.js';
import { bottlesService } from '../features/bottles/slice.js';
import { setCustomers, updateCustomerInState } from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import { setProducts } from '../features/products/slice.js';
import { productsService } from '../features/products/slice.js';
import { setOrders, addOrder, updateOrderInState } from '../features/orders/slice.js';
import { ordersService } from '../features/orders/slice.js';
import { updateProductInState } from '../features/products/slice.js';
import { setPayments, addPayment } from '../features/payments/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import { setCashBalance } from '../features/orders/slice.js';
import * as cashService from '../features/cash/service.js';
import * as receiptsService from '../features/receipts/service.js';
import { useTranslation } from '../shared/hooks/useTranslation.js';

export function Bottles() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { transactions, isLoading, error } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: products } = useSelector((state) => state.products);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    setShowSuccessMessage(false); // Clear any previous success message
    
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
        user?.id || null,
        products
      );

      // Update Redux state
      dispatch(addOrder(result.order));
      dispatch(addTransaction(result.bottleTransaction));
      if (result.payment) {
        dispatch(addPayment(result.payment));
      }
      dispatch(setCashBalance(result.newCashBalance));

      // Update customer hasDispenser: if order contains dispenser product → true; else use manual checkbox
      const orderItems = result.order.items || (result.order.productId ? [{ productId: result.order.productId }] : []);
      const orderContainsDispenser = orderItems.some((item) => {
        const p = products.find((pr) => pr.id === item.productId);
        return p && (p.name || '').toLowerCase().includes('dispenser');
      });
      const newHasDispenser = orderContainsDispenser || !!(orderData.hasDispenser ?? false);
      const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
      if (currentCustomer && (orderContainsDispenser || orderData.hasDispenser !== undefined)) {
        try {
          const updatedCustomer = await customersService.updateCustomerHasDispenser(
            selectedCustomerId,
            newHasDispenser,
            customers
          );
          dispatch(updateCustomerInState(updatedCustomer));
        } catch (e) {
          console.warn('Could not update hasDispenser:', e);
        }
      }

      // Show success message
      const orderNumber = result.order.orderNumber || '';
      const successMsg = t('orderCreated') + (orderNumber ? ` - ${t('order')} #${orderNumber}` : '');
      setSuccessMessage(successMsg);
      
      // Keep loading visible for at least 500ms, then show success
      setTimeout(() => {
        dispatch(setLoading(false));
        
        // Show success notification immediately after loading clears
        setTimeout(() => {
          setShowSuccessMessage(true);
          
          // Auto-hide success message after 4 seconds
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 4000);
        }, 50);
        
        // Reset form after a brief delay
        setTimeout(() => {
          setSelectedCustomerId('');
        }, 1000);
      }, 500);

      // Show receipt - TEMPORARILY DISABLED FOR BUILD TESTING
      // const customer = customers.find((c) => c.id === selectedCustomerId);
      // const product = products.find((p) => p.id === result.order.productId);
      // const receiptData = receiptsService.generateReceiptData(result.order, customer, product);
      // setLastOrder({ order: result.order, receiptData, customer, product });
      // setShowReceipt(true);
      setShowReceipt(false); // Disabled for build testing
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(setLoading(false));
    }
  };

  // Mark order as ready (adds to Deliveries Ready tab for driver)
  const handleMarkReady = async (orderId) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const updatedOrder = await ordersService.markOrderReady(orderId, orders);
      dispatch(updateOrderInState(updatedOrder));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handlePrintReceipt = () => {
    // TEMPORARILY DISABLED
    // if (lastOrder) {
    //   receiptsService.printReceipt('receipt-template');
    // }
    console.warn('Receipt printing temporarily disabled');
  };

  const handleShareReceipt = () => {
    // TEMPORARILY DISABLED
    // if (lastOrder) {
    //   receiptsService.shareReceiptViaWhatsApp(lastOrder.receiptData, lastOrder.customer?.phone);
    // }
    console.warn('Receipt sharing temporarily disabled');
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastOrder(null);
    setSelectedCustomerId('');
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
      <h1 className="text-2xl font-bold text-gray-900">{t('placeOrders')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Notification */}
      {showSuccessMessage && (
        <div 
          className="fixed top-20 right-4 z-[9999] bg-green-500 border-2 border-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in"
          style={{ zIndex: 9999 }}
        >
          <svg
            className="w-6 h-6 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-bold text-base">{t('success')}</p>
            <p className="text-sm mt-1">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessMessage(false)}
            className="ml-2 text-white hover:text-gray-200 font-bold text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Receipt Modal - TEMPORARILY DISABLED */}
      {/* {showReceipt && lastOrder && (
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
      )} */}

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('placeOrder')}</h2>

            <div className="mb-4">
              <CustomerSearch
                customers={customersService.getActiveCustomers(customers)}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                required={true}
                placeholder={t('search') + ' ' + t('customer').toLowerCase() + '...'}
              />
            </div>

            {selectedCustomerId && (
              <OrderForm
                customerId={selectedCustomerId}
                onSubmit={handleOrderSubmit}
                onCancel={() => {
                  setSelectedCustomerId('');
                }}
                isLoading={isLoading}
                key={selectedCustomerId} // Force re-render when customer changes
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

        {/* Recent Orders - Mark as Ready */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('recentOrders')}</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('noOrders')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('order')} #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('customer')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('product')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('quantity')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('markReady')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...orders]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 25)
                    .map((order) => {
                      const customer = customers.find((c) => c.id === order.customerId);
                      const lineItems = ordersService.getOrderLineItems(order);
                      const totalQty = ordersService.getOrderTotalQuantity(order);
                      const productSummary = lineItems
                        .map((item) => {
                          const p = products.find((pr) => pr.id === item.productId);
                          return p ? `${p.name} (${p.size}) × ${item.quantity}` : null;
                        })
                        .filter(Boolean)
                        .join(', ') || '-';
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{order.orderNumber ?? order.id}</td>
                          <td className="px-4 py-2">{customer?.name ?? order.customerId}</td>
                          <td className="px-4 py-2">{productSummary}</td>
                          <td className="px-4 py-2">{totalQty}</td>
                          <td className="px-4 py-2">
                            {(() => {
                              const status = ordersService.getDeliveryStatus(order);
                              const style = status === 'delivered' ? 'bg-green-100 text-green-800' : status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                              const label = status === 'delivered' ? t('delivered') : status === 'ready' ? t('ready') : t('pending');
                              return (
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${style}`}>
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {ordersService.getDeliveryStatus(order) === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleMarkReady(order.id)}
                                disabled={isLoading}
                                className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                              >
                                {t('markReady')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!selectedCustomerId && <BottleSummary />}
    </div>
  );
}
