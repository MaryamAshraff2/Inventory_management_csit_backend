import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

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
  from_location_id: "",
  to_location_id: "",
  requested_by: "",
};

function SendingStockReqForm({ onClose }) {
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch users, items, and locations in parallel
    setLoading(true);
    setError("");
    Promise.all([
      axios.get("http://localhost:8000/inventory/users/"),
      axios.get("http://localhost:8000/inventory/items/"),
      axios.get("http://localhost:8000/inventory/locations/"),
    ])
      .then(([usersRes, itemsRes, locationsRes]) => {
        setUsers(usersRes.data);
        setItems(itemsRes.data);
        setLocations(locationsRes.data);
      })
      .catch((err) => {
        setError("Failed to load dropdown data");
      })
      .finally(() => setLoading(false));
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
    setSubmitting(true);
    setError("");
    try {
      await axios.post("http://localhost:8000/inventory/sendingstockrequests/", {
        item_id: form.item_id,
        quantity: form.quantity,
        requested_by: form.requested_by,
        // You may need to adjust these field names depending on your backend
        // If you want to store from/to location in the request, add them to the model/serializer
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to submit stock request. Please check your input."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">Create Stock Request</h2>
              <p className="text-gray-600 text-sm">Submit a request to move stock between locations</p>
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
                {/* From/To Location Dropdowns */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                    <select
                      name="from_location_id"
                      value={form.from_location_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                    <select
                      name="to_location_id"
                      value={form.to_location_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Requested By Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                  <select
                    name="requested_by"
                    value={form.requested_by}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
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
