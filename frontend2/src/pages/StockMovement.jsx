import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FaPlus } from 'react-icons/fa';
import StockMovementForm from '../components/StockMovementForm';

const StockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('item');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, []);

  // Fetch movements function for reuse
  const fetchMovements = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/inventory/stockmovements/');
      setMovements(response.data);
    } catch (error) {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredMovements = movements.filter((movement) => {
    const term = searchTerm.toLowerCase();
    if (filterBy === 'item') {
      return (movement.item?.name || '').toLowerCase().includes(term);
    } else if (filterBy === 'user') {
      return (movement.received_by?.name || movement.receivedBy || '').toLowerCase().includes(term);
    } else if (filterBy === 'location') {
      return (
        (movement.from_location?.name || movement.from || '').toLowerCase().includes(term) ||
        (movement.to_location?.name || movement.to || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Dynamic placeholder for search bar
  const getSearchPlaceholder = () => {
    if (filterBy === 'item') return 'Search items...';
    if (filterBy === 'user') return 'Search users...';
    if (filterBy === 'location') return 'Search locations...';
    return 'Search...';
  };

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar title="Stock Movement Management" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Header and Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b">
              <h3 className="text-lg font-semibold mb-2 sm:mb-0">Manage Stock Movements</h3>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <span className="mr-2">+</span>
                Add New Movement
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-6 py-4 items-center justify-between">
              <div className="flex-1">
                <div className="flex border rounded-md overflow-hidden">
                  <select
                    value={filterBy}
                    onChange={(e) => {
                      setFilterBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border-0"
                  >
                    <option value="item">By Item</option>
                    <option value="user">By User</option>
                    <option value="location">By Location</option>
                  </select>
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none border-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-3 py-2 text-sm"
                >
                  {[10, 20, 50].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">Loading movements...</td>
                    </tr>
                  ) : paginatedMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">No stock movements found.</td>
                    </tr>
                  ) : (
                    paginatedMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{movement.item?.name || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{movement.from_location?.name || movement.from || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{movement.to_location?.name || movement.to || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{movement.quantity}</td>
                        
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{movement.date ? movement.date.slice(0, 10) : ''}</td> */}
                        {movement.movement_date ? movement.movement_date.slice(0, 10) : ''}

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{movement.received_by?.name || movement.receivedBy || ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 px-4 sm:px-6 pb-4">
              <div className="text-sm text-gray-600">
                Showing {filteredMovements.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredMovements.length)} of {filteredMovements.length} movements
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <StockMovementForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async () => {
          setShowForm(false);
          await fetchMovements();
        }}
      />
    </div>
  );
};

export default StockMovement;
