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
import { CategoryManager } from '../features/expenses/components/CategoryManager.jsx';
import {
  setLoading,
  setExpenses,
  addExpense,
  removeExpense,
  setCategories,
  addCategory,
  updateCategoryInState,
  removeCategory,
  setError,
} from '../features/expenses/slice.js';
import { expensesService } from '../features/expenses/slice.js';
import * as cashService from '../features/cash/service.js';
import { setCashBalance } from '../features/orders/slice.js';

const VIEW_MODES = {
  LIST: 'list',
  ADD: 'add',
  CATEGORIES: 'categories',
};

export function Expenses() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: expenses, categories, isLoading, error } = useSelector(
    (state) => state.expenses
  );
  const { cashBalance } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [availableCash, setAvailableCash] = useState(0);

  // Load expenses and categories on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const [loadedExpenses, loadedCategories] = await Promise.all([
          expensesService.loadExpenses(),
          expensesService.loadCategories(),
        ]);
        dispatch(setExpenses(loadedExpenses));
        dispatch(setCategories(loadedCategories));

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
    setViewMode(VIEW_MODES.ADD);
  };

  const handleFormSubmit = async (category, amount, description) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const result = await expensesService.createExpense(
        {
          category,
          amount,
          description,
        },
        expenses,
        availableCash,
        user?.id || null
      );

      dispatch(addExpense(result.expense));
      setAvailableCash(result.newCashBalance);
      dispatch(setCashBalance({ amount: result.newCashBalance, lastUpdated: new Date().toISOString() }));
      setViewMode(VIEW_MODES.LIST);
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

  const handleCreateCategory = async (name, description) => {
    dispatch(setLoading(true));
    try {
      const newCategory = await expensesService.createCategory(name, description, categories);
      dispatch(addCategory(newCategory));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateCategory = async (categoryId, name, description) => {
    dispatch(setLoading(true));
    try {
      const updated = await expensesService.updateCategory(
        categoryId,
        name,
        description,
        categories
      );
      dispatch(updateCategoryInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    dispatch(setLoading(true));
    try {
      await expensesService.deleteCategory(categoryId, categories, expenses);
      dispatch(removeCategory(categoryId));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const totalExpenses = expensesService.calculateTotalExpenses(expenses);

  if (isLoading && expenses.length === 0 && categories.length === 0) {
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
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(VIEW_MODES.CATEGORIES)}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            {t('categories')}
          </button>
          <button
            onClick={handleAddExpense}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            {t('addExpense')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('totalExpensesAmount')}:</span>
              <span className="text-lg font-bold text-red-600">
                Rs. {totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('cashOnHand')}:</span>
              <span className="text-lg font-bold text-green-600">
                Rs. {availableCash.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {viewMode === VIEW_MODES.LIST && <ExpenseList onDelete={handleDeleteExpense} />}

          {viewMode === VIEW_MODES.ADD && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('newExpense')}</h2>
              <ExpenseForm
                onSubmit={handleFormSubmit}
                onCancel={() => setViewMode(VIEW_MODES.LIST)}
                isLoading={isLoading}
                availableCash={availableCash}
              />
            </div>
          )}

          {viewMode === VIEW_MODES.CATEGORIES && (
            <CategoryManager
              onCreate={handleCreateCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
