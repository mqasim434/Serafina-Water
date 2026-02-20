/**
 * Payroll Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';
import * as payrollService from './service.js';

const initialState = {
  employees: [],
  payments: [],
  isLoading: false,
  error: null,
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setEmployees: (state, action) => {
      state.employees = action.payload;
      state.error = null;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
    },
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
      state.error = null;
    },
    updateEmployeeInState: (state, action) => {
      const idx = state.employees.findIndex((e) => e.id === action.payload.id);
      if (idx !== -1) state.employees[idx] = action.payload;
      state.error = null;
    },
    addPayment: (state, action) => {
      state.payments.push(action.payload);
    },
    setPaymentsFull: (state, action) => {
      state.payments = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setEmployees,
  setPayments,
  addEmployee,
  updateEmployeeInState,
  addPayment,
  setPaymentsFull,
  setError,
} = payrollSlice.actions;

export { payrollService };
export default payrollSlice.reducer;
