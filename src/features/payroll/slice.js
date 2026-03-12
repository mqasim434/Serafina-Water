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
      const payload = action.payload;
      state.employees = state.employees.map((e) =>
        e.id === payload.id ? { ...e, ...payload } : e
      );
      state.error = null;
    },
    removeEmployee: (state, action) => {
      state.employees = state.employees.filter((e) => e.id !== action.payload);
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
    },
  },
});

export const {
  setLoading,
  setEmployees,
  setPayments,
  addEmployee,
  updateEmployeeInState,
  removeEmployee,
  addPayment,
  setPaymentsFull,
  setError,
} = payrollSlice.actions;

export { payrollService };
export default payrollSlice.reducer;
