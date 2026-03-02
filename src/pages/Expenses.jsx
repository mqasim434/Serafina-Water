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
import { setUsers } from '../features/users/slice.js';
import { usersService } from '../features/users/slice.js';
import * as cashService from '../features/cash/service.js';
import { setCashBalance } from '../features/orders/slice.js';

const VIEW_MODES = {
  LIST: 'list',
  ADD: 'add',
};

export function Expenses() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: expenses, isLoading, error } = useSelector(
    (state) => state.expenses
  );
  const { items: users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [availableCash, setAvailableCash] = useState(0);

  // Load expenses, users (for export Created By), and available cash on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const [loadedExpenses, currentBalance, loadedUsers] = await Promise.all([
          expensesService.loadExpenses(),
          cashService.loadCurrentBalance(),
          users.length === 0 ? usersService.loadUsers() : Promise.resolve(null),
        ]);
        dispatch(setExpenses(loadedExpenses));
        setAvailableCash(currentBalance);
        if (loadedUsers) dispatch(setUsers(loadedUsers));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleAddExpense = () => {
    setViewMode(VIEW_MODES.ADD);
  };

  const handleFormSubmit = async (title, description, amount, date, imageUrl = null, imageFileId = null) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const result = await expensesService.createExpense(
        {
          title,
          description,
          amount,
          date,
          imageUrl,
          imageFileId,
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('expenseManagement')}</h1>
        <button
          type="button"
          onClick={handleAddExpense}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {t('addExpense')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {viewMode === VIEW_MODES.LIST && <ExpenseList onDelete={handleDeleteExpense} isLoading={isLoading} />}

      {viewMode === VIEW_MODES.ADD && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('newExpense')}</h2>
          <ExpenseForm
            onSubmit={handleFormSubmit}
            onCancel={() => setViewMode(VIEW_MODES.LIST)}
            isLoading={isLoading}
            availableCash={availableCash}
          />
        </div>
      )}
    </div>
  );
}
