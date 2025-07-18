import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { itemsAPI } from '../services/api';

const StockMovementForm = ({ show, onClose, onSubmit, items = [], locations = [], users = [] }) => {
  const [formData, setFormData] = useState({
    item_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: '',
    received_by_id: '',
    notes: ''
  });
  const [availableQty, setAvailableQty] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [filteredFromLocations, setFilteredFromLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Reset form when shown
  useEffect(() => {
    if (show) {
      setFormData({
        item_id: '',
        from_location_id: '',
        to_location_id: '',
        quantity: '',
        received_by_id: '',
        notes: ''
      });
      setAvailableQty(null);
      setErrors({});
      setFilteredFromLocations([]);
    }
  }, [show]);

  // Fetch locations with stock when item is selected
  useEffect(() => {
    if (formData.item_id) {
      fetchLocationsWithStock(formData.item_id);
    } else {
      setFilteredFromLocations([]);
      setFormData(prev => ({ ...prev, from_location_id: '' }));
    }
  }, [formData.item_id]);

  const fetchLocationsWithStock = async (itemId) => {
    setLoadingLocations(true);
    try {
      const response = await itemsAPI.getLocationsWithStock(itemId);
      setFilteredFromLocations(response.locations || []);
      // Clear from_location_id if the current selection is not in the filtered list
      if (formData.from_location_id) {
        const currentLocationExists = response.locations.some(loc => loc.id === parseInt(formData.from_location_id));
        if (!currentLocationExists) {
          setFormData(prev => ({ ...prev, from_location_id: '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching locations with stock:', error);
      setFilteredFromLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    
    // Clear dependent fields when item changes
    if (name === 'item_id') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        from_location_id: '',
        to_location_id: '',
        quantity: ''
      }));
      setAvailableQty(null);
    }
    
    // Clear quantity when from_location changes
    if (name === 'from_location_id') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        quantity: ''
      }));
      setAvailableQty(null);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item is required';
    if (!formData.from_location_id) errs.from_location_id = 'Source location is required';
    if (!formData.to_location_id) errs.to_location_id = 'Destination location is required';
    if (formData.from_location_id && formData.to_location_id && formData.from_location_id === formData.to_location_id) errs.to_location_id = 'Source and destination must differ';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) errs.quantity = 'Enter a valid quantity';
    if (availableQty !== null && Number(formData.quantity) > availableQty) errs.quantity = `Cannot exceed available (${availableQty})`;
    if (!formData.received_by_id) errs.received_by_id = 'Receiver is required';
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
      // Pass form data to parent component instead of making API calls here
      if (onSubmit) {
        await onSubmit(formData);
      }
      if (onClose) onClose();
    } catch (error) {
      console.error('Stock movement error:', error.response?.data || error.message);
      // Show all error messages from backend
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
        backendErrors.form = 'Failed to record movement';
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
              <h3 className="text-xl font-semibold">Record Stock Movement</h3>
              <p className="text-gray-600 text-sm">Record the movement of items between locations.</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
          </div>
          <form onSubmit={handleSubmit}>
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
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                {errors.item_id && <div className="text-red-500 text-xs mt-1">{errors.item_id}</div>}
              </div>
              {/* From Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                <select
                  name="from_location_id"
                  value={formData.from_location_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.item_id || loadingLocations}
                >
                  <option value="">
                    {!formData.item_id 
                      ? 'Select an item first' 
                      : loadingLocations 
                        ? 'Loading locations...' 
                        : 'Select source location'
                    }
                  </option>
                  {filteredFromLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.available_quantity} available)
                    </option>
                  ))}
                </select>
                {errors.from_location_id && <div className="text-red-500 text-xs mt-1">{errors.from_location_id}</div>}
                {formData.item_id && filteredFromLocations.length === 0 && !loadingLocations && (
                  <div className="text-orange-500 text-xs mt-1">No locations have stock for this item</div>
                )}
              </div>
              {/* To Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                <select
                  name="to_location_id"
                  value={formData.to_location_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select destination location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {errors.to_location_id && <div className="text-red-500 text-xs mt-1">{errors.to_location_id}</div>}
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
                {availableQty !== null && (
                  <div className="text-xs text-gray-500 mt-1">Available in source: {availableQty}</div>
                )}
                {errors.quantity && <div className="text-red-500 text-xs mt-1">{errors.quantity}</div>}
              </div>
              {/* Received By Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                <select
                  name="received_by_id"
                  value={formData.received_by_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select receiver</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                {errors.received_by_id && <div className="text-red-500 text-xs mt-1">{errors.received_by_id}</div>}
              </div>
              {/* Notes Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              {errors.form && <div className="text-red-500 text-sm mt-2">{errors.form}</div>}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Recording...' : 'Record Movement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockMovementForm;
