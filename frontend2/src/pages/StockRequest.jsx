import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FaEdit } from 'react-icons/fa';
import axios from 'axios';
import StockRequestDetailsModal from '../components/StockRequestDetailsModal';
import EditApprovedQuantityModal from '../components/EditApprovedQuantityModal';
import { discardedItemsAPI, discardRequestsAPI } from '../services/api';

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

const StockRequestsManagement = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [requests, setRequests] = useState([]);
  const [discardRequests, setDiscardRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discardLoading, setDiscardLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discardError, setDiscardError] = useState(null);
  const [search, setSearch] = useState('');
  const [discardSearch, setDiscardSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [discardStatusFilter, setDiscardStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [pendingDiscardRequests, setPendingDiscardRequests] = useState([]);
  const [pendingDiscardLoading, setPendingDiscardLoading] = useState(true);
  const [pendingDiscardError, setPendingDiscardError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [processingError, setProcessingError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/inventory/sendingstockrequests/');
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

  useEffect(() => {
    const fetchDiscardRequests = async () => {
      setDiscardLoading(true);
      setDiscardError(null);
      try {
        const data = await discardedItemsAPI.getAll();
        setDiscardRequests(data);
      } catch (err) {
        setDiscardError('Failed to fetch discard requests.');
        setDiscardRequests([]);
      } finally {
        setDiscardLoading(false);
      }
    };
    fetchDiscardRequests();
  }, []);

  useEffect(() => {
    const fetchPendingDiscardRequests = async () => {
      setPendingDiscardLoading(true);
      setPendingDiscardError(null);
      try {
        const data = await discardRequestsAPI.getAdminPendingRequests();
        setPendingDiscardRequests(data);
      } catch (err) {
        setPendingDiscardError('Failed to fetch pending discard requests.');
        setPendingDiscardRequests([]);
      } finally {
        setPendingDiscardLoading(false);
      }
    };
    fetchPendingDiscardRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      (req.item?.name?.toLowerCase?.() || '').includes(search.toLowerCase()) ||
      (req.requested_by?.toLowerCase?.() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDiscardRequests = discardRequests.filter((req) => {
    const matchesSearch =
      (req.item?.name?.toLowerCase?.() || '').includes(discardSearch.toLowerCase()) ||
      (req.discarded_by?.name?.toLowerCase?.() || '').includes(discardSearch.toLowerCase());
    const matchesStatus = discardStatusFilter === 'All' || req.status === discardStatusFilter;
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

  // Approve/Reject handlers for discard requests
  const handleApproveDiscard = async (id) => {
    setProcessingRequestId(id);
    setProcessingError(null);
    try {
      await discardRequestsAPI.processAdminRequest(id, 'approve');
      setPendingDiscardRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      setProcessingError('Failed to approve request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectDiscard = async (id) => {
    setProcessingRequestId(id);
    setProcessingError(null);
    try {
      await discardRequestsAPI.processAdminRequest(id, 'reject');
      setPendingDiscardRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      setProcessingError('Failed to reject request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar title="Stock Requests Management" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">
                  View and manage stock requests
                </h3>
              </div>
            </div>
            {/* Tabs */}
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('stock')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === 'stock'
                      ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Stock Requests
                </button>
                <button
                  onClick={() => setActiveTab('discard')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === 'discard'
                      ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Discard Requests
                </button>
              </div>
            </div>
            {/* Tab Content */}
            {activeTab === 'stock' && (
              <>
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
                                <button
                                  className="text-blue-600 border border-blue-600 rounded px-3 py-1 text-xs font-medium hover:bg-blue-600 hover:text-white transition-colors"
                                  onClick={() => handleView(req)}
                                >
                                  View
                                </button>
                                {req.status === 'Pending' && (
                                  <button
                                    className="border border-gray-300 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    onClick={() => handleEdit(req)}
                                  >
                                    <FaEdit className="text-gray-600" />
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
              </>
            )}
            {activeTab === 'discard' && (
              <>
                <div className="px-4 sm:px-6 pt-6 pb-2">
                  <h1 className="text-lg font-semibold">Manage and respond to discard requests ({pendingDiscardRequests.filter(r => r.status === 'pending').length} pending)</h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4">
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      placeholder="Search pending discard requests..."
                      value={discardSearch}
                      onChange={(e) => setDiscardSearch(e.target.value)}
                      className="border rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {pendingDiscardLoading ? (
                    <div className="text-center py-8">Loading pending discard requests...</div>
                  ) : pendingDiscardError ? (
                    <div className="text-center py-8 text-red-500">{pendingDiscardError}</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingDiscardRequests.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-gray-500">No pending discard requests found.</td>
                          </tr>
                        ) : (
                          pendingDiscardRequests
                            .filter((req) => {
                              const matchesSearch = (req.item?.name || '').toLowerCase().includes(discardSearch.toLowerCase());
                              return matchesSearch;
                            })
                            .map((req) => (
                              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.id || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.item?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.quantity || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.location?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.reason || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.requested_by?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{req.date_requested ? new Date(req.date_requested).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800`}>Pending</span>
                                </td>
                                <td className="px-4 py-3 flex gap-2 items-center">
                                  <button
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                    onClick={() => handleApproveDiscard(req.id)}
                                    disabled={processingRequestId === req.id}
                                  >
                                    {processingRequestId === req.id ? 'Approving...' : 'Approve'}
                                  </button>
                                  <button
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                    onClick={() => handleRejectDiscard(req.id)}
                                    disabled={processingRequestId === req.id}
                                  >
                                    {processingRequestId === req.id ? 'Rejecting...' : 'Reject'}
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                {processingError && (
                  <div className="text-center py-2 text-red-500">{processingError}</div>
                )}
                {/* Existing processed discard requests table can be left below or removed as needed */}
              </>
            )}
          </div>
          {/* Modals for stock requests only (not for discard requests yet) */}
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
