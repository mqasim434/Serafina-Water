/**
 * Water Quality List Component
 * 
 * Displays list of water quality entries
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { formatTime12h } from '../service.js';

/**
 * Water Quality List component
 */
export function WaterQualityList() {
  const { t } = useTranslation();
  const { items: entries, ranges } = useSelector((state) => state.waterQuality);

  const sortedEntries = [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = (b.time || '').localeCompare(a.time || '', undefined, { numeric: true });
    if (timeDiff !== 0) return timeDiff;
    // Same date and time: use createdAt (ISO timestamp with ms) so most recent entry appears first
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'critical':
        return t('critical');
      case 'warning':
        return t('warning');
      default:
        return t('normal');
    }
  };

  if (sortedEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
        {t('noWaterQualityEntries')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Mobile card layout */}
      <div className="block sm:hidden divide-y divide-gray-200">
        {sortedEntries.map((entry) => (
          <div key={entry.id} className="p-4 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {new Date(entry.date).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500">
                {entry.time ? formatTime12h(entry.time) : 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">pH:</span>
                <span className="ml-1 font-medium">
                  {entry.pH}
                  {(entry.pH < ranges.pHMin || entry.pH > ranges.pHMax) && <span className="text-red-600"> ⚠</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500">TDS:</span>
                <span className="ml-1 font-medium">
                  {entry.tds}
                  {entry.tds > ranges.tdsMax && <span className="text-red-600"> ⚠</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('chlorine')}:</span>
                <span className="ml-1 font-medium">
                  {entry.chlorine}
                  {(entry.chlorine < ranges.chlorineMin || entry.chlorine > ranges.chlorineMax) && <span className="text-red-600"> ⚠</span>}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                  entry.status
                )}`}
              >
                {getStatusLabel(entry.status)}
              </span>
              {entry.alerts && entry.alerts.length > 0 ? (
                <span className="text-xs text-amber-700 font-medium">
                  {entry.alerts.length} {t('alerts')}
                </span>
              ) : (
                <span className="text-xs text-green-600">{t('allNormal')}</span>
              )}
            </div>
            {entry.alerts && entry.alerts.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-gray-100">
                {entry.alerts.slice(0, 2).map((alert, index) => (
                  <div
                    key={index}
                    className={`text-xs ${
                      alert.startsWith('CRITICAL') ? 'text-red-700 font-semibold' : 'text-yellow-700'
                    }`}
                  >
                    {alert}
                  </div>
                ))}
                {entry.alerts.length > 2 && (
                  <div className="text-xs text-gray-500">+{entry.alerts.length - 2} more</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('time') || 'Time'}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                pH
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TDS (ppm)
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('chlorine')}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('alerts')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.time ? formatTime12h(entry.time) : 'N/A'}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.pH}
                  {entry.pH < ranges.pHMin || entry.pH > ranges.pHMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.tds}
                  {entry.tds > ranges.tdsMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.chlorine}
                  {entry.chlorine < ranges.chlorineMin || entry.chlorine > ranges.chlorineMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      entry.status
                    )}`}
                  >
                    {getStatusLabel(entry.status)}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {entry.alerts && entry.alerts.length > 0 ? (
                    <div className="space-y-1">
                      {entry.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`text-xs ${
                            alert.startsWith('CRITICAL')
                              ? 'text-red-700 font-semibold'
                              : 'text-yellow-700'
                          }`}
                        >
                          {alert}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-green-600">{t('allNormal')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
