import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const EditApprovedQuantityModal = ({ open, onClose, onSubmit, itemName, requestedQuantity, initialApprovedQuantity }) => {
  const [approvedQuantity, setApprovedQuantity] = useState(initialApprovedQuantity || '');

  useEffect(() => {
    setApprovedQuantity(initialApprovedQuantity || '');
  }, [initialApprovedQuantity, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative font-sans">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg p-2 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>
        {/* Header */}
        <div className="pb-2">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Modify Request</h2>
          <div className="text-sm text-gray-500 mb-4">Adjust the quantity before approving</div>
        </div>
        {/* Item info */}
        <div className="mb-4">
          <div className="font-medium text-gray-800 mb-1">Item: {itemName}</div>
          <div className="text-gray-600 text-sm mb-2">Requested: {requestedQuantity} units</div>
        </div>
        {/* Approved Quantity Field */}
        <div className="mb-6">
          <label className="block text-[#333] text-[14px] font-medium mb-1.5" htmlFor="approved-quantity">Approved Quantity</label>
          <input
            id="approved-quantity"
            type="number"
            min={1}
            value={approvedQuantity}
            onChange={e => setApprovedQuantity(e.target.value)}
            className="w-full h-10 border border-[#ccc] rounded-lg px-3 py-2 text-[14px] text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ marginBottom: 6 }}
          />
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-2">
          <button
            className="h-10 px-5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-10 px-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => onSubmit(Number(approvedQuantity))}
            disabled={!approvedQuantity || Number(approvedQuantity) < 1}
          >
            Approve Modified Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditApprovedQuantityModal; 