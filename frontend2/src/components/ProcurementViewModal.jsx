import React from 'react';

export default function ProcurementViewModal({ procurement, onClose }) {
  if (!procurement) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2">Procurement Details</h2>
        <div className="text-gray-600 mb-4">View procurement information</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold">Order Number</div>
            <div>{procurement.order_number || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Supplier</div>
            <div>{procurement.supplier || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Order Date</div>
            <div>{procurement.order_date ? new Date(procurement.order_date).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Item</div>
            <div>{procurement.item?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Category</div>
            <div>{procurement.item?.category?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Quantity</div>
            <div>{procurement.quantity}</div>
          </div>
          <div>
            <div className="font-semibold">Unit Price</div>
            <div>{procurement.unit_price ? `$${parseFloat(procurement.unit_price).toFixed(2)}` : 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold">Total Amount</div>
            <div>{procurement.total_amount ? `$${parseFloat(procurement.total_amount).toFixed(2)}` : 'N/A'}</div>
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