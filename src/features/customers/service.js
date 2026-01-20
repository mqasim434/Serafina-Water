/**
 * Customers Service
 * 
 * Business logic and calculations for customers
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'customers_data';

/**
 * Generate unique ID for customer
 * @returns {string} Unique ID
 */
export function generateCustomerId() {
  return `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate customer data
 * @param {import('./types.js').CustomerFormData} data - Customer form data
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateCustomer(data) {
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (!data.phone || data.phone.trim().length === 0) {
    return { isValid: false, error: 'Phone is required' };
  }

  // Basic phone validation (can be enhanced)
  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(data.phone.trim())) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  if (!data.address || data.address.trim().length === 0) {
    return { isValid: false, error: 'Address is required' };
  }

  if (!data.preferredLanguage || !['en', 'ur'].includes(data.preferredLanguage)) {
    return { isValid: false, error: 'Preferred language must be en or ur' };
  }

  return { isValid: true };
}

/**
 * Load all customers from storage
 * @returns {Promise<import('./types.js').Customer[]>}
 */
export async function loadCustomers() {
  const customers = await storageService.getItem(STORAGE_KEY);
  return customers || [];
}

/**
 * Save all customers to storage
 * @param {import('./types.js').Customer[]} customers - Array of customers
 * @returns {Promise<void>}
 */
export async function saveCustomers(customers) {
  await storageService.setItem(STORAGE_KEY, customers);
}

/**
 * Create a new customer
 * @param {import('./types.js').CustomerFormData} data - Customer form data
 * @param {import('./types.js').Customer[]} existingCustomers - Existing customers array
 * @returns {Promise<import('./types.js').Customer>} Created customer
 */
export async function createCustomer(data, existingCustomers) {
  const validation = validateCustomer(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Set default product prices if not provided
  const productPrices = data.productPrices || {};

  // Set opening balance (default to 0 if not provided)
  const openingBalance = data.openingBalance || 0;

  const now = new Date().toISOString();
  const newCustomer = {
    id: generateCustomerId(),
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    preferredLanguage: data.preferredLanguage,
    productPrices: productPrices,
    openingBalance: openingBalance,
    createdAt: now,
    updatedAt: now,
  };

  const updatedCustomers = [...existingCustomers, newCustomer];
  await saveCustomers(updatedCustomers);

  return newCustomer;
}

/**
 * Update an existing customer
 * @param {string} id - Customer ID
 * @param {import('./types.js').CustomerFormData} data - Customer form data
 * @param {import('./types.js').Customer[]} existingCustomers - Existing customers array
 * @returns {Promise<import('./types.js').Customer>} Updated customer
 */
export async function updateCustomer(id, data, existingCustomers) {
  const validation = validateCustomer(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const customerIndex = existingCustomers.findIndex((c) => c.id === id);
  if (customerIndex === -1) {
    throw new Error('Customer not found');
  }

  const existingCustomer = existingCustomers[customerIndex];
  
  // Merge product prices - new structure takes precedence, fall back to existing
  const productPrices = data.productPrices || existingCustomer.productPrices || {};
  
  const updatedCustomer = {
    ...existingCustomer,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    preferredLanguage: data.preferredLanguage,
    productPrices: productPrices,
    // Preserve legacy bottlePrices for backward compatibility if they exist
    // (but don't use them for new updates)
    ...(existingCustomer.bottlePrices && { bottlePrices: existingCustomer.bottlePrices }),
    // Opening balance is preserved (do not update)
    openingBalance: existingCustomer.openingBalance || 0,
    updatedAt: new Date().toISOString(),
  };

  const updatedCustomers = [...existingCustomers];
  updatedCustomers[customerIndex] = updatedCustomer;
  await saveCustomers(updatedCustomers);

  return updatedCustomer;
}

/**
 * Delete a customer
 * @param {string} id - Customer ID
 * @param {import('./types.js').Customer[]} existingCustomers - Existing customers array
 * @returns {Promise<void>}
 */
export async function deleteCustomer(id, existingCustomers) {
  const updatedCustomers = existingCustomers.filter((c) => c.id !== id);
  await saveCustomers(updatedCustomers);
}

/**
 * Find customer by ID
 * @param {string} id - Customer ID
 * @param {import('./types.js').Customer[]} customers - Customers array
 * @returns {import('./types.js').Customer | undefined} Found customer
 */
export function findCustomerById(id, customers) {
  return customers.find((c) => c.id === id);
}

/**
 * Search customers by name or phone
 * @param {string} query - Search query
 * @param {import('./types.js').Customer[]} customers - Customers array
 * @returns {import('./types.js').Customer[]} Filtered customers
 */
export function searchCustomers(query, customers) {
  if (!query || query.trim().length === 0) {
    return customers;
  }

  const lowerQuery = query.toLowerCase().trim();
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(lowerQuery)
  );
}

