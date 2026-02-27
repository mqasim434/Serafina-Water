/**
 * Return Bottles Page
 *
 * Page for recording bottle returns from customers
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ReturnForm } from '../features/bottles/components/ReturnForm.jsx';
import { CustomerBottleBalance } from '../features/bottles/components/CustomerBottleBalance.jsx';
import TransactionHistory from '../features/bottles/components/TransactionHistory.jsx';
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
import { setOrders } from '../features/orders/slice.js';
import { ordersService } from '../features/orders/slice.js';
import { setPayments } from '../features/payments/slice.js';
import { paymentsService } from '../features/payments/slice.js';
import { updateProductInState } from '../features/products/slice.js';
import { useTranslation } from '../shared/hooks/useTranslation.js';

export function ReturnBottles() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { transactions, isLoading, error } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: products } = useSelector((state) => state.products);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { user } = useSelector((state) => state.auth);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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
          orders.length === 0 ? ordersService.loadOrders() : Promise.resolve(null),
          paymentsService.loadPayments(),
        ]);

        dispatch(setTransactions(loadedTransactions));
        if (loadedCustomers) dispatch(setCustomers(loadedCustomers));
        if (loadedProducts) dispatch(setProducts(loadedProducts));
        if (loadedOrders) dispatch(setOrders(loadedOrders));
        if (loadedPayments) dispatch(setPayments(loadedPayments));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleReturnSubmit = async (customerId, items, notes) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const maxReturnable = getMaxReturnable(customerId);
      const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
      if (maxReturnable !== undefined && totalQuantity > maxReturnable) {
        dispatch(setError(`Cannot return ${totalQuantity} bottles. Customer only has ${maxReturnable} returnable bottles outstanding.`));
        dispatch(setLoading(false));
        return;
      }

      // Group by productId to create one transaction per product (combines duplicate product lines)
      const grouped = items.reduce((acc, it) => {
        const key = it.productId;
        if (!acc[key]) acc[key] = { productId: it.productId, quantity: 0 };
        acc[key].quantity += it.quantity;
        return acc;
      }, {});
      const itemsToProcess = Object.values(grouped);

      let currentTransactions = [...transactions];
      for (const item of itemsToProcess) {
        const newTransaction = await bottlesService.createTransaction(
          customerId,
          'returned',
          item.quantity,
          notes,
          user?.id || null,
          currentTransactions,
          item.productId || undefined
        );
        currentTransactions = [...currentTransactions, newTransaction];
        dispatch(addTransaction(newTransaction));

        if (item.productId) {
          const updatedProduct = await productsService.increaseStockForReturn(item.productId, item.quantity, products);
          dispatch(updateProductInState(updatedProduct));
        }
      }
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getMaxReturnable = (customerId) => {
    if (!customerId) return undefined;
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('returnBottles')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('returnBottles')}</h2>

            <div className="mb-4">
              <CustomerSearch
                customers={customersService.getActiveCustomers(customers)}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                required={true}
                placeholder={t('search') + ' ' + t('customer').toLowerCase() + '...'}
                filter={(customer) => {
                  const customerOrders = orders.filter((o) => o.customerId === customer.id);
                  if (customerOrders.length === 0) return false;
                  return customerOrders.some((order) => {
                    const lineItems = ordersService.getOrderLineItems(order);
                    return lineItems.some((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return product && product.isReturnable !== false;
                    });
                  });
                }}
              />
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
                <CustomerBottleBalance customerId={selectedCustomerId} headingKey="productBalance" />
                <div className="mt-6">
                  <TransactionHistory customerId={selectedCustomerId} />
                </div>
              </>
            )}
          </div>
        </div>

        {!selectedCustomerId && (
          <CustomersWithOutstandingBottles
            onSelectCustomer={(customerId) => setSelectedCustomerId(customerId)}
          />
        )}
      </div>
    </div>
  );
}
