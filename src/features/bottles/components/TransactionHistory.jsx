/**
 * Transaction History Component
 *
 * Displays list of bottle transactions. When customerId is provided (e.g. Place Orders),
 * shows only today's transactions by default, with a button to open "All transactions"
 * view with date range filter. Each transaction is expandable to show details.
 */

import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { bottlesService } from '../slice.js';
import * as cashService from '../../cash/service.js';

/**
 * Transaction History props
 * @typedef {Object} TransactionHistoryProps
 * @property {string} [customerId] - Optional customer ID to filter transactions
 */

/**
 * Single transaction row (expandable)
 */
function TransactionRow({ transaction, getCustomerName, getUserName, products, isExpanded, onToggle }) {
  const { t } = useTranslation();
  const product = transaction.productId && products?.length
    ? products.find((p) => p.id === transaction.productId)
    : null;
  const dateStr = new Date(transaction.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 sm:p-4 hover:bg-gray-50 text-left flex items-center justify-between gap-2"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          {getCustomerName && (
            <p className="text-sm font-medium text-gray-900">
              {getCustomerName(transaction.customerId)}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                transaction.type === 'issued'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {transaction.type === 'issued' ? t('issued') : t('returned')}
            </span>
            <span className="text-sm text-gray-600">
              {transaction.quantity} {t('bottles')}
            </span>
            <span className="text-sm text-gray-500">{dateStr}</span>
          </div>
          {transaction.notes && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">{transaction.notes}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 bg-gray-50/80 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {t('transactionDetails')}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {/* Bottle / Product details */}
            <div className="sm:col-span-2">
              <dt className="text-gray-500 mb-1">{t('bottleDetails')}</dt>
              <dd className="text-gray-900 space-y-0.5">
                {product ? (
                  <>
                    <div>
                      <span className="text-gray-500">{t('product')}:</span>{' '}
                      {product.name}
                      {product.size ? ` (${t('size')}: ${product.size})` : ''}
                    </div>
                    <div>
                      <span className="text-gray-500">{t('quantity')}:</span>{' '}
                      {transaction.quantity} {t('bottles')}
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-gray-500">{t('quantity')}:</span>{' '}
                    {transaction.quantity} {t('bottles')}
                    {transaction.productId && (
                      <span className="text-gray-400 ml-1 font-mono text-xs">
                        (ID: {transaction.productId})
                      </span>
                    )}
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('transactionId')}</dt>
              <dd className="font-mono text-gray-900 truncate" title={transaction.id}>
                {transaction.id}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('transactionType')}</dt>
              <dd className="text-gray-900">
                {transaction.type === 'issued' ? t('issued') : t('returned')}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('transactionDate')}</dt>
              <dd className="text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</dd>
            </div>
            {transaction.notes && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="text-gray-900">{transaction.notes}</dd>
              </div>
            )}
            {transaction.createdBy && (
              <div>
                <dt className="text-gray-500">{t('createdBy')}</dt>
                <dd className="text-gray-900">
                  {getUserName ? getUserName(transaction.createdBy) : transaction.createdBy}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

/**
 * Transaction History component
 * @param {TransactionHistoryProps} props
 */
export function TransactionHistory({ customerId }) {
  const { t } = useTranslation();
  const { transactions } = useSelector((state) => state.bottles);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: products } = useSelector((state) => state.products);
  const { items: users } = useSelector((state) => state.users);
  const [expandedId, setExpandedId] = useState(null);
  const [showAllView, setShowAllView] = useState(false);
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return cashService.formatDate(d);
  });
  const [rangeEnd, setRangeEnd] = useState(cashService.getTodayDate());

  const today = cashService.getTodayDate();

  const allForCustomer = useMemo(() => {
    if (!customerId) return [];
    return bottlesService.getCustomerTransactions(customerId, transactions);
  }, [customerId, transactions]);

  const todayTransactions = useMemo(() => {
    if (!customerId) return [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return allForCustomer.filter((t) => cashService.formatDate(new Date(t.createdAt)) === today);
  }, [customerId, transactions, allForCustomer, today]);

  const allFilteredByRange = useMemo(() => {
    if (!showAllView || !customerId) return [];
    return allForCustomer.filter((tx) => {
      const d = cashService.formatDate(new Date(tx.createdAt));
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [showAllView, customerId, allForCustomer, rangeStart, rangeEnd]);

  const displayTransactions = showAllView ? allFilteredByRange : todayTransactions;
  const isTodayView = !showAllView;

  const getCustomerName = (id) => {
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : 'Unknown';
  };

  const getUserName = (id) => {
    const user = users?.find((u) => u.id === id);
    if (!user) return id;
    const name = user.displayName || user.username;
    return name || (user.role ? t(user.role) : id);
  };

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // When no customer selected, show all transactions (no "today only" mode)
  const showTodayOnlyHint = customerId && isTodayView;
  const showAllButton = customerId && isTodayView;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {showAllView ? t('allTransactions') : t('transactionHistory')}
            {showTodayOnlyHint && (
              <span className="ml-2 text-sm font-normal text-gray-500">— {today}</span>
            )}
          </h2>
          {showAllView ? (
            <button
              type="button"
              onClick={() => setShowAllView(false)}
              className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {t('closeAllTransactions')}
            </button>
          ) : (
            showAllButton && (
              <button
                type="button"
                onClick={() => setShowAllView(true)}
                className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
              >
                {t('showAllTransactions')}
              </button>
            )
          )}
        </div>

        {showAllView && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-gray-700">{t('dateRange')}</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label htmlFor="tx-start" className="block text-xs text-gray-500 mb-1">
                  {t('startDate')}
                </label>
                <input
                  id="tx-start"
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="block w-full sm:w-auto min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label htmlFor="tx-end" className="block text-xs text-gray-500 mb-1">
                  {t('endDate')}
                </label>
                <input
                  id="tx-end"
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="block w-full sm:w-auto min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {displayTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {showAllView ? t('noTransactions') : (customerId ? t('noTransactionsToday') : t('noTransactions'))}
          </div>
        ) : (
          displayTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              getCustomerName={customerId ? null : getCustomerName}
              getUserName={getUserName}
              products={products}
              isExpanded={expandedId === transaction.id}
              onToggle={() => handleToggleExpand(transaction.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
