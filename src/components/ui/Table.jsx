import React from 'react';

/**
 * Reusable Data Table Component Template
 */
export default function Table({
  headers = [],
  data = [],
  renderRow,
  isLoading = false,
  emptyMessage = 'Tidak ada data ditemukan.',
}) {
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-3.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin"></div>
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
