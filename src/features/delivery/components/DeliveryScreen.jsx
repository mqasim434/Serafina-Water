/**
 * Delivery Screen – single order delivery: customer, address, items, balance, collect payment, proof photo, mark delivered.
 */

import { useState, useRef } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import { ordersService } from '../../orders/slice.js';
import { isImageKitConfigured, uploadDeliveryProof } from '../imagekit.js';

/**
 * @param {Object} props
 * @param {import('../../orders/types.js').Order} props.order
 * @param {import('../../customers/types.js').Customer} props.customer
 * @param {import('../../products/types.js').Product[]} props.products
 * @param {function(Object): Promise<void>} props.onDelivered - (result) => {}
 * @param {function(): void} props.onBack
 * @param {boolean} props.isLoading
 * @param {string} props.userId
 */
export function DeliveryScreen({ order, customer, products, onDelivered, onBack, isLoading, userId }) {
  const { t } = useTranslation();
  const [amountPaid, setAmountPaid] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const outstanding = order.outstandingAmount ?? 0;
  const lineItems = ordersService.getOrderLineItems(order);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    let photoUrl = null;
    let fileId = null;
    if (isImageKitConfigured()) {
      if (!photoFile) {
        setSubmitError(t('deliveryProofRequired') || 'Delivery proof photo is required.');
        setIsSubmitting(false);
        return;
      }
      try {
        const result = await uploadDeliveryProof(photoFile);
        photoUrl = result.url;
        fileId = result.fileId;
      } catch (err) {
        setSubmitError(err.message || 'Failed to upload photo');
        setIsSubmitting(false);
        return;
      }
    }
    const paid = parseFloat(amountPaid) || 0;
    if (paid > outstanding) {
      setSubmitError(t('amountExceedsBalance') || 'Amount cannot exceed balance');
      setIsSubmitting(false);
      return;
    }
    try {
      await onDelivered({
        amountPaid: paid,
        deliveryProofPhotoUrl: photoUrl,
        deliveryProofFileId: fileId,
        deliveredBy: userId,
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to mark delivered');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        ← {t('back')}
      </button>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('delivery')} – {t('order')} #{order.orderNumber}
        </h2>
        {customer && (
          <>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('customer')}</p>
              <p className="text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-600">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('address')}</p>
              <p className="text-gray-900 whitespace-pre-wrap">{customer.address}</p>
            </div>
          </>
        )}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{t('orderItems') || 'Items'}</p>
          <ul className="text-sm text-gray-900 space-y-0.5">
            {lineItems.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const name = product ? `${product.name} (${product.size})` : item.productId;
              return (
                <li key={item.productId}>
                  {name} × {item.quantity} — Rs. {(item.quantity * (item.price || 0)).toLocaleString()}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-500">{t('outstandingAmount')}</p>
          <p className="text-lg font-bold text-gray-900">Rs. {outstanding.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('amountPaid')} ({t('cash')}) (Rs.)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            max={outstanding}
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0"
          />
        </div>

        {isImageKitConfigured() ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('deliveryProofPhoto')} <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-h-48 rounded border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="mt-2 text-sm text-amber-600 hover:text-amber-700"
                >
                  {t('retakePhoto') || 'Retake photo'}
                </button>
              </div>
            )}
            {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {t('imageKitNotConfigured') || 'Photo upload not configured. Set ImageKit env to enable delivery proof.'}
          </p>
        )}

        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{submitError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <LoadingButton type="button" variant="secondary" onClick={onBack} disabled={isSubmitting || isLoading}>
            {t('cancel')}
          </LoadingButton>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting || isLoading}
            variant="success"
            disabled={isSubmitting || isLoading || (isImageKitConfigured() && !photoFile)}
          >
            {t('markDelivered')}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
