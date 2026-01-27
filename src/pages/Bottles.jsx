/**
 * Bottles Page
 * 
 * Main page with Orders and Returns tabs
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OrderForm } from '../features/orders/components/OrderForm.jsx';
import { ReturnForm } from '../features/bottles/components/ReturnForm.jsx';
// import { ReceiptTemplate } from '../features/receipts/components/ReceiptTemplate.jsx'; // TEMPORARILY DISABLED
import { BottleSummary } from '../features/bottles/components/BottleSummary.jsx';
import { CustomerBottleBalance } from '../features/bottles/components/CustomerBottleBalance.jsx';
import { TransactionHistory } from '../features/bottles/components/TransactionHistory.jsx';
import { CustomersWithOutstandingBottles } from '../features/bottles/components/CustomersWithOutstandingBottles.jsx';
import { CustomerSearch } from '../features/customers/components/CustomerSearch.jsx';
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
import * as cashService from '../features/cash/service.js';
import * as receiptsService from '../features/receipts/service.js';
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
        user?.id || null
      );

      // Update Redux state
      dispatch(addOrder(result.order));
      dispatch(addTransaction(result.bottleTransaction));
      if (result.payment) {
        dispatch(addPayment(result.payment));
      }
      dispatch(setCashBalance(result.newCashBalance));

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

  // Handle return submission
  const handleReturnSubmit = async (customerId, quantity, notes) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      // Validate that customer has enough returnable bottles
      const maxReturnable = getMaxReturnable(customerId);
      if (maxReturnable !== undefined && quantity > maxReturnable) {
        dispatch(setError(`Cannot return ${quantity} bottles. Customer only has ${maxReturnable} returnable bottles outstanding.`));
        dispatch(setLoading(false));
        return;
      }

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

  const getMaxReturnable = (customerId) => {
    if (!customerId) return undefined;
    // Use calculateOutstandingReturnable to only count returnable products
    return bottlesService.calculateOutstandingReturnable(
      customerId,
      transactions,
      orders,
      products
    );
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
              setSelectedCustomerId(''); // Reset selection when switching tabs
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
              setSelectedCustomerId(''); // Reset selection when switching tabs
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

      {/* Orders Tab */}
      {activeTab === TABS.ORDERS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('placeOrder')}</h2>

            <div className="mb-4">
              <CustomerSearch
                customers={customers}
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
      )}

      {/* Returns Tab */}
      {activeTab === TABS.RETURNS && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('returnBottles')}</h2>

              <div className="mb-4">
                <CustomerSearch
                  customers={customers}
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  required={true}
                  placeholder={t('search') + ' ' + t('customer').toLowerCase() + '...'}
                  filter={(customer) => {
                    // Only show customers who have orders with returnable products
                    const customerOrders = orders.filter((o) => o.customerId === customer.id);
                    if (customerOrders.length === 0) return false;
                    
                    // Check if any order has a returnable product
                    return customerOrders.some((order) => {
                      const product = products.find((p) => p.id === order.productId);
                      return product && product.isReturnable !== false; // Default to true if not set
                    });
                  }}
                />
              </div>

              {selectedCustomerId && (
                <ReturnForm
                  customerId={selectedCustomerId}
                  maxReturnable={getMaxReturnable(selectedCustomerId)}
                  onSubmit={handleReturnSubmit}
                  onCancel={() => {
                    setSelectedCustomerId('');
                  }}
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

          {/* Customers with Outstanding Bottles */}
          {!selectedCustomerId && (
            <CustomersWithOutstandingBottles
              onSelectCustomer={(customerId) => {
                setSelectedCustomerId(customerId);
              }}
            />
          )}
        </div>
      )}

      {/* Summary Section */}
      {activeTab === TABS.ORDERS && !selectedCustomerId && (
        <BottleSummary />
      )}
    </div>
  );
}
