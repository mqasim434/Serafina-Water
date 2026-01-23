/**
 * Water Quality List Component
 * 
 * Displays list of water quality entries
 */

import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';

/**
 * Water Quality List component
 */
export function WaterQualityList() {
  const { t } = useTranslation();
  const { items: entries, ranges } = useSelector((state) => state.waterQuality);

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t('noWaterQualityEntries')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                pH
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TDS (ppm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('chlorine')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('alerts')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.pH}
                  {entry.pH < ranges.pHMin || entry.pH > ranges.pHMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.tds}
                  {entry.tds > ranges.tdsMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.chlorine}
                  {entry.chlorine < ranges.chlorineMin || entry.chlorine > ranges.chlorineMax ? (
                    <span className="ml-1 text-red-600">⚠</span>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      entry.status
                    )}`}
                  >
                    {getStatusLabel(entry.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
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
