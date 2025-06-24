import React from 'react';

export default function ProcurementViewModal({ procurement, onClose }) {
  if (!procurement) return null;
  
  // Calculate total amount from items
  const totalAmount = procurement.items ? 
    procurement.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">Procurement Details</h2>
        <div className="text-gray-600 mb-4">View procurement information</div>
        
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <div className="font-semibold">Order Number</div>
            <div>{procurement.order_number || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Supplier</div>
            <div>{procurement.supplier || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Procurement Type</div>
            <div>{procurement.procurement_type || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Order Date</div>
            <div>{procurement.order_date ? new Date(procurement.order_date).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Document Type</div>
            <div>{procurement.document_type || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Total Amount</div>
            <div className="font-bold text-lg">${totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-semibold">Document</div>
            <div>
              {procurement.document ? (
                <a href={procurement.document} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
              ) : 'No document'}
            </div>
          </div>
          <div>
            <div className="font-semibold">Created At</div>
            <div>{procurement.created_at ? new Date(procurement.created_at).toLocaleString() : 'N/A'}</div>
          </div>
        </div>

        {/* Items Table */}
        {procurement.items && procurement.items.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {procurement.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.item_name || item.item?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 