import React from 'react';
import { FiX } from 'react-icons/fi';

const statusColors = {
  Approved: 'text-green-700 bg-green-100',
  Pending: 'text-yellow-700 bg-yellow-100',
  Rejected: 'text-red-700 bg-red-100',
};

const StockRequestDetails = ({ open, request, onClose }) => {
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold">Stock Request Details</h2>
            <p className="text-gray-800">{request.item || 'N/A'}</p>

          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Item</h4>
            <p className="text-gray-800">{request.item?.name || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Quantity</h4>
            <p className="text-gray-800">{request.quantity || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Requested By</h4>
            <p className="text-gray-800">{request.requested_by || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Date</h4>
            <p className="text-gray-800">{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Reason</h4>
            <p className="text-gray-800">{request.reason || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500 font-medium mb-1">Status</h4>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
              {request.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockRequestDetails;
