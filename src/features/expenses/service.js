/**
 * Expenses Service
 * 
 * Business logic and calculations for expense management
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';
import * as cashService from '../cash/service.js';

const STORAGE_KEYS = {
  EXPENSES: 'expenses_data',
  CATEGORIES: 'expenses_categories',
};

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Transportation', description: 'Vehicle fuel, maintenance', createdAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Supplies', description: 'Office supplies, materials', createdAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Utilities', description: 'Electricity, water, internet', createdAt: new Date().toISOString() },
  { id: 'cat_4', name: 'Salaries', description: 'Employee salaries', createdAt: new Date().toISOString() },
  { id: 'cat_5', name: 'Other', description: 'Miscellaneous expenses', createdAt: new Date().toISOString() },
];

/**
 * Generate unique ID for expense
 * @returns {string} Unique ID
 */
export function generateExpenseId() {
  return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for category
 * @returns {string} Unique ID
 */
export function generateCategoryId() {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all expenses from storage
 * @returns {Promise<import('./types.js').Expense[]>}
 */
export async function loadExpenses() {
  const expenses = await storageService.getItem(STORAGE_KEYS.EXPENSES);
  return expenses || [];
}

/**
 * Save all expenses to storage
 * @param {import('./types.js').Expense[]} expenses - Array of expenses
 * @returns {Promise<void>}
 */
export async function saveExpenses(expenses) {
  await storageService.setItem(STORAGE_KEYS.EXPENSES, expenses);
}

/**
 * Load all categories from storage
 * @returns {Promise<import('./types.js').ExpenseCategory[]>}
 */
export async function loadCategories() {
  const categories = await storageService.getItem(STORAGE_KEYS.CATEGORIES);
  if (!categories || categories.length === 0) {
    // Initialize with default categories
    await saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return categories;
}

/**
 * Save all categories to storage
 * @param {import('./types.js').ExpenseCategory[]} categories - Array of categories
 * @returns {Promise<void>}
 */
export async function saveCategories(categories) {
  await storageService.setItem(STORAGE_KEYS.CATEGORIES, categories);
}

/**
 * Validate expense data
 * @param {import('./types.js').ExpenseFormData} data - Expense form data
 * @param {number} [availableCash] - Available cash balance
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateExpense(data, availableCash) {
  if (!data.category || data.category.trim() === '') {
    return { isValid: false, error: 'Category is required' };
  }

  if (!data.amount || data.amount <= 0) {
    return { isValid: false, error: 'Expense amount must be greater than 0' };
  }

  if (availableCash !== undefined && data.amount > availableCash) {
    return {
      isValid: false,
      error: `Expense amount cannot exceed available cash of ${availableCash.toLocaleString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Create a new expense and deduct from cash
 * @param {import('./types.js').ExpenseFormData} data - Expense form data
 * @param {import('./types.js').Expense[]} existingExpenses - Existing expenses
 * @param {number} currentCashBalance - Current cash balance
 * @param {string} [createdBy] - User who created the expense
 * @returns {Promise<{expense: import('./types.js').Expense, newCashBalance: number}>} Created expense and new cash balance
 */
export async function createExpense(data, existingExpenses, currentCashBalance, createdBy) {
  const validation = validateExpense(data, currentCashBalance);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const now = new Date().toISOString();
  const newExpense = {
    id: generateExpenseId(),
    category: data.category.trim(),
    amount: data.amount,
    description: data.description?.trim() || '',
    createdAt: now,
    createdBy: createdBy || null,
  };

  // Deduct from cash
  const newCashBalance = await cashService.updateCashBalance(-data.amount, currentCashBalance);

  // Save expense
  const updatedExpenses = [...existingExpenses, newExpense];
  await saveExpenses(updatedExpenses);

  return {
    expense: newExpense,
    newCashBalance,
  };
}

/**
 * Delete an expense and restore cash
 * @param {string} expenseId - Expense ID
 * @param {import('./types.js').Expense[]} existingExpenses - Existing expenses
 * @param {number} currentCashBalance - Current cash balance
 * @returns {Promise<{newCashBalance: number}>} New cash balance
 */
export async function deleteExpense(expenseId, existingExpenses, currentCashBalance) {
  const expense = existingExpenses.find((e) => e.id === expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  // Restore cash
  const newCashBalance = await cashService.updateCashBalance(expense.amount, currentCashBalance);

  // Remove expense
  const updatedExpenses = existingExpenses.filter((e) => e.id !== expenseId);
  await saveExpenses(updatedExpenses);

  return { newCashBalance };
}

/**
 * Create a new category
 * @param {string} name - Category name
 * @param {string} [description] - Optional description
 * @param {import('./types.js').ExpenseCategory[]} existingCategories - Existing categories
 * @returns {Promise<import('./types.js').ExpenseCategory>} Created category
 */
export async function createCategory(name, description, existingCategories) {
  if (!name || name.trim() === '') {
    throw new Error('Category name is required');
  }

  // Check if category already exists
  const existing = existingCategories.find(
    (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  if (existing) {
    throw new Error('Category with this name already exists');
  }

  const now = new Date().toISOString();
  const newCategory = {
    id: generateCategoryId(),
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: now,
  };

  const updatedCategories = [...existingCategories, newCategory];
  await saveCategories(updatedCategories);

  return newCategory;
}

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {string} name - New category name
 * @param {string} [description] - New description
 * @param {import('./types.js').ExpenseCategory[]} existingCategories - Existing categories
 * @returns {Promise<import('./types.js').ExpenseCategory>} Updated category
 */
export async function updateCategory(categoryId, name, description, existingCategories) {
  if (!name || name.trim() === '') {
    throw new Error('Category name is required');
  }

  const categoryIndex = existingCategories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) {
    throw new Error('Category not found');
  }

  // Check if another category has the same name
  const existing = existingCategories.find(
    (c) => c.id !== categoryId && c.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  if (existing) {
    throw new Error('Category with this name already exists');
  }

  const updatedCategory = {
    ...existingCategories[categoryIndex],
    name: name.trim(),
    description: description?.trim() || '',
  };

  const updatedCategories = [...existingCategories];
  updatedCategories[categoryIndex] = updatedCategory;
  await saveCategories(updatedCategories);

  return updatedCategory;
}

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 * @param {import('./types.js').ExpenseCategory[]} existingCategories - Existing categories
 * @param {import('./types.js').Expense[]} expenses - All expenses
 * @returns {Promise<void>}
 */
export async function deleteCategory(categoryId, existingCategories, expenses) {
  // Check if category is used in expenses
  const isUsed = expenses.some((e) => e.category === categoryId);
  if (isUsed) {
    throw new Error('Cannot delete category that is used in expenses');
  }

  const updatedCategories = existingCategories.filter((c) => c.id !== categoryId);
  await saveCategories(updatedCategories);
}

/**
 * Get expenses by category
 * @param {string} categoryId - Category ID
 * @param {import('./types.js').Expense[]} expenses - All expenses
 * @returns {import('./types.js').Expense[]} Filtered expenses
 */
export function getExpensesByCategory(categoryId, expenses) {
  return expenses
    .filter((e) => e.category === categoryId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Calculate total expenses
 * @param {import('./types.js').Expense[]} expenses - All expenses
 * @returns {number} Total expenses
 */
export function calculateTotalExpenses(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate total expenses for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {import('./types.js').Expense[]} expenses - All expenses
 * @returns {number} Total expenses
 */
export function calculateExpensesInRange(startDate, endDate, expenses) {
  return expenses
    .filter((expense) => {
      const expenseDate = expense.createdAt.split('T')[0];
      return expenseDate >= startDate && expenseDate <= endDate;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
}
