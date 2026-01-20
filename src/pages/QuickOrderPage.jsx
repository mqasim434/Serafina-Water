/**
 * Quick Order Page
 * 
 * Fast order creation flow: Select customer -> Enter quantity -> Confirm
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import {
  setLoading,
  setOrders,
  addOrder,
  setCashBalance,
  setError,
} from '../features/orders/slice.js';
import { ordersService } from '../features/orders/slice.js';
import { addTransaction } from '../features/bottles/slice.js';
import { bottlesService } from '../features/bottles/slice.js';
import { setCustomers } from '../features/customers/slice.js';
import { customersService } from '../features/customers/slice.js';
import { ReceiptTemplate } from '../features/receipts/components/ReceiptTemplate.jsx';
import {
  generateReceiptData,
  printReceipt,
  shareReceiptViaWhatsApp,
} from '../features/receipts/service.js';

export function QuickOrderPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: customers } = useSelector((state) => state.customers);
  const { transactions } = useSelector((state) => state.bottles);
  const { items: orders, cashBalance, isLoading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1); // 1: Select customer, 2: Enter quantity, 3: Confirm
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [bottleSize, setBottleSize] = useState('19L');
  const [quantity, setQuantity] = useState('');
  const [pricePerBottle, setPricePerBottle] = useState(0);
  const [notes, setNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [lastOrderCustomerId, setLastOrderCustomerId] = useState(null);

  // Load orders, cash balance, and customers on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const loadPromises = [
          ordersService.loadOrders(),
          ordersService.loadCashBalance(),
        ];
        
        // Load customers if not already loaded
        if (customers.length === 0) {
          loadPromises.push(customersService.loadCustomers());
        } else {
          loadPromises.push(Promise.resolve(null));
        }
        
        const [loadedOrders, loadedCashBalance, loadedCustomers] = await Promise.all(loadPromises);
        
        dispatch(setOrders(loadedOrders));
        dispatch(setCashBalance(loadedCashBalance));
        
        // Only update customers if we loaded them
        if (loadedCustomers !== null) {
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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  
  // Update price when customer or bottle size changes
  useEffect(() => {
    if (selectedCustomer && bottleSize) {
      const priceMap = {
        '19L': selectedCustomer.bottlePrices?.price19L || 0,
        '6L': selectedCustomer.bottlePrices?.price6L || 0,
        '1.5L': selectedCustomer.bottlePrices?.price1_5L || 0,
        '500ml': selectedCustomer.bottlePrices?.price500ml || 0,
      };
      setPricePerBottle(priceMap[bottleSize] || 0);
    }
  }, [selectedCustomer, bottleSize]);
  
  const totalAmount = quantity
    ? ordersService.calculateOrderTotal(parseInt(quantity, 10) || 0, pricePerBottle)
    : 0;

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    setBottleSize('19L'); // Reset to default
    setQuantity('');
    setStep(2);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseInt(value, 10) > 0)) {
      setQuantity(value);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      if (!quantity || parseInt(quantity, 10) <= 0) {
        dispatch(setError('Please enter a valid quantity'));
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setQuantity('');
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCustomerId || !quantity || parseInt(quantity, 10) <= 0) {
      dispatch(setError('Please complete all fields'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const result = await ordersService.createOrder(
        {
          customerId: selectedCustomerId,
          bottleSize,
          quantity: parseInt(quantity, 10),
          pricePerBottle,
          notes,
        },
        orders,
        cashBalance,
        transactions,
        user?.id || null
      );

      // Update Redux state
      dispatch(addOrder(result.order));
      dispatch(addTransaction(result.bottleTransaction));
      dispatch(setCashBalance(result.newCashBalance));

      // Generate receipt data
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const receipt = generateReceiptData(result.order, customer);
      setReceiptData(receipt);
      setLastOrderCustomerId(selectedCustomerId);
      setShowReceipt(true);

      // Reset form
      setSelectedCustomerId('');
      setBottleSize('19L');
      setQuantity('');
      setPricePerBottle(0);
      setNotes('');
      setStep(1);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isLoading && orders.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('newOrder')}</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <p className="text-sm text-green-800">
            <span className="font-medium">{t('cashOnHand')}:</span> Rs. {cashBalance.amount.toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Step 1: Select Customer */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('selectCustomer')}</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noCustomers')}</p>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
                      </div>
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Enter Quantity */}
        {step === 2 && (
          <div>
            <div className="mb-4 pb-4 border-b border-gray-200">
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← {t('back')}
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mt-2">
                {selectedCustomer?.name}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="bottleSize" className="block text-sm font-medium text-gray-700">
                  {t('bottleSize')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="bottleSize"
                  value={bottleSize}
                  onChange={(e) => setBottleSize(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="19L">19L</option>
                  <option value="6L">6L</option>
                  <option value="1.5L">1.5L</option>
                  <option value="500ml">500ml</option>
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  {t('quantity')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('enterQuantity')}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="pricePerBottle" className="block text-sm font-medium text-gray-700">
                  {t('pricePerBottle')} (Rs.)
                </label>
                <input
                  type="number"
                  id="pricePerBottle"
                  min="0"
                  step="0.01"
                  value={pricePerBottle}
                  onChange={(e) => setPricePerBottle(parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                  readOnly={!!selectedCustomer}
                />
                {selectedCustomer && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('priceFromCustomerProfile')}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  {t('notes')}
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('notes')}
                />
              </div>

              {quantity && parseInt(quantity, 10) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{t('totalAmount')}:</span> Rs.{' '}
                    {totalAmount.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!quantity || parseInt(quantity, 10) <= 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Order */}
        {step === 3 && (
          <div>
            <div className="mb-4 pb-4 border-b border-gray-200">
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← {t('back')}
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mt-2">{t('orderSummary')}</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('customer')}:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedCustomer?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('bottleSize')}:</span>
                  <span className="text-sm font-medium text-gray-900">{bottleSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('quantity')}:</span>
                  <span className="text-sm font-medium text-gray-900">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('pricePerBottle')}:</span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {pricePerBottle.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('paymentMethod')}:</span>
                  <span className="text-sm font-medium text-gray-900">{t('cash')}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">{t('totalAmount')}:</span>
                  <span className="text-base font-bold text-blue-600">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('notes')}:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? t('loading') : t('confirmOrder')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{t('receipt')}</h2>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ReceiptTemplate
                receiptData={receiptData}
                id="receipt-print"
                showActions={true}
                onPrint={() => printReceipt('receipt-print')}
                onShare={() => {
                  const customer = customers.find((c) => c.id === lastOrderCustomerId);
                  shareReceiptViaWhatsApp(receiptData, customer?.phone);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
