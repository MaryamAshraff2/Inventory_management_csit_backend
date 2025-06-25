import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FaEdit } from 'react-icons/fa';
import axios from 'axios';
import StockRequestDetailsModal from '../components/StockRequestDetailsModal';
import EditApprovedQuantityModal from '../components/EditApprovedQuantityModal';

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

const StockRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/inventory/sendingstockrequests/');
        console.log('API Response:', response.data); // Debug log
        setRequests(response.data);
      } catch (err) {
        setError('Failed to fetch stock requests.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      (req.item?.name?.toLowerCase?.() || '').includes(search.toLowerCase()) ||
      (req.requested_by?.toLowerCase?.() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Modal handlers
  const handleView = (req) => {
    setSelectedRequest(req);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
  };
  const handleApprove = async () => {
    if (selectedRequest) {
      try {
        const response = await axios.patch(
          `http://localhost:8000/inventory/sendingstockrequests/${selectedRequest.id}/`,
          { status: 'Approved' }
        );
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: response.data.status } : req
          )
        );
      } catch (err) {
        alert('Failed to approve request.');
      }
    }
    setModalOpen(false);
  };
  const handleReject = async () => {
    if (selectedRequest) {
      try {
        const response = await axios.patch(
          `http://localhost:8000/inventory/sendingstockrequests/${selectedRequest.id}/`,
          { status: 'Rejected' }
        );
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: response.data.status } : req
          )
        );
      } catch (err) {
        alert('Failed to reject request.');
      }
    }
    setModalOpen(false);
  };
  const handleModify = async () => {
    if (selectedRequest) {
      try {
        const response = await axios.patch(
          `http://localhost:8000/inventory/sendingstockrequests/${selectedRequest.id}/`,
          { status: 'Pending' }
        );
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? { ...req, status: response.data.status } : req
          )
        );
      } catch (err) {
        alert('Failed to modify request.');
      }
    }
    setModalOpen(false);
  };

  const handleEdit = (req) => {
    setEditRequest(req);
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditRequest(null);
  };
  const handleSubmitEdit = async (approvedQuantity) => {
    if (editRequest) {
      try {
        const response = await axios.patch(
          `http://localhost:8000/inventory/sendingstockrequests/${editRequest.id}/`,
          { approved_quantity: approvedQuantity, status: 'Approved' }
        );
        setRequests((prev) =>
          prev.map((req) =>
            req.id === editRequest.id ? { ...req, approved_quantity: response.data.approved_quantity, status: response.data.status } : req
          )
        );
      } catch (err) {
        alert('Failed to update approved quantity.');
      }
    }
    setEditModalOpen(false);
    setEditRequest(null);
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar title="Stock Requests Management" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Title and subtitle */}
            <div className="px-4 sm:px-6 pt-6 pb-2">
              <h1 className="text-lg font-semibold">Manage and respond to stock requests ({requests.filter(r => r.status === 'Pending').length} pending)</h1>
              
            </div>
            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4">
              <div className="flex flex-1 gap-2">
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
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">Loading stock requests...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">No requests found.</td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.item?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.quantity || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.requested_by || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>{req.status || 'Unknown'}</span>
                          </td>
                          <td className="px-4 py-3 flex gap-2 items-center">
                            <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-200 transition" onClick={() => handleView(req)}>View</button>
                            {req.status === 'Pending' && (
                              <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => handleEdit(req)}>
                                <FaEdit className="text-gray-500" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <StockRequestDetailsModal
            open={modalOpen}
            onClose={handleCloseModal}
            request={selectedRequest}
            onApprove={handleApprove}
            onReject={handleReject}
            onModify={handleModify}
          />
          <EditApprovedQuantityModal
            open={editModalOpen}
            onClose={handleCloseEditModal}
            onSubmit={handleSubmitEdit}
            itemName={editRequest?.item?.name}
            requestedQuantity={editRequest?.quantity}
            initialApprovedQuantity={editRequest?.approved_quantity || editRequest?.quantity}
          />
        </main>
      </div>
    </div>
  );
};

export default StockRequestsManagement;
