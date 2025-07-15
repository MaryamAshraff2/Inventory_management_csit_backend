// import React, { useEffect, useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
// import StockRequestForm from '../components/StockRequestForm';
// import StockRequestDetails from '../components/StockRequestDetails';
// import axios from 'axios';

// const statusColors = {
//   Approved: 'bg-green-100 text-green-800',
//   Pending: 'bg-yellow-100 text-yellow-800',
//   Rejected: 'bg-red-100 text-red-800',
// };

// const UserStockRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);

//   // Fetch requests
//   const fetchUserRequests = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get('http://localhost:8000/inventory/sendingstockrequests/');
//       setRequests(res.data || []);
//     } catch (err) {
//       setError('Failed to load requests.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUserRequests();
//   }, []);

//   const handleView = (req) => {
//     setSelectedRequest(req);
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setSelectedRequest(null);
//     setModalOpen(false);
//   };

//   const handleNewRequest = async (newRequestData) => {
//     try {
//       const response = await axios.post('http://localhost:8000/inventory/sendingstockrequests/', newRequestData);
//       setRequests((prev) => [response.data, ...prev]);
//     } catch (err) {
//       alert('Failed to submit request.');
//     }
//   };

//   const filteredRequests = requests.filter((req) => {
//     const matchesSearch = (req.item?.name || '').toLowerCase().includes(search.toLowerCase());
//     const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="flex w-full min-h-screen bg-gray-100">
//       <Sidebar />
//       <div className="flex-1 flex flex-col">
//         <Navbar title="My Stock Requests" />
//         <main className="flex-1 p-6 overflow-y-auto space-y-6">
//           {/* Request Form */}
//           <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">New Stock Request</h2>
//             <StockRequestForm onSubmit={handleNewRequest} />
//           </div>

//           {/* Submitted Requests Table */}
//           <div className="bg-white rounded-lg shadow border border-gray-200 w-full">
//             <div className="px-6 pt-6 pb-2">
//               <h2 className="text-lg font-semibold text-gray-800">
//                 Submitted Requests ({requests.filter(r => r.status === 'Pending').length} pending)
//               </h2>
//             </div>

//             {/* Search and Filter */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4">
//               <input
//                 type="text"
//                 placeholder="Search requests..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="border rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="All">All Statuses</option>
//                 <option value="Approved">Approved</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Rejected">Rejected</option>
//               </select>
//             </div>

//             {/* Table */}
//             <div className="overflow-x-auto">
//               {loading ? (
//                 <div className="text-center py-6">Loading...</div>
//               ) : error ? (
//                 <div className="text-center text-red-500 py-6">{error}</div>
//               ) : (
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {filteredRequests.length === 0 ? (
//                       <tr>
//                         <td colSpan="6" className="text-center py-8 text-gray-500">No requests found.</td>
//                       </tr>
//                     ) : (
//                       filteredRequests.map((req) => (
//                         <tr key={req.id} className="hover:bg-gray-50 transition">
//                           <td className="px-4 py-3 text-sm text-gray-800">{req.id}</td>
//                           <td className="px-4 py-3 text-sm text-gray-700">{req.item?.name || 'N/A'}</td>
//                           <td className="px-4 py-3 text-sm text-gray-700">{req.quantity || 0}</td>
//                           <td className="px-4 py-3 text-sm text-gray-700">
//                             {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
//                           </td>
//                           <td className="px-4 py-3">
//                             <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
//                               {req.status || 'Pending'}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-sm text-blue-600 font-medium">
//                             <button onClick={() => handleView(req)} className="hover:underline">View</button>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>

//           {/* View Modal */}
//           {modalOpen && selectedRequest && (
//             <StockRequestDetails
//               open={modalOpen}
//               onClose={handleCloseModal}
//               request={selectedRequest}
//             />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserStockRequests;
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SendingStockReqForm from '../UserView/SendingStockReqForm';
import StockRequestDetails from '../components/StockRequestDetails';

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};



const UserStockRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch stock requests from API
  const fetchStockRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/inventory/user/stock-requests/');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('Failed to load stock requests');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available items for lab1 only
  const fetchFormData = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/user/available-items/?location=lab1');
      if (response.ok) {
        const itemsData = await response.json();
        setAvailableItems(itemsData);
      }
      // No need to fetch locations, as location is fixed to lab1
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  useEffect(() => {
    fetchStockRequests();
    fetchFormData();
  }, []);

  // Handle new stock request submission
  const handleNewRequest = async (newRequestData) => {
    try {
      const response = await fetch('http://localhost:8000/inventory/user/create-stock-request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item: newRequestData.item_id,
          quantity: newRequestData.quantity,
          location: 'lab1',
          requester: localStorage.getItem('portalID') || 'user',
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setRequests([newRequest, ...requests]);
        setFormModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create stock request');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = (req.item?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Stock Requests" />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Request Form Button */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Stock Requests</h2>
              <button
                onClick={() => setFormModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                New Stock Request
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
                    onClick={fetchStockRequests}
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
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                              {req.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                            <button onClick={() => {
                              setSelectedRequest(req);
                              setModalOpen(true);
                            }} className="hover:underline">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Modal */}
          {modalOpen && selectedRequest && (
            <StockRequestDetails
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              request={selectedRequest}
            />
          )}

          {/* Form Modal */}
          {formModalOpen && (
            <SendingStockReqForm 
              onSubmit={handleNewRequest}
              onClose={() => setFormModalOpen(false)}
              items={availableItems}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default UserStockRequests;
