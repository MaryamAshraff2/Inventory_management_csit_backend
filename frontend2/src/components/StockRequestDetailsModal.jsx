import React from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';

const statusStyles = {
  Pending: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  Approved: 'bg-green-50 text-green-800 border border-green-200',
  Rejected: 'bg-red-50 text-red-800 border border-red-200',
};

const StockRequestDetailsModal = ({ open, onClose, request, onApprove, onReject, onModify }) => {
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative font-sans">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
        {/* Header */}
        <div className="pb-2">
          <h2 className="text-2xl font-bold text-gray-900">Stock Request Details</h2>
          <div className="text-sm text-gray-500 mt-1 mb-4">View details for request #{request.id}</div>
        </div>
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
          {/* Left column */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Item</div>
            <div className="text-base text-gray-800 mb-3">{request.item?.name || 'N/A'}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Quantity</div>
            <div className="text-base text-gray-800 mb-3">{request.quantity || 'N/A'}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">From</div>
            <div className="text-base text-gray-800 mb-3">{request.from_location || 'N/A'}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</div>
            <div className="text-base text-gray-800 mb-3">{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
          {/* Right column */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Requested By</div>
            <div className="text-base text-gray-800 mb-3">{request.requested_by || 'N/A'}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">To</div>
            <div className="text-base text-gray-800 mb-3">{request.to_location || request.to || 'N/A'}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
            <div className={`inline-block px-3 py-1 rounded-full font-bold text-xs mt-1 mb-3 ${statusStyles[request.status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>{request.status || 'Unknown'}</div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            className="flex items-center border border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            onClick={onReject}
          >
            <span className="mr-2">❌</span> Reject
          </button>
          <button
            className="flex items-center border border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            onClick={onModify}
          >
            <FaEdit className="mr-2" /> Modify
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition"
            onClick={onApprove}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockRequestDetailsModal; 