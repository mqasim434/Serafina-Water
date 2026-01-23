/**
 * Expenses Page
 * 
 * Main page for expense management
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { ExpenseForm } from '../features/expenses/components/ExpenseForm.jsx';
import { ExpenseList } from '../features/expenses/components/ExpenseList.jsx';
import {
  setLoading,
  setExpenses,
  addExpense,
  removeExpense,
  setError,
} from '../features/expenses/slice.js';
import { expensesService } from '../features/expenses/slice.js';
import * as cashService from '../features/cash/service.js';
import { setCashBalance } from '../features/orders/slice.js';

const TABS = {
  LIST: 'list',
  ADD: 'add',
};

export function Expenses() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: expenses, isLoading, error } = useSelector(
    (state) => state.expenses
  );
  const { cashBalance } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState(TABS.LIST);
  const [availableCash, setAvailableCash] = useState(0);

  // Load expenses and categories on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const loadedExpenses = await expensesService.loadExpenses();
        dispatch(setExpenses(loadedExpenses));

        // Load available cash
        const currentBalance = await cashService.loadCurrentBalance();
        setAvailableCash(currentBalance);
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
  }, [dispatch]);

  const handleAddExpense = () => {
    setActiveTab(TABS.ADD);
  };

  const handleFormSubmit = async (title, description, amount, date) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const result = await expensesService.createExpense(
        {
          title,
          description,
          amount,
          date,
        },
        expenses,
        availableCash,
        user?.id || null
      );

      dispatch(addExpense(result.expense));
      setAvailableCash(result.newCashBalance);
      dispatch(setCashBalance({ amount: result.newCashBalance, lastUpdated: new Date().toISOString() }));
      setActiveTab(TABS.LIST);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    dispatch(setLoading(true));
    try {
      const result = await expensesService.deleteExpense(expenseId, expenses, availableCash);
      dispatch(removeExpense(expenseId));
      setAvailableCash(result.newCashBalance);
      dispatch(setCashBalance({ amount: result.newCashBalance, lastUpdated: new Date().toISOString() }));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const totalExpenses = expensesService.calculateTotalExpenses(expenses);

  if (isLoading && expenses.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('expenseManagement')}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab(TABS.LIST)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === TABS.LIST
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('expenseHistory') || 'Expense History'}
          </button>
          <button
            onClick={() => setActiveTab(TABS.ADD)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === TABS.ADD
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('addExpense')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === TABS.LIST && <ExpenseList onDelete={handleDeleteExpense} />}

        {activeTab === TABS.ADD && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('newExpense')}</h2>
            <ExpenseForm
              onSubmit={handleFormSubmit}
              onCancel={() => setActiveTab(TABS.LIST)}
              isLoading={isLoading}
              availableCash={availableCash}
            />
          </div>
        )}
      </div>
    </div>
  );
}
