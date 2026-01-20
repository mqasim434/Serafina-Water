/**
 * Expenses Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as expensesService from './service.js';

const initialState = {
  items: [],
  categories: [],
  isLoading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setExpenses: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addExpense: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    removeExpense: (state, action) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
      state.error = null;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
      state.error = null;
    },
    addCategory: (state, action) => {
      state.categories.push(action.payload);
      state.error = null;
    },
    updateCategoryInState: (state, action) => {
      const index = state.categories.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
      state.error = null;
    },
    removeCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setExpenses,
  addExpense,
  removeExpense,
  setCategories,
  addCategory,
  updateCategoryInState,
  removeCategory,
  setError,
} = expensesSlice.actions;

// Export service functions for use in thunks/components
export { expensesService };

export default expensesSlice.reducer;
