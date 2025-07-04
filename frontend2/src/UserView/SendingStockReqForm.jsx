import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

// Example locations for demonstration
const defaultLocations = [
  "Main Warehouse",
  "IT Department",
  "Marketing Department",
  "Admin Office",
];

const initialForm = {
  item_id: "",
  quantity: 0,
};

function SendingStockReqForm({ onClose, onSubmit, items = [] }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when shown
  useEffect(() => {
    setForm(initialForm);
    setError("");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Pass form data to parent component instead of making API calls here
      if (onSubmit) {
        await onSubmit(form);
      }
      if (onClose) onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to submit stock request. Please check your input."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">Create Stock Request</h2>
              <p className="text-gray-600 text-sm">Submit a request for stock items</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-500 text-center mb-4">{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Item Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select
                    name="item_id"
                    value={form.item_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Enter quantity"
                    value={form.quantity || ""}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendingStockReqForm;
