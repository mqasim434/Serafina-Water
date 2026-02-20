/**
 * Deliveries Page
 * Pending tab: mark orders Ready. Ready tab: driver delivery list → Delivery Screen (payment + photo → Mark Delivered).
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { DeliveryScreen } from '../features/delivery/components/DeliveryScreen.jsx';
import { DeliveredOrderDetails } from '../features/delivery/components/DeliveredOrderDetails.jsx';
import { openWhatsAppWithOrderSummary } from '../features/delivery/whatsapp.js';
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

  const handleMarkPending = async (e, orderId) => {
    e.stopPropagation();
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const updated = await ordersService.markOrderPending(orderId, orders);
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
      await openWhatsAppWithOrderSummary(
        selectedOrder,
        selectedCustomer,
        products,
        options.amountPaid ?? 0,
        selectedOrder.outstandingAmount ?? 0,
        options.deliveryProofPhotoUrl ?? result.order?.deliveryProofPhotoUrl
      );
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

  const PendingLane = () => (
    <div className="flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
        <span>{t('pending')}</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
      </h3>
      {pendingOrders.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">{t('noPendingOrders') || 'No pending orders.'}</p>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
          {pendingOrders.map((order) => {
            const customer = customers.find((c) => c.id === order.customerId);
            return (
              <li key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow">
                <p className="font-medium text-gray-900 text-sm">
                  {t('order')} #{order.orderNumber} – {customer?.name ?? order.customerId}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Rs. {(order.totalAmount || 0).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => handleMarkReady(order.id)}
                  disabled={isLoading}
                  className="mt-2 w-full px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  {t('markReady')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const ReadyLane = () => (
    <div className="flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
        <span>{t('ready')}</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{readyOrders.length}</span>
      </h3>
      {readyOrders.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">{t('noReadyOrders') || 'No orders ready for delivery.'}</p>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
          {readyOrders.map((order) => {
            const customer = customers.find((c) => c.id === order.customerId);
            return (
              <li key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left"
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {t('order')} #{order.orderNumber} – {customer?.name ?? order.customerId}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {customer?.address?.slice(0, 60)}
                    {customer?.address?.length > 60 ? '…' : ''}
                  </p>
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleMarkPending(e, order.id)}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 disabled:opacity-50"
                  >
                    {t('markPending')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                  >
                    {t('deliver')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const DeliveredLane = () => (
    <div className="flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
        <span>{t('delivered')}</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
      </h3>
      <div className="mb-2 flex flex-wrap gap-2">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="deliveredFilter"
            checked={deliveredFilterMode === 'date'}
            onChange={() => setDeliveredFilterMode('date')}
            className="text-blue-600 focus:ring-blue-500 text-xs"
          />
          <span className="text-xs text-gray-700">{t('filterByDate')}</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="deliveredFilter"
            checked={deliveredFilterMode === 'all'}
            onChange={() => setDeliveredFilterMode('all')}
            className="text-blue-600 focus:ring-blue-500 text-xs"
          />
          <span className="text-xs text-gray-700">{t('showAll')}</span>
        </label>
      </div>
      {deliveredFilterMode === 'date' && (
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="mb-2 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
        />
      )}
      {deliveredOrders.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          {deliveredFilterMode === 'date' ? (t('noDeliveredOrders') || 'No delivered orders for this date.') : (t('noDeliveredOrdersAll') || 'No delivered orders.')}
        </p>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-auto max-h-[50vh]">
          {deliveredOrders.map((order) => {
            const cust = customers.find((c) => c.id === order.customerId);
            return (
              <li key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {t('order')} #{order.orderNumber} – {cust?.name ?? order.customerId}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Rs. {(order.totalAmount || 0).toLocaleString()}
                      {order.deliveredAt && (
                        <> · {new Date(order.deliveredAt).toLocaleDateString()} {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingDeliveredOrder(order)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded shrink-0"
                    title={t('viewDetails')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('deliveries')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {/* Mobile: Tabs layout */}
      <div className="lg:hidden">
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab(TABS.PENDING)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === TABS.PENDING ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('pending')} ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TABS.READY)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === TABS.READY ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('ready')} ({readyOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TABS.DELIVERED)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === TABS.DELIVERED ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('delivered')} ({deliveredOrders.length})
            </button>
          </nav>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          {activeTab === TABS.PENDING && <PendingLane />}
          {activeTab === TABS.READY && <ReadyLane />}
          {activeTab === TABS.DELIVERED && <DeliveredLane />}
        </div>
      </div>

      {/* Desktop: Swim lanes (Jira-style board) */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="grid grid-cols-3 gap-4 min-w-[900px]">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <PendingLane />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ReadyLane />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <DeliveredLane />
          </div>
        </div>
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
