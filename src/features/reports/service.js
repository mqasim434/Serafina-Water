/**
 * Reports Service
 * 
 * Business logic for generating reports
 * No React/Redux dependencies - pure JavaScript functions
 */

import * as cashService from '../cash/service.js';
import { bottlesService } from '../bottles/slice.js';
import { paymentsService } from '../payments/slice.js';

/** Period filter keys */
export const PERIOD_DAILY = 'daily';
export const PERIOD_WEEKLY = 'weekly';
export const PERIOD_MONTHLY = 'monthly';
export const PERIOD_YTD = 'ytd';
export const PERIOD_CUSTOM = 'custom';

/**
 * Get start and end date for a period (YYYY-MM-DD).
 * @param {string} period - One of daily, weekly, monthly, ytd, custom
 * @param {string} [customStart] - For custom: start date YYYY-MM-DD
 * @param {string} [customEnd] - For custom: end date YYYY-MM-DD
 * @returns {{ startDate: string, endDate: string }}
 */
export function getPeriodRange(period, customStart, customEnd) {
  const now = new Date();
  const today = cashService.getTodayDate();

  if (period === PERIOD_CUSTOM && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  if (period === PERIOD_DAILY) {
    return { startDate: today, endDate: today };
  }

  if (period === PERIOD_WEEKLY) {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: cashService.formatDate(monday),
      endDate: cashService.formatDate(sunday),
    };
  }

  if (period === PERIOD_MONTHLY) {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: cashService.formatDate(first),
      endDate: cashService.formatDate(last),
    };
  }

  if (period === PERIOD_YTD) {
    const first = new Date(now.getFullYear(), 0, 1);
    return {
      startDate: cashService.formatDate(first),
      endDate: today,
    };
  }

  return { startDate: today, endDate: today };
}

/**
 * Get same period last year (start/end shifted back one year).
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {{ startDate: string, endDate: string }}
 */
export function getSamePeriodLastYear(startDate, endDate) {
  const s = new Date(startDate + 'T12:00:00');
  const e = new Date(endDate + 'T12:00:00');
  s.setFullYear(s.getFullYear() - 1);
  e.setFullYear(e.getFullYear() - 1);
  return {
    startDate: cashService.formatDate(s),
    endDate: cashService.formatDate(e),
  };
}

/**
 * Generate Profit & Revenue report (Admin only). Uses cost at time of sale.
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {{ compareLastYear?: boolean }} [options]
 * @returns {{ totalRevenue: number, totalCost: number, totalProfit: number, profitMarginPct: number, productBreakdown: Array<{ productId: string, productName: string, quantitySold: number, revenue: number, cost: number, profit: number }>, comparison?: { totalRevenue: number, totalCost: number, totalProfit: number, profitMarginPct: number } }}
 */
export function generateProfitRevenueReport(orders, products, startDate, endDate, options = {}) {
  const orderDate = (order) => cashService.formatDate(new Date(order.createdAt));
  const inRange = (o) => {
    const d = orderDate(o);
    return d >= startDate && d <= endDate;
  };
  const filtered = orders.filter(inRange);

  let totalRevenue = 0;
  let totalCost = 0;
  const byProduct = new Map();

  filtered.forEach((order) => {
    const revenue = order.quantity * (order.price || 0);
    const costPerUnit = order.costPriceAtSale ?? 0;
    const cost = order.quantity * costPerUnit;
    const profit = revenue - cost;
    totalRevenue += revenue;
    totalCost += cost;

    const product = products.find((p) => p.id === order.productId);
    const productName = product ? `${product.name} (${product.size})` : order.productId || 'Unknown';
    const key = order.productId || 'unknown';
    if (!byProduct.has(key)) {
      byProduct.set(key, {
        productId: order.productId,
        productName,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      });
    }
    const row = byProduct.get(key);
    row.quantitySold += order.quantity;
    row.revenue += revenue;
    row.cost += cost;
    row.profit += profit;
  });

  const totalProfit = totalRevenue - totalCost;
  const profitMarginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0;

  const productBreakdown = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue);

  let comparison;
  if (options.compareLastYear) {
    const { startDate: lyStart, endDate: lyEnd } = getSamePeriodLastYear(startDate, endDate);
    const lyFiltered = orders.filter((o) => {
      const d = orderDate(o);
      return d >= lyStart && d <= lyEnd;
    });
    let lyRevenue = 0;
    let lyCost = 0;
    lyFiltered.forEach((o) => {
      lyRevenue += o.quantity * (o.price || 0);
      lyCost += o.quantity * (o.costPriceAtSale ?? 0);
    });
    const lyProfit = lyRevenue - lyCost;
    const lyMargin = lyRevenue > 0 ? Math.round((lyProfit / lyRevenue) * 10000) / 100 : 0;
    comparison = {
      totalRevenue: lyRevenue,
      totalCost: lyCost,
      totalProfit: lyProfit,
      profitMarginPct: lyMargin,
    };
  }

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPct,
    productBreakdown,
    ...(comparison ? { comparison } : {}),
  };
}

/**
 * Real Customer Growth: count customers whose first order (activation) falls in the selected period.
 * Ignores customers with zero orders.
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {{ compareLastYear?: boolean }} [options]
 * @returns {{ activatedCount: number, comparison?: { activatedCount: number, difference: number } }}
 */
export function generateCustomerGrowthReport(orders, startDate, endDate, options = {}) {
  const orderDate = (order) => cashService.formatDate(new Date(order.createdAt));
  const firstOrderByCustomer = new Map();
  orders.forEach((order) => {
    const d = orderDate(order);
    if (!firstOrderByCustomer.has(order.customerId)) {
      firstOrderByCustomer.set(order.customerId, d);
    } else {
      const existing = firstOrderByCustomer.get(order.customerId);
      if (d < existing) firstOrderByCustomer.set(order.customerId, d);
    }
  });

  let activatedCount = 0;
  firstOrderByCustomer.forEach((activationDate) => {
    if (activationDate >= startDate && activationDate <= endDate) {
      activatedCount += 1;
    }
  });

  let comparison;
  if (options.compareLastYear) {
    const { startDate: lyStart, endDate: lyEnd } = getSamePeriodLastYear(startDate, endDate);
    let lyCount = 0;
    firstOrderByCustomer.forEach((activationDate) => {
      if (activationDate >= lyStart && activationDate <= lyEnd) {
        lyCount += 1;
      }
    });
    comparison = {
      activatedCount: lyCount,
      difference: activatedCount - lyCount,
    };
  }

  return {
    activatedCount,
    ...(comparison ? { comparison } : {}),
  };
}

/**
 * Generate customer-wise bottles report (outstanding = returnable only)
 * @param {import('../customers/types.js').Customer[]} customers - All customers
 * @param {import('../bottles/types.js').BottleTransaction[]} transactions - All bottle transactions
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {import('./types.js').CustomerBottlesReport[]} Customer bottles report
 */
export function generateCustomerBottlesReport(customers, transactions, orders = [], products = []) {
  return customers.map((customer) => {
    const balance = bottlesService.calculateCustomerBalance(customer.id, transactions);
    const outstandingReturnable = bottlesService.calculateOutstandingReturnable(
      customer.id,
      transactions,
      orders,
      products
    );
    return {
      customerId: customer.id,
      customerName: customer.name,
      issued: balance.issued,
      returned: balance.returned,
      outstanding: outstandingReturnable,
    };
  }).filter((report) => report.outstanding > 0 || report.issued > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
}

/**
 * Generate outstanding bottles report (returnable products only)
 * @param {import('../customers/types.js').Customer[]} customers - All customers
 * @param {import('../bottles/types.js').BottleTransaction[]} transactions - All bottle transactions
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {import('./types.js').OutstandingBottlesReport} Outstanding bottles report
 */
export function generateOutstandingBottlesReport(customers, transactions, orders = [], products = []) {
  const returnableSummary = bottlesService.calculateGlobalSummaryReturnable(transactions, orders, products);
  const customerReports = generateCustomerBottlesReport(customers, transactions, orders, products);

  return {
    totalOutstanding: returnableSummary.totalOutstandingReturnable,
    customers: customerReports.filter((r) => r.outstanding > 0),
  };
}

/**
 * Generate due amounts report
 * @param {import('../customers/types.js').Customer[]} customers - All customers
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../payments/types.js').Payment[]} payments - All payments
 * @returns {import('./types.js').DueAmountsReport[]} Due amounts report
 */
export function generateDueAmountsReport(customers, orders, payments) {
  return customers
    .map((customer) => {
      const balance = paymentsService.calculateCustomerBalance(
        customer.id,
        orders,
        payments,
        customers
      );
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalOrders: balance.totalOrders,
        totalPayments: balance.totalPayments,
        dueAmount: balance.balance,
      };
    })
    .filter((report) => report.dueAmount > 0)
    .sort((a, b) => b.dueAmount - a.dueAmount);
}

/**
 * Generate cash flow report
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../expenses/types.js').Expense[]} expenses - All expenses
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {import('./types.js').CashFlowReport} Cash flow report
 */
export function generateCashFlowReport(orders, expenses, startDate, endDate) {
  const entries = [];
  const dateMap = new Map();

  // Process orders (income)
  orders.forEach((order) => {
    const orderDate = cashService.formatDate(new Date(order.createdAt));
    if (orderDate >= startDate && orderDate <= endDate) {
      if (!dateMap.has(orderDate)) {
        dateMap.set(orderDate, { income: 0, expenses: 0 });
      }
      dateMap.get(orderDate).income += order.totalAmount;
    }
  });

  // Process expenses
  expenses.forEach((expense) => {
    const expenseDate = cashService.formatDate(new Date(expense.createdAt));
    if (expenseDate >= startDate && expenseDate <= endDate) {
      if (!dateMap.has(expenseDate)) {
        dateMap.set(expenseDate, { income: 0, expenses: 0 });
      }
      dateMap.get(expenseDate).expenses += expense.amount;
    }
  });

  // Convert to entries
  const sortedDates = Array.from(dateMap.keys()).sort();
  let runningBalance = 0;

  sortedDates.forEach((date) => {
    const data = dateMap.get(date);
    const netCash = data.income - data.expenses;
    runningBalance += netCash;

    entries.push({
      date,
      income: data.income,
      expenses: data.expenses,
      netCash,
      balance: runningBalance,
    });
  });

  const totalIncome = entries.reduce((sum, e) => sum + e.income, 0);
  const totalExpenses = entries.reduce((sum, e) => sum + e.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  return {
    entries,
    totalIncome,
    totalExpenses,
    netCashFlow,
  };
}

/**
 * Export data to CSV format
 * @param {Array<Object>} data - Data to export
 * @param {string[]} headers - Column headers
 * @param {string} filename - Filename
 */
export function exportToCSV(data, headers, filename) {
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header] ?? '';
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel (CSV format, can be opened in Excel)
 * @param {Array<Object>} data - Data to export
 * @param {string[]} headers - Column headers
 * @param {string} filename - Filename
 */
export function exportToExcel(data, headers, filename) {
  exportToCSV(data, headers, filename.replace('.xlsx', '.csv'));
}

/**
 * Generate PDF content (simple HTML-based, can be printed to PDF)
 * @param {string} title - Report title
 * @param {Array<Object>} data - Data to export
 * @param {string[]} headers - Column headers
 * @returns {string} HTML content
 */
export function generatePDFContent(title, data, headers) {
  // Build table rows using string concatenation to avoid JSX parsing
  const tableRows = data
    .map((row) => {
      const cells = headers.map((header) => {
        const value = String(row[header] ?? '');
        return '<td>' + value + '</td>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    })
    .join('');

  const headerRow = headers.map((h) => '<th>' + String(h) + '</th>').join('');
  const generatedDate = new Date().toLocaleString();
  
  // Build HTML using string concatenation to avoid JSX parsing
  const parts = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<title>', title, '</title>',
    '<style>',
    'body { font-family: Arial, sans-serif; padding: 20px; }',
    'h1 { color: #333; }',
    'table { width: 100%; border-collapse: collapse; margin-top: 20px; }',
    'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }',
    'th { background-color: #f2f2f2; font-weight: bold; }',
    '@media print { body { padding: 0; } }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>', title, '</h1>',
    '<p>Generated on: ', generatedDate, '</p>',
    '<table>',
    '<thead>',
    '<tr>', headerRow, '</tr>',
    '</thead>',
    '<tbody>',
    tableRows,
    '</tbody>',
    '</table>',
    '</body>',
    '</html>'
  ];
  
  return parts.join('');
}

/**
 * Export to PDF (opens print dialog)
 * @param {string} title - Report title
 * @param {Array<Object>} data - Data to export
 * @param {string[]} headers - Column headers
 */
export function exportToPDF(title, data, headers) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('exportToPDF can only be called in browser environment');
    return;
  }
  
  // Use a simpler approach - create a hidden element and print it
  const printContainer = document.createElement('div');
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px';
  printContainer.innerHTML = generatePDFContent(title, data, headers);
  document.body.appendChild(printContainer);
  
  window.print();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(printContainer);
  }, 1000);
}

/**
 * Calculate days since last order
 * @param {import('../orders/types.js').Order[]} customerOrders - Orders for a customer
 * @returns {number | null} Days since last order, or null if no orders
 */
function calculateDaysSinceLastOrder(customerOrders) {
  if (!customerOrders || customerOrders.length === 0) {
    return null;
  }
  
  const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const lastOrderDate = new Date(lastOrder.createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastOrderDate.setHours(0, 0, 0, 0);
  
  const diffTime = today - lastOrderDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calculate average order quantity
 * @param {import('../orders/types.js').Order[]} customerOrders - Orders for a customer
 * @returns {number} Average order quantity (rounded to 2 decimal places)
 */
function calculateAverageOrderQuantity(customerOrders) {
  if (!customerOrders || customerOrders.length === 0) {
    return 0;
  }
  
  const totalQuantity = customerOrders.reduce((sum, order) => sum + order.quantity, 0);
  const average = totalQuantity / customerOrders.length;
  return Math.round(average * 100) / 100;
}

/**
 * Find most frequently ordered product
 * @param {import('../orders/types.js').Order[]} customerOrders - Orders for a customer
 * @param {import('../products/types.js').Product[]} products - All products
 * @returns {string} Product name or "N/A" if no orders
 */
function findMostFrequentProduct(customerOrders, products) {
  if (!customerOrders || customerOrders.length === 0) {
    return 'N/A';
  }
  
  // Count occurrences of each productId
  const productCounts = {};
  customerOrders.forEach((order) => {
    productCounts[order.productId] = (productCounts[order.productId] || 0) + 1;
  });
  
  // Find the productId with the highest count
  const mostFrequentProductId = Object.keys(productCounts).reduce((a, b) =>
    productCounts[a] > productCounts[b] ? a : b
  );
  
  // Find product name
  const product = products.find((p) => p.id === mostFrequentProductId);
  return product ? product.name : 'N/A';
}

/**
 * Get last order date
 * @param {import('../orders/types.js').Order[]} customerOrders - Orders for a customer
 * @returns {string | null} Last order date formatted as YYYY-MM-DD, or null if no orders
 */
function getLastOrderDate(customerOrders) {
  if (!customerOrders || customerOrders.length === 0) {
    return null;
  }
  
  const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const date = new Date(lastOrder.createdAt);
  return date.toISOString().split('T')[0];
}

/**
 * Generate customer activity report
 * @param {import('../customers/types.js').Customer[]} customers - All customers
 * @param {import('../orders/types.js').Order[]} orders - All orders
 * @param {import('../products/types.js').Product[]} products - All products
 * @param {number | null} minDaysInactive - Minimum days inactive to filter (30, 60, 90, or null for all)
 * @returns {import('./types.js').CustomerActivityReport[]} Customer activity report
 */
export function generateCustomerActivityReport(customers, orders, products, minDaysInactive = null) {
  const now = new Date();
  
  return customers
    .map((customer) => {
      // Get all orders for this customer
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      
      // Calculate metrics
      const daysSinceLastOrder = calculateDaysSinceLastOrder(customerOrders);
      const lastOrderDate = getLastOrderDate(customerOrders);
      const averageOrderQuantity = calculateAverageOrderQuantity(customerOrders);
      const mostFrequentProduct = findMostFrequentProduct(customerOrders, products);
      
      // Determine inactivity classification
      let inactivityStatus = 'active';
      if (daysSinceLastOrder === null) {
        inactivityStatus = 'no_orders';
      } else if (daysSinceLastOrder >= 90) {
        inactivityStatus = '90_days';
      } else if (daysSinceLastOrder >= 60) {
        inactivityStatus = '60_days';
      } else if (daysSinceLastOrder >= 30) {
        inactivityStatus = '30_days';
      }
      
      return {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        lastOrderDate: lastOrderDate,
        daysSinceLastOrder: daysSinceLastOrder,
        averageOrderQuantity: averageOrderQuantity,
        mostFrequentProduct: mostFrequentProduct,
        inactivityStatus: inactivityStatus,
      };
    })
    .filter((report) => {
      // Filter based on minDaysInactive
      // Always include customers with no orders (daysSinceLastOrder === null)
      if (report.daysSinceLastOrder === null) {
        return true;
      }
      
      if (minDaysInactive === null) {
        // Show all inactive customers (30+ days)
        return report.daysSinceLastOrder >= 30;
      }
      
      if (minDaysInactive === 30) {
        return report.daysSinceLastOrder >= 30;
      }
      
      if (minDaysInactive === 60) {
        return report.daysSinceLastOrder >= 60;
      }
      
      if (minDaysInactive === 90) {
        return report.daysSinceLastOrder >= 90;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by days since last order (most inactive first)
      if (a.daysSinceLastOrder === null && b.daysSinceLastOrder === null) return 0;
      if (a.daysSinceLastOrder === null) return 1;
      if (b.daysSinceLastOrder === null) return -1;
      return b.daysSinceLastOrder - a.daysSinceLastOrder;
    });
}
