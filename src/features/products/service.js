/**
 * Products Service
 * 
 * Business logic for products (bottles)
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'products_data';

/**
 * Generate unique ID for product
 * @returns {string} Unique ID
 */
export function generateProductId() {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate product data
 * @param {import('./types.js').ProductFormData} data - Product form data
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateProduct(data) {
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required' };
  }

  if (!data.size || data.size.trim().length === 0) {
    return { isValid: false, error: 'Bottle size is required' };
  }

  if (data.price === undefined || data.price === null || data.price === '') {
    return { isValid: false, error: 'Product price is required' };
  }

  if (isNaN(data.price) || parseFloat(data.price) < 0) {
    return { isValid: false, error: 'Product price must be a non-negative number' };
  }

  return { isValid: true };
}

/**
 * Load all products from storage
 * @returns {Promise<import('./types.js').Product[]>}
 */
export async function loadProducts() {
  const products = await storageService.getItem(STORAGE_KEY);
  if (!products) return [];
  
  // Ensure all products have a price field (backward compatibility)
  return products.map(product => ({
    ...product,
    price: product.price !== undefined ? product.price : 0,
  }));
}

/**
 * Save all products to storage
 * @param {import('./types.js').Product[]} products - Array of products
 * @returns {Promise<void>}
 */
export async function saveProducts(products) {
  await storageService.setItem(STORAGE_KEY, products);
}

/**
 * Create a new product
 * @param {import('./types.js').ProductFormData} data - Product form data
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<import('./types.js').Product>} Created product
 */
export async function createProduct(data, existingProducts) {
  const validation = validateProduct(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Check if product with same size already exists
  const duplicate = existingProducts.find(
    (p) => p.size.toLowerCase() === data.size.trim().toLowerCase() && p.isActive
  );
  if (duplicate) {
    throw new Error(`Product with size ${data.size} already exists`);
  }

  const now = new Date().toISOString();
  const newProduct = {
    id: generateProductId(),
    name: data.name.trim(),
    size: data.size.trim(),
    description: (data.description || '').trim(),
    price: parseFloat(data.price) || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now,
  };

  const updatedProducts = [...existingProducts, newProduct];
  await saveProducts(updatedProducts);

  return newProduct;
}

/**
 * Update an existing product
 * @param {string} id - Product ID
 * @param {import('./types.js').ProductFormData} data - Product form data
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<import('./types.js').Product>} Updated product
 */
export async function updateProduct(id, data, existingProducts) {
  const validation = validateProduct(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const productIndex = existingProducts.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }

  // Check for duplicate size (excluding current product)
  const duplicate = existingProducts.find(
    (p) => p.id !== id && p.size.toLowerCase() === data.size.trim().toLowerCase() && p.isActive
  );
  if (duplicate) {
    throw new Error(`Product with size ${data.size} already exists`);
  }

  const updatedProduct = {
    ...existingProducts[productIndex],
    name: data.name.trim(),
    size: data.size.trim(),
    description: (data.description || '').trim(),
    price: parseFloat(data.price) || existingProducts[productIndex].price || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    updatedAt: new Date().toISOString(),
  };

  const updatedProducts = [...existingProducts];
  updatedProducts[productIndex] = updatedProduct;
  await saveProducts(updatedProducts);

  return updatedProduct;
}

/**
 * Delete a product (soft delete - set isActive to false)
 * @param {string} id - Product ID
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<void>}
 */
export async function deleteProduct(id, existingProducts) {
  const productIndex = existingProducts.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }

  // Soft delete - set isActive to false
  const updatedProducts = [...existingProducts];
  updatedProducts[productIndex] = {
    ...updatedProducts[productIndex],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };
  await saveProducts(updatedProducts);
}

/**
 * Find product by ID
 * @param {string} id - Product ID
 * @param {import('./types.js').Product[]} products - Products array
 * @returns {import('./types.js').Product | undefined} Found product
 */
export function findProductById(id, products) {
  return products.find((p) => p.id === id);
}

/**
 * Get active products only
 * @param {import('./types.js').Product[]} products - Products array
 * @returns {import('./types.js').Product[]} Active products
 */
export function getActiveProducts(products) {
  return products.filter((p) => p.isActive);
}
