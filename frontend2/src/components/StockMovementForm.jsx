import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

const API_BASE = 'http://localhost:8000/inventory';

const StockMovementForm = ({ show, onClose, onSubmit }) => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    item_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: '',
    movement_date: new Date().toISOString().split('T')[0],
    received_by_id: '',
    notes: ''
  });
  const [availableQty, setAvailableQty] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    if (!show) return;
    axios.get(`${API_BASE}/items/`).then(res => setItems(res.data));
    axios.get(`${API_BASE}/locations/`).then(res => setLocations(res.data));
    axios.get(`${API_BASE}/users/`).then(res => setUsers(res.data));
    setFormData(f => ({ ...f, item_id: '', from_location_id: '', to_location_id: '', quantity: '', received_by_id: '', notes: '' }));
    setAvailableQty(null);
    setErrors({});
  }, [show]);

  // Fetch available quantity for selected item/location
  useEffect(() => {
    if (formData.item_id && formData.from_location_id) {
      // You may need a custom endpoint for item quantity at a location. For now, fallback to item.quantity
      const item = items.find(i => i.id === Number(formData.item_id));
      setAvailableQty(item ? item.quantity : null);
    } else {
      setAvailableQty(null);
    }
  }, [formData.item_id, formData.from_location_id, items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item is required';
    if (!formData.from_location_id) errs.from_location_id = 'Source location is required';
    if (!formData.to_location_id) errs.to_location_id = 'Destination location is required';
    if (formData.from_location_id && formData.to_location_id && formData.from_location_id === formData.to_location_id) errs.to_location_id = 'Source and destination must differ';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) errs.quantity = 'Enter a valid quantity';
    if (availableQty !== null && Number(formData.quantity) > availableQty) errs.quantity = `Cannot exceed available (${availableQty})`;
    if (!formData.movement_date) errs.movement_date = 'Date is required';
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
      await axios.post(`${API_BASE}/stockmovements/`, formData);
      if (onSubmit) onSubmit();
      if (onClose) onClose();
    } catch (error) {
      setErrors({ form: error.response?.data?.detail || 'Failed to record movement' });
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
                >
                  <option value="">Select source location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {errors.from_location_id && <div className="text-red-500 text-xs mt-1">{errors.from_location_id}</div>}
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
              {/* Movement Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Movement Date</label>
                <input
                  type="date"
                  name="movement_date"
                  value={formData.movement_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {errors.movement_date && <div className="text-red-500 text-xs mt-1">{errors.movement_date}</div>}
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
