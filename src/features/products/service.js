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

  const priceNum = parseFloat(data.price);
  if (isNaN(priceNum) || priceNum < 0) {
    return { isValid: false, error: 'Product price must be a non-negative number' };
  }

  return { isValid: true };
}

/**
 * Load all products from storage
 * @returns {Promise<import('./types.js').Product[]>}
 */
export async function loadProducts() {
  try {
    const products = await storageService.getItem(STORAGE_KEY);
    
    // Handle null, undefined, or empty array
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('No products found in storage');
      return [];
    }
    
    // Ensure all products have required fields (backward compatibility)
    return products.map(product => ({
      ...product,
      price: product.price !== undefined ? product.price : 0,
      costPrice: product.costPrice !== undefined ? product.costPrice : 0,
      isActive: product.isActive !== undefined ? product.isActive : true,
      trackStock: product.trackStock !== undefined ? product.trackStock : true,
      lowStockThreshold: product.lowStockThreshold !== undefined ? product.lowStockThreshold : 0,
      currentStock: product.currentStock !== undefined ? product.currentStock : 0,
      readyToShip: product.readyToShip !== undefined ? product.readyToShip : 0,
    }));
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
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
    price: (() => { const p = parseFloat(data.price); return !isNaN(p) && p >= 0 ? p : 0; })(),
    costPrice: data.costPrice !== undefined && data.costPrice !== '' ? parseFloat(data.costPrice) : 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isReturnable: data.isReturnable !== undefined ? data.isReturnable : true,
    trackStock: data.trackStock !== undefined ? data.trackStock : true,
    lowStockThreshold: typeof data.lowStockThreshold === 'number' ? data.lowStockThreshold : (data.lowStockThreshold !== '' && data.lowStockThreshold != null ? parseInt(data.lowStockThreshold, 10) : 0),
    currentStock: 0,
    readyToShip: 0,
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

  const existing = existingProducts[productIndex];
  const updatedProduct = {
    ...existing,
    name: data.name.trim(),
    size: data.size.trim(),
    description: (data.description || '').trim(),
    price: (() => { const p = parseFloat(data.price); return !isNaN(p) && p >= 0 ? p : (existing.price ?? 0); })(),
    costPrice: data.costPrice !== undefined && data.costPrice !== '' ? parseFloat(data.costPrice) : (existing.costPrice ?? 0),
    isActive: data.isActive !== undefined ? data.isActive : true,
    isReturnable: data.isReturnable !== undefined ? data.isReturnable : (existing.isReturnable !== undefined ? existing.isReturnable : true),
    trackStock: data.trackStock !== undefined ? data.trackStock : (existing.trackStock !== undefined ? existing.trackStock : true),
    lowStockThreshold: typeof data.lowStockThreshold === 'number' ? data.lowStockThreshold : (data.lowStockThreshold !== '' && data.lowStockThreshold != null ? parseInt(data.lowStockThreshold, 10) : (existing.lowStockThreshold || 0)),
    currentStock: existing.currentStock !== undefined ? existing.currentStock : 0,
    readyToShip: existing.readyToShip !== undefined ? existing.readyToShip : 0,
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

/**
 * Update Ready to Ship quantity for a product (Admin + Staff). Does not change total stock.
 * Ready to Ship cannot exceed total stock.
 * @param {string} productId - Product ID
 * @param {number} readyToShip - New Ready to Ship quantity
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<import('./types.js').Product>} Updated product
 */
export async function updateReadyToShip(productId, readyToShip, existingProducts) {
  const productIndex = existingProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const product = existingProducts[productIndex];
  const currentStock = product.currentStock !== undefined ? product.currentStock : 0;
  const value = Math.max(0, Math.floor(Number(readyToShip)) || 0);
  if (value > currentStock) {
    throw new Error('Ready to Ship cannot exceed total stock');
  }
  const updatedProduct = {
    ...product,
    readyToShip: value,
    updatedAt: new Date().toISOString(),
  };
  const updatedProducts = [...existingProducts];
  updatedProducts[productIndex] = updatedProduct;
  await saveProducts(updatedProducts);
  return updatedProduct;
}

/**
 * Add stock purchase (Admin only). Increases currentStock.
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity purchased
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<import('./types.js').Product>} Updated product
 */
export async function addStockPurchase(productId, quantity, existingProducts) {
  const productIndex = existingProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const qty = Math.max(0, Math.floor(Number(quantity)) || 0);
  if (qty <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  const product = existingProducts[productIndex];
  const currentStock = (product.currentStock !== undefined ? product.currentStock : 0) + qty;
  const updatedProduct = {
    ...product,
    currentStock,
    updatedAt: new Date().toISOString(),
  };
  const updatedProducts = [...existingProducts];
  updatedProducts[productIndex] = updatedProduct;
  await saveProducts(updatedProducts);
  return updatedProduct;
}

/**
 * Get products that are tracked for stock and below low stock threshold
 * @param {import('./types.js').Product[]} products - Products array
 * @returns {import('./types.js').Product[]} Products below threshold
 */
export function getLowStockProducts(products) {
  return products.filter(
    (p) =>
      p.isActive &&
      p.trackStock !== false &&
      (p.currentStock ?? 0) < (p.lowStockThreshold ?? 0)
  );
}

/**
 * Increase stock for a returnable product when bottles are returned (stock only, not Ready to Ship)
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity returned
 * @param {import('./types.js').Product[]} existingProducts - Existing products array
 * @returns {Promise<import('./types.js').Product>} Updated product
 */
export async function increaseStockForReturn(productId, quantity, existingProducts) {
  const productIndex = existingProducts.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  const product = existingProducts[productIndex];
  if (!product.isReturnable) {
    throw new Error('Product is not returnable');
  }
  const qty = Math.max(0, Math.floor(Number(quantity)) || 0);
  if (qty <= 0) return product;
  const currentStock = (product.currentStock ?? 0) + qty;
  const updatedProduct = {
    ...product,
    currentStock,
    updatedAt: new Date().toISOString(),
  };
  const updatedProducts = [...existingProducts];
  updatedProducts[productIndex] = updatedProduct;
  await saveProducts(updatedProducts);
  return updatedProduct;
}
