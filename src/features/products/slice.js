/**
 * Products Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as productsService from './service.js';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  selectedId: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setProducts: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addProduct: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    updateProductInState: (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      state.error = null;
    },
    removeProduct: (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          isActive: false,
        };
      }
      state.error = null;
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSelectedId: (state, action) => {
      state.selectedId = action.payload;
    },
  },
});

export const {
  setLoading,
  setProducts,
  addProduct,
  updateProductInState,
  removeProduct,
  setError,
  setSelectedId,
} = productsSlice.actions;

// Export service functions for use in thunks/components
export { productsService };

export default productsSlice.reducer;
