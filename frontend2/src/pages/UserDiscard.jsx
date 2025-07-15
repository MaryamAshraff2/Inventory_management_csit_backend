import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AddDiscardedItemUserForm from '../components/AddDiscardedItemUserForm';
import { discardRequestsAPI, itemsAPI, usersAPI } from '../services/api';

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

const UserDiscard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch discard requests for the current user/location
  const fetchDiscardRequests = async () => {
    setLoading(true);
    try {
      const location_id = localStorage.getItem('user_location_id') || 1;
      const data = await discardRequestsAPI.getUserRequests(location_id);
      setRequests(data);
      setError(null);
    } catch (err) {
      setError('Failed to load discard requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations and users for the form (if needed)
  const fetchFormData = async () => {
    try {
      const [usersData] = await Promise.all([
        usersAPI.getAll()
      ]);
      setUsers(usersData);
    } catch (err) {
      // fallback: do nothing
    }
  };

  useEffect(() => {
    fetchDiscardRequests();
    fetchFormData();
  }, []);

  // Handle new discard request submission
  const handleNewRequest = async (formData) => {
    try {
      // Always use numeric location_id from localStorage
      const location_id = localStorage.getItem('user_location_id') || 1;
      const payload = {
        item_id: formData.item_id,
        quantity: formData.quantity,
        reason: formData.reason,
        notes: formData.notes,
        location_id: Number(location_id),
        requested_by_id: localStorage.getItem('portalID') || 'user',
      };
      await discardRequestsAPI.createUserRequest(payload);
      setFormModalOpen(false);
      fetchDiscardRequests();
    } catch (err) {
      alert('Failed to create discard request.');
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = (req.item?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Discard Requests" />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* New Discard Request Button */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Discard Requests</h2>
              <button
                onClick={() => setFormModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                New Discard Request
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200 w-full">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                Submitted Requests ({requests.filter(r => r.status === 'Pending').length} pending)
              </h2>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4">
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading requests...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <button 
                    onClick={fetchDiscardRequests}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">No requests found.</td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-800">{req.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.item?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.quantity || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.date ? formatDate(req.date) : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>{req.status || 'Pending'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                            <button onClick={() => setSelectedRequest(req)} className="hover:underline">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Form Modal */}
          {formModalOpen && (
            <AddDiscardedItemUserForm
              show={formModalOpen}
              onClose={() => setFormModalOpen(false)}
              onSubmit={handleNewRequest}
              locations={locations}
              users={users}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDiscard;
