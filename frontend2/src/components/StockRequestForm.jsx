// src/components/StockRequestForm.jsx
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import axios from 'axios';

const StockRequestForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/inventory/sendingstockrequests/', formData);
      onSubmit(res.data);
      onClose();
    } catch (error) {
      alert('Failed to submit stock request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Create Stock Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-4">Submit a request to move stock between locations</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">Item Name</label>
              <input
                type="text"
                name="item_name"
                id="item_name"
                required
                placeholder="Enter item name"
                value={formData.item_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                required
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Request</label>
              <textarea
                name="reason"
                id="reason"
                placeholder="Enter reason for request"
                value={formData.reason}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockRequestForm;
