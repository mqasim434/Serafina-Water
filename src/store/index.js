/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice.js';
import i18nReducer from '../features/i18n/slice.js';
import usersReducer from '../features/users/slice.js';
import productsReducer from '../features/products/slice.js';
import customersReducer from '../features/customers/slice.js';
import bottlesReducer from '../features/bottles/slice.js';
import ordersReducer from '../features/orders/slice.js';
import paymentsReducer from '../features/payments/slice.js';
import expensesReducer from '../features/expenses/slice.js';
import settingsReducer from '../features/settings/slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    i18n: i18nReducer,
    users: usersReducer,
    products: productsReducer,
    customers: customersReducer,
    bottles: bottlesReducer,
    orders: ordersReducer,
    payments: paymentsReducer,
    expenses: expensesReducer,
    settings: settingsReducer,
  },
});

export default store;
