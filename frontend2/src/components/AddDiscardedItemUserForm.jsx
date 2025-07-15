import React, { useState, useEffect } from 'react';
import { FaTimes } from "react-icons/fa";
import { itemsAPI } from '../services/api';

const AddDiscardedItemUserForm = ({ show, onClose, onSubmit, locations = [], users = [] }) => {
  const [filteredItems, setFilteredItems] = useState([]);
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
    reason: '',
    notes: '',
    discarded_by_id: localStorage.getItem('portalID') || 'user',
    location_id: localStorage.getItem('user_location_id') || 1,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    // Get user location ID from localStorage or default to 1
    const userLocationId = localStorage.getItem('user_location_id') || 1;
    const fetchItems = async () => {
      try {
        const response = await itemsAPI.getItemsAtLocation(userLocationId);
        setFilteredItems(response.items || []);
      } catch (error) {
        setFilteredItems([]);
      }
    };
    fetchItems();
    setFormData({
      item_id: '',
      quantity: '',
      reason: '',
      notes: '',
      discarded_by_id: localStorage.getItem('portalID') || 'user',
      location_id: userLocationId,
    });
    setErrors({});
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) errs.quantity = 'Enter a valid quantity';
    if (!formData.reason) errs.reason = 'Reason is required';
    if (!formData.discarded_by_id) errs.discarded_by_id = 'Discarded by is required';
    // Check if quantity is available for the selected item
    if (formData.item_id && formData.quantity) {
      const selectedItem = filteredItems.find(item => String(item.item_id) === String(formData.item_id));
      if (selectedItem && Number(formData.quantity) > selectedItem.available_qty) {
        errs.quantity = `Only ${selectedItem.available_qty} units available`;
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      if (onClose) onClose();
    } catch (error) {
      setErrors({ form: 'Failed to submit discard request.' });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Discard Item (Lab 1)</h3>
              <p className="text-gray-600 text-sm">Record the discarding of an item from Lab 1.</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
          </div>
          <form onSubmit={handleSubmit}>
            {errors.form && (
              <div className="mb-4 text-red-600 text-sm text-center font-semibold border border-red-200 bg-red-50 rounded p-2">
                {errors.form}
              </div>
            )}
            <div className="space-y-4">
              {/* Item Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select item</option>
                  {filteredItems.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name} (Available: {item.available_qty})
                    </option>
                  ))}
                </select>
                {errors.item_id && <div className="text-red-500 text-xs mt-1">{errors.item_id}</div>}
              </div>
              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
                {errors.quantity && <div className="text-red-500 text-xs mt-1">{errors.quantity}</div>}
                {formData.item_id && (
                  <div className="text-gray-500 text-xs mt-1">
                    Available: {filteredItems.find(item => String(item.item_id) === String(formData.item_id))?.available_qty || 0} units
                  </div>
                )}
              </div>
              {/* Reason Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Expired">Expired</option>
                  <option value="Obsolete">Obsolete</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && <div className="text-red-500 text-xs mt-1">{errors.reason}</div>}
              </div>
              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter notes (optional)"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Discard Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDiscardedItemUserForm; 