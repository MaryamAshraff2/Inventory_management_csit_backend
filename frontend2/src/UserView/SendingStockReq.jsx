import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SendingStockReqForm from "./SendingStockReqForm";
import axios from "axios";

const statusStyles = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
};

const locations = [
  "Main Warehouse",
  "IT Department",
  "Marketing Department",
  "Admin Office",
];

export default function SendingStockReq() {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all data on component mount
  useEffect(() => {
    fetchRequests();
    fetchDropdownData();
  }, []);

  // Fetch dropdown data (users, items, locations)
  const fetchDropdownData = async () => {
    try {
      const [usersRes, itemsRes, locationsRes] = await Promise.all([
        axios.get("http://localhost:8000/inventory/users/"),
        axios.get("http://localhost:8000/inventory/items/"),
        axios.get("http://localhost:8000/inventory/locations/")
      ]);
      setUsers(usersRes.data);
      setItems(itemsRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchRequests = () => {
    setLoading(true);
    setError("");
    axios
      .get("http://localhost:8000/inventory/sendingstockrequests/")
      .then((res) => {
        setRequests(res.data);
      })
      .catch((err) => {
        setError("Failed to load stock requests");
      })
      .finally(() => setLoading(false));
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      await axios.post("http://localhost:8000/inventory/sendingstockrequests/", {
        item_id: formData.item_id,
        quantity: formData.quantity,
        requested_by: formData.requested_by,
      });
      await fetchRequests(); // Refresh the requests list
    } catch (error) {
      throw error; // Re-throw to let the form handle the error display
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  return (
    // <div className="min-h-screen bg-gray-50 flex flex-col">
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Inventory Management" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <FaPaperPlane className="text-3xl text-blue-500" />
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Stock Requests</h1>
                <p className="text-gray-500 text-base font-medium">Request and track stock movements</p>
              </div>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg shadow transition-colors duration-150"
              onClick={() => setShowForm(true)}
            >
              New Request
            </button>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-700 border-b">
                    {/* <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Item</th>
                    <th className="py-3 px-4 font-semibold">Quantity</th>
                    <th className="py-3 px-4 font-semibold">Requested By</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Actions</th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th> */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 transition-colors border-b last:border-b-0"
                    >
                      <td className="py-3 px-4">{req.id}</td>
                      <td className="py-3 px-4">{req.item?.name || "-"}</td>
                      <td className="py-3 px-4">{req.quantity}</td>
                      {/* <td className="py-3 px-4">{req.requested_by }</td> */}
                      <td className="py-3 px-4">{req.requester_name }</td>
                      <td className="py-3 px-4">{req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[req.status]}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="border border-gray-300 text-black bg-white rounded-md px-3 py-1 text-xs font-medium hover:bg-gray-100 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Modal Form */}
          {showForm && (
            <SendingStockReqForm 
              onClose={handleFormClose} 
              onSubmit={handleFormSubmit}
              users={users}
              items={items}
              locations={locations}
            />
          )}
        </main>
      </div>
    </div>
  );
}
