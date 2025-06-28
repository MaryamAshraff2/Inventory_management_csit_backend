import React, { useState, useEffect } from 'react';
import { FaTimes } from "react-icons/fa";
import { itemsAPI } from '../services/api';

const AddDiscardedItemForm = ({ show, onClose, onSubmit, locations = [], users = [] }) => {
  const [filteredItems, setFilteredItems] = useState([]);
  const [formData, setFormData] = useState({
    location_id: '',
    item_id: '',
    quantity: '',
    reason: '',
    notes: '',
    discarded_by_id: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!show) return;
    setFormData({ location_id: '', item_id: '', quantity: '', reason: '', notes: '', discarded_by_id: '' });
    setErrors({});
    setFilteredItems([]);
  }, [show]);

  // Fetch items based on selected location
  useEffect(() => {
    if (formData.location_id) {
      fetchItemsAtLocation(formData.location_id);
    } else {
      setFilteredItems([]);
    }
  }, [formData.location_id]);

  const fetchItemsAtLocation = async (locationId) => {
    setLoadingItems(true);
    try {
      const response = await itemsAPI.getItemsAtLocation(locationId);
      setFilteredItems(response.items || []);
      // Reset item selection when location changes
      setFormData(prev => ({ ...prev, item_id: '' }));
    } catch (error) {
      console.error('Error fetching items at location:', error);
      setFilteredItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value, 
      ...(name === 'location_id' ? { item_id: '' } : {})
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.location_id) errs.location_id = 'Location is required';
    if (!formData.item_id) errs.item_id = 'Item is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) errs.quantity = 'Enter a valid quantity';
    if (!formData.reason) errs.reason = 'Reason is required';
    if (!formData.discarded_by_id) errs.discarded_by_id = 'Discarded by is required';
    
    // Check if quantity is available at the selected location
    if (formData.item_id && formData.quantity) {
      const selectedItem = filteredItems.find(item => String(item.item_id) === String(formData.item_id));
      if (selectedItem && Number(formData.quantity) > selectedItem.available_qty) {
        errs.quantity = `Only ${selectedItem.available_qty} units available at this location`;
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
      // Pass the form data to the parent component instead of calling API directly
      if (onSubmit) {
        await onSubmit(formData);
      }
      if (onClose) onClose();
    } catch (error) {
      let backendErrors = {};
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          backendErrors.form = error.response.data;
        } else if (typeof error.response.data === 'object') {
          Object.entries(error.response.data).forEach(([key, val]) => {
            backendErrors[key] = Array.isArray(val) ? val.join(' ') : val;
          });
        }
      } else {
        backendErrors.form = 'Failed to discard item';
      }
      setErrors(backendErrors);
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
              <h3 className="text-xl font-semibold">Discard Item</h3>
              <p className="text-gray-600 text-sm">Record the discarding of an item from a location.</p>
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
              {/* Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {errors.location_id && <div className="text-red-500 text-xs mt-1">{errors.location_id}</div>}
              </div>
              
              {/* Item Dropdown (filtered by location) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.location_id || loadingItems}
                >
                  <option value="">
                    {!formData.location_id 
                      ? 'Select location first' 
                      : loadingItems
                        ? 'Loading items...'
                        : filteredItems.length === 0 
                          ? 'No items available at this location' 
                          : 'Select item'
                    }
                  </option>
                  {filteredItems.map(item => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name} (Available: {item.available_qty})
                    </option>
                  ))}
                </select>
                {errors.item_id && <div className="text-red-500 text-xs mt-1">{errors.item_id}</div>}
                {formData.location_id && filteredItems.length === 0 && !loadingItems && (
                  <div className="text-orange-500 text-xs mt-1">No items available at this location</div>
                )}
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
                  <option value="Obsolete">Obsolete</option>
                  <option value="Expired">Expired</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && <div className="text-red-500 text-xs mt-1">{errors.reason}</div>}
              </div>
              
              {/* Discarded By Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discarded By</label>
                <select
                  name="discarded_by_id"
                  value={formData.discarded_by_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                {errors.discarded_by_id && <div className="text-red-500 text-xs mt-1">{errors.discarded_by_id}</div>}
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Discarding...' : 'Discard Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDiscardedItemForm;