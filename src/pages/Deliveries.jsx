/**
 * Deliveries Page
 * Pending tab: mark orders Ready. Ready tab: driver delivery list → Delivery Screen (payment + photo → Mark Delivered).
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { DeliveryScreen } from '../features/delivery/components/DeliveryScreen.jsx';
import { DeliveredOrderDetails } from '../features/delivery/components/DeliveredOrderDetails.jsx';
import { ordersService } from '../features/orders/slice.js';
import { setOrders, updateOrderInState, setLoading, setError, setCashBalance } from '../features/orders/slice.js';
import { addPayment, setPayments } from '../features/payments/slice.js';
import { setCustomers } from '../features/customers/slice.js';
import { setProducts } from '../features/products/slice.js';
import { customersService } from '../features/customers/slice.js';
import { productsService } from '../features/products/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import * as cashService from '../features/cash/service.js';

const TABS = { PENDING: 'pending', READY: 'ready', DELIVERED: 'delivered' };

export function Deliveries() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: products } = useSelector((state) => state.products);
  const { items: payments } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);
  const isLoading = useSelector((state) => state.orders.isLoading);
  const error = useSelector((state) => state.orders.error);

  const [activeTab, setActiveTab] = useState(TABS.PENDING);
  const [deliveryDate, setDeliveryDate] = useState(cashService.getTodayDate());
  const [deliveredFilterMode, setDeliveredFilterMode] = useState('date'); // 'date' | 'all'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingDeliveredOrder, setViewingDeliveredOrder] = useState(null);

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const [loadedOrders, loadedCustomers, loadedProducts, loadedPayments] = await Promise.all([
          ordersService.loadOrders(),
          customers.length === 0 ? customersService.loadCustomers() : Promise.resolve(null),
          products.length === 0 ? productsService.loadProducts() : Promise.resolve(null),
          paymentsService.loadPayments(),
        ]);
        dispatch(setOrders(loadedOrders));
        if (loadedCustomers) dispatch(setCustomers(loadedCustomers));
        if (loadedProducts) dispatch(setProducts(loadedProducts));
        if (loadedPayments) dispatch(setPayments(loadedPayments));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }
    load();
  }, [dispatch]);

  const pendingOrders = ordersService.getOrdersPendingDelivery(orders, null);
  const readyOrders = ordersService.getOrdersReadyForDelivery(orders, null);
  const deliveredOrders = ordersService.getOrdersDelivered(
    orders,
    deliveredFilterMode === 'date' ? deliveryDate : null
  );
  const selectedCustomer = selectedOrder ? customers.find((c) => c.id === selectedOrder.customerId) : null;

  const handleMarkReady = async (orderId) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const updated = await ordersService.markOrderReady(orderId, orders);
      dispatch(updateOrderInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelivered = async (options) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const currentCash = await cashService.loadCurrentBalance();
      const result = await ordersService.markOrderDelivered(
        selectedOrder.id,
        orders,
        options,
        payments,
        typeof currentCash === 'number' ? currentCash : (currentCash?.amount ?? 0)
      );
      dispatch(updateOrderInState(result.order));
      if (result.payment) dispatch(addPayment(result.payment));
      if (result.newCashBalance != null) {
        dispatch(setCashBalance({
          amount: result.newCashBalance,
          lastUpdated: new Date().toISOString(),
        }));
      }
      setSelectedOrder(null);
    } catch (err) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('deliveries')}</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}
        <DeliveryScreen
          order={selectedOrder}
          customer={selectedCustomer}
          products={products}
          onDelivered={handleDelivered}
          onBack={() => setSelectedOrder(null)}
          isLoading={isLoading}
          userId={user?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('deliveries')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab(TABS.PENDING)}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === TABS.PENDING
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('pending')} ({pendingOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TABS.READY)}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === TABS.READY
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('ready')} ({readyOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TABS.DELIVERED)}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === TABS.DELIVERED
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('delivered')} ({deliveredOrders.length})
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === TABS.PENDING && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('markOrdersReady') || 'Mark orders ready'}</h2>
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500">{t('noPendingOrders') || 'No pending orders.'}</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingOrders.map((order) => {
                  const customer = customers.find((c) => c.id === order.customerId);
                  return (
                    <li key={order.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t('order')} #{order.orderNumber} – {customer?.name ?? order.customerId}
                        </p>
                        <p className="text-sm text-gray-500">Rs. {(order.totalAmount || 0).toLocaleString()}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkReady(order.id)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
                      >
                        {t('markReady')}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {activeTab === TABS.READY && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('deliveryList') || 'Delivery list'}</h2>
            {readyOrders.length === 0 ? (
              <p className="text-gray-500">{t('noReadyOrders') || 'No orders ready for delivery.'}</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {readyOrders.map((order) => {
                  const customer = customers.find((c) => c.id === order.customerId);
                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="w-full py-3 text-left flex items-center justify-between gap-4 hover:bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {t('order')} #{order.orderNumber} – {customer?.name ?? order.customerId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer?.address?.slice(0, 50)}
                            {customer?.address?.length > 50 ? '…' : ''}
                          </p>
                        </div>
                        <span className="text-blue-600 text-sm font-medium">{t('deliver') || 'Deliver'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {activeTab === TABS.DELIVERED && (
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('deliveredOrders') || 'Delivered orders'}</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveredFilter"
                      checked={deliveredFilterMode === 'date'}
                      onChange={() => setDeliveredFilterMode('date')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('filterByDate') || 'Filter by date'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveredFilter"
                      checked={deliveredFilterMode === 'all'}
                      onChange={() => setDeliveredFilterMode('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('showAll') || 'Show all'}</span>
                  </label>
                </div>
                {deliveredFilterMode === 'date' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">{t('deliveryDate')}:</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
            {deliveredOrders.length === 0 ? (
              <p className="text-gray-500">
                {deliveredFilterMode === 'date'
                  ? (t('noDeliveredOrders') || 'No delivered orders for this date.')
                  : (t('noDeliveredOrdersAll') || 'No delivered orders.')}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {deliveredOrders.map((order) => {
                  const cust = customers.find((c) => c.id === order.customerId);
                  return (
                    <li key={order.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t('order')} #{order.orderNumber} – {cust?.name ?? order.customerId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Rs. {(order.totalAmount || 0).toLocaleString()}
                          {order.deliveredAt && (
                            <> · {new Date(order.deliveredAt).toLocaleDateString()} {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingDeliveredOrder(order)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title={t('viewDetails') || 'View details'}
                        aria-label={t('viewDetails') || 'View details'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {viewingDeliveredOrder && (
        <DeliveredOrderDetails
          order={viewingDeliveredOrder}
          customer={customers.find((c) => c.id === viewingDeliveredOrder.customerId)}
          products={products}
          onClose={() => setViewingDeliveredOrder(null)}
        />
      )}
    </div>
  );
}
