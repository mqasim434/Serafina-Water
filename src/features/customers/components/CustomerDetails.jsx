/**
 * Customer Details Component
 *
 * Collapsible sections: Customer Details (two-column), Orders, Payments
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { productsService } from '../../../features/products/slice.js';
import { ordersService } from '../../../features/orders/slice.js';
import { paymentsService } from '../../../features/payments/slice.js';
import { bottlesService } from '../../../features/bottles/slice.js';
import { getDeliveredByDisplay } from '../../../features/delivery/utils.js';

/**
 * @param {Object} props
 * @param {import('../types.js').Customer} props.customer
 * @param {function(): void} props.onEdit
 * @param {function(): void} props.onDeactivate
 * @param {function(): void} props.onActivate
 */
export function CustomerDetails({ customer, onEdit, onDeactivate, onActivate }) {
  const { t } = useTranslation();
  const { items: products } = useSelector((state) => state.products);
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);
  const { transactions } = useSelector((state) => state.bottles);
  const { items: users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const getUserName = (id) => {
    if (!id) return '';
    if (currentUser?.id === id) return currentUser.displayName || currentUser.username || id;
    const user = users?.find((u) => u.id === id);
    if (!user) return id;
    return user.displayName || user.username || (user.role ? t(user.role) : id);
  };

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState(null);

  useEffect(() => {
    if (!imageModalUrl) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setImageModalUrl(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageModalUrl]);

  const activeProducts = productsService.getActiveProducts(products);
  const isActive = customer?.isActive !== false;

  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t('noCustomers')}
      </div>
    );
  }

  const customerOrders = [...(orders || [])]
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  const customerTransactions = bottlesService.getCustomerTransactions(customer.id, transactions || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  const customerPayments = paymentsService.getPaymentHistory(customer.id, payments || []).slice(0, 20);

  const allOrders = [...(orders || [])]
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const allTransactions = bottlesService.getCustomerTransactions(customer.id, transactions || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const allPayments = paymentsService.getPaymentHistory(customer.id, payments || []);

  const { items: customers } = useSelector((state) => state.customers);
  const customerBalance = paymentsService.calculateCustomerBalance(customer.id, orders || [], payments || [], customers || []);
  const pendingBottles = bottlesService.calculateOutstandingReturnable(customer.id, transactions || [], orders || [], products || []);

  const handleDownloadReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 15;
    let y = 15;

    const addSection = (title) => {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(title, margin, y);
      y += 8;
    };

    const addRow = (label, value) => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(label, margin, y);
      doc.setTextColor(0, 0, 0);
      doc.text(String(value || '-'), margin + 50, y);
      y += 6;
    };

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Customer Report - ${customer.name}`, margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 12;

    addSection('Customer Details');
    addRow('Name:', customer.name);
    addRow('Phone:', customer.phone);
    addRow('Address:', (customer.address || '-').replace(/\n/g, ', '));
    addRow('Language:', customer.preferredLanguage === 'ur' ? 'Urdu' : 'English');
    addRow('Status:', isActive ? 'Active' : 'Deactivated');
    addRow('Created:', customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '-');
    y += 4;

    addSection('Product Prices');
    const priceRows = [];
    if (customer.productPrices && activeProducts.length > 0) {
      activeProducts.forEach((product) => {
        const price = customer.productPrices[product.id];
        if (price && price > 0) {
          priceRows.push([product.name, product.size, `Rs. ${(price || 0).toLocaleString()}`]);
        }
      });
    } else if (customer.bottlePrices) {
      const bp = customer.bottlePrices;
      if (bp.price19L > 0) priceRows.push(['19L', '-', `Rs. ${(bp.price19L || 0).toLocaleString()}`]);
      if (bp.price6L > 0) priceRows.push(['6L', '-', `Rs. ${(bp.price6L || 0).toLocaleString()}`]);
      if (bp.price1_5L > 0) priceRows.push(['1.5L', '-', `Rs. ${(bp.price1_5L || 0).toLocaleString()}`]);
      if (bp.price500ml > 0) priceRows.push(['500ml', '-', `Rs. ${(bp.price500ml || 0).toLocaleString()}`]);
    }
    if (priceRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Product', 'Size', 'Price']],
        body: priceRows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No prices set', margin, y);
      y += 10;
    }

    addSection('Orders');
    const orderRows = allOrders.map((o) => [
      `#${o.orderNumber}`,
      String(ordersService.getOrderTotalQuantity(o)),
      `Rs. ${(o.totalAmount ?? 0).toLocaleString()}`,
      new Date(o.createdAt).toLocaleString(),
      getDeliveredByDisplay(o.deliveredBy, users) || '-',
    ]);
    if (orderRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Order', 'Qty', 'Amount', 'Date', t('deliveredBy')]],
        body: orderRows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No orders', margin, y);
      y += 10;
    }

    addSection('Bottle Transactions (Issued/Returned)');
    const txRows = allTransactions.map((tx) => [
      tx.type === 'issued' ? 'Issued' : 'Returned',
      String(tx.quantity),
      new Date(tx.createdAt).toLocaleString(),
      tx.notes || '-',
    ]);
    if (txRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Type', 'Qty', 'Date', 'Notes']],
        body: txRows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No transactions', margin, y);
      y += 10;
    }

    addSection('Payments');
    const paymentRows = allPayments.map((p) => [
      p.paymentMethod,
      `Rs. ${p.amount.toLocaleString()}`,
      new Date(p.createdAt).toLocaleString(),
      p.notes || '-',
    ]);
    if (paymentRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Method', 'Amount', 'Date', 'Notes']],
        body: paymentRows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 8 },
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('No payments', margin, y);
    }

    doc.save(`customer-report-${customer.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const ChevronIcon = ({ open }) => (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const CollapsibleSection = ({ title, open, onToggle, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-900"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && <div className="border-t border-gray-200">{children}</div>}
    </div>
  );

  return (
    <>
    <div className="space-y-4">
      {/* Section 1: Customer Details - two-column, collapsible */}
      <CollapsibleSection
        title={t('customerDetails')}
        open={detailsOpen}
        onToggle={() => setDetailsOpen(!detailsOpen)}
      >
        <div className="p-4 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div />
            <div className="flex gap-2">
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('downloadReport') || 'Download Report'}
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('edit')}
              </button>
              {isActive ? (
                <button
                  onClick={onDeactivate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                >
                  {t('deactivate')}
                </button>
              ) : (
                <button
                  onClick={onActivate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  {t('activate')}
                </button>
              )}
            </div>
          </div>
          {!isActive && (
            <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              {t('deactivatedCustomerNote')}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('name')}</label>
                <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('phone')}</label>
                <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('preferredLanguage')}</label>
                <p className="mt-1 text-sm text-gray-900">
                  {customer.preferredLanguage === 'ur' ? 'Urdu' : 'English'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('hasDispenser') || 'Has Dispenser'}</label>
                <p className="mt-1 text-sm text-gray-900">{customer.hasDispenser ? t('yes') || 'Yes' : t('no') || 'No'}</p>
              </div>
              {customer.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('created')}</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(customer.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('address')}</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{customer.address}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Product Prices') || t('bottlePrices')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {customer.productPrices && activeProducts.length > 0 ? (
                    activeProducts.map((product) => {
                      const price = customer.productPrices[product.id];
                      if (price && price > 0) {
                        return (
                          <div key={product.id} className="text-sm">
                            <span className="text-gray-500">{product.name} ({product.size}):</span>
                            <span className="ml-1 font-medium">Rs. {(price || 0).toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    }).filter(Boolean)
                  ) : customer.bottlePrices ? (
                    <>
                      {customer.bottlePrices.price19L > 0 && (
                        <div className="text-sm"><span className="text-gray-500">19L:</span> <span className="font-medium">Rs. {(customer.bottlePrices.price19L || 0).toLocaleString()}</span></div>
                      )}
                      {customer.bottlePrices.price6L > 0 && (
                        <div className="text-sm"><span className="text-gray-500">6L:</span> <span className="font-medium">Rs. {(customer.bottlePrices.price6L || 0).toLocaleString()}</span></div>
                      )}
                      {customer.bottlePrices.price1_5L > 0 && (
                        <div className="text-sm"><span className="text-gray-500">1.5L:</span> <span className="font-medium">Rs. {(customer.bottlePrices.price1_5L || 0).toLocaleString()}</span></div>
                      )}
                      {customer.bottlePrices.price500ml > 0 && (
                        <div className="text-sm"><span className="text-gray-500">500ml:</span> <span className="font-medium">Rs. {(customer.bottlePrices.price500ml || 0).toLocaleString()}</span></div>
                      )}
                    </>
                  ) : null}
                  {(!customer.productPrices || Object.keys(customer.productPrices || {}).length === 0) &&
                   (!customer.bottlePrices || (
                     (customer.bottlePrices.price19L ?? 0) === 0 &&
                     (customer.bottlePrices.price6L ?? 0) === 0 &&
                     (customer.bottlePrices.price1_5L ?? 0) === 0 &&
                     (customer.bottlePrices.price500ml ?? 0) === 0
                   )) && (
                    <p className="text-sm text-gray-500 col-span-2">{t('noPricesSet')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: Balance - collapsible */}
      <CollapsibleSection
        title={t('balance')}
        open={balanceOpen}
        onToggle={() => setBalanceOpen(!balanceOpen)}
      >
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-700">{t('pendingAmount') || 'Pending Amount'}</p>
              <p className="text-xl font-bold text-amber-900">Rs. {(customerBalance.balance ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-700">{t('pendingBottlesToReturn') || 'Pending Bottles (to be returned)'}</p>
              <p className="text-xl font-bold text-blue-900">{pendingBottles}</p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Orders - collapsible */}
      <CollapsibleSection
        title={t('orders')}
        open={ordersOpen}
        onToggle={() => setOrdersOpen(!ordersOpen)}
      >
        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {customerOrders.length === 0 && customerTransactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">{t('noOrders')}</div>
          ) : (
            (() => {
              const orderItems = customerOrders.map((o) => ({ type: 'order', date: o.createdAt, id: o.id, data: o }));
              const txItems = customerTransactions.map((tx) => ({ type: 'transaction', date: tx.createdAt, id: tx.id, data: tx }));
              const sorted = [...orderItems, ...txItems].sort((a, b) => new Date(b.date) - new Date(a.date));
              return sorted.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-4 hover:bg-gray-50 text-sm">
                  {item.type === 'order' ? (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                            item.data.status === 'returned' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.data.status === 'returned' ? t('returned') : t('order')}
                          </span>
                          <span className="font-medium">#{item.data.orderNumber}</span>
                          <span className="text-gray-600 ml-1">
                            — {ordersService.getOrderTotalQuantity(item.data)} {t('bottles')}
                          </span>
                          <span className="text-gray-500 ml-2">
                            Rs. {(item.data.totalAmount ?? 0).toLocaleString()}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(item.date).toLocaleString()}
                            {item.data.createdBy && (
                              <span className="block mt-0.5">
                                {t('placedBy')}: {getUserName(item.data.createdBy)}
                              </span>
                            )}
                            {getDeliveredByDisplay(item.data.deliveredBy, users) && (
                              <span className="block mt-0.5">
                                {t('deliveredBy')}: {getDeliveredByDisplay(item.data.deliveredBy, users)}
                              </span>
                            )}
                          </p>
                        </div>
                        {item.data.deliveryProofPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setImageModalUrl(item.data.deliveryProofPhotoUrl)}
                            className="flex-shrink-0 rounded border border-gray-200 overflow-hidden hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title={t('deliveryProofPhoto')}
                          >
                            <img
                              src={item.data.deliveryProofPhotoUrl}
                              alt={t('deliveryProofPhoto')}
                              className="w-12 h-12 object-cover"
                            />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${item.data.type === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {item.data.type === 'issued' ? t('issued') : t('returned')}
                      </span>
                      {item.data.type === 'issued' && (item.data.isNonReturnable || (item.data.productId && (products || []).find((p) => p.id === item.data.productId)?.isReturnable === false)) && (
                        <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                          {t('nonReturnable')}
                        </span>
                      )}
                      <span className="ml-2">
                        {item.data.quantity} {t('bottles')}
                      </span>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(item.date).toLocaleString()}
                        {item.data.notes && ` — ${item.data.notes}`}
                        {item.data.createdBy && (
                          <span className="block mt-0.5">
                            {item.data.type === 'issued' ? t('issuedBy') : t('returnedBy')}: {getUserName(item.data.createdBy)}
                          </span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              ));
            })()
          )}
        </div>
      </CollapsibleSection>

      {/* Section 4: Payments - collapsible */}
      <CollapsibleSection
        title={t('payments')}
        open={paymentsOpen}
        onToggle={() => setPaymentsOpen(!paymentsOpen)}
      >
        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {customerPayments.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">{t('noPayments')}</div>
          ) : (
            customerPayments.map((payment) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600">{t('paymentMethod')}:</span>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {payment.paymentMethod === 'bank' ? t('bankTransfer') : payment.paymentMethod === 'mobile' ? t('mobilePayment') : payment.paymentMethod === 'jazzcash' ? t('jazzcash') : payment.paymentMethod === 'other' ? t('other') : payment.paymentMethod === 'cash' ? t('cash') : (payment.paymentMethod || '').replace(/^./, (c) => c.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {payment.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(payment.createdAt).toLocaleString()}
                  {payment.createdBy && (
                    <span className="block mt-0.5">
                      {t('receivedBy')}: {getUserName(payment.createdBy)}
                    </span>
                  )}
                </p>
                {payment.notes && (
                  <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

    </div>

      {/* Delivery proof image modal - outside space-y-4 to avoid margin */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('deliveryProofPhoto')}
        >
          <button
            type="button"
            onClick={() => setImageModalUrl(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold z-10"
            aria-label={t('close')}
          >
            ×
          </button>
          <img
            src={imageModalUrl}
            alt={t('deliveryProofPhoto')}
            className="max-w-full max-h-[calc(100vh-2rem)] object-contain rounded shadow-lg m-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
