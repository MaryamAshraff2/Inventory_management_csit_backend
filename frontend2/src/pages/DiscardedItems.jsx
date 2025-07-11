import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AddDiscardedItemForm from "../components/AddDiscardedItemForm";
import { discardedItemsAPI, itemsAPI } from "../services/api";
import axios from 'axios';

const API_BASE = 'http://localhost:8000/inventory';

const DiscardedItems = () => {
  const [discardedItems, setDiscardedItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all data on component mount
  useEffect(() => {
    fetchDiscardedItems();
    fetchDropdownData();
  }, []);

  // Fetch dropdown data (locations, users)
  const fetchDropdownData = async () => {
    try {
      const [locationsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/locations/`),
        axios.get(`${API_BASE}/users/`)
      ]);
      setLocations(locationsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchDiscardedItems = async () => {
    setLoading(true);
    try {
      const data = await discardedItemsAPI.getAll();
      setDiscardedItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch discarded items');
      setDiscardedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(discardedItems.length / rowsPerPage);
  const paginatedItems = discardedItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handleSubmitDiscardedItem = async (formData) => {
    try {
      // The form data already has the correct structure for the API
      await discardedItemsAPI.create(formData);
      setShowForm(false);
      // Refresh the list
      fetchDiscardedItems();
    } catch (err) {
      console.error('Failed to create discarded item:', err);
      alert('Failed to create discarded item. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Discarded Items" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Manage and track discarded inventory
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <span className="mr-2">+</span>
                  Record New Discard
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Discarded Items Table */}
            {loading ? (
              <div className="text-center py-8">Loading discarded items...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOCATION</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REASON</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DISCARDED BY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No discarded items found
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.discarded_by?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => handleViewDetails(item)}
                                className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs hover:bg-blue-600 hover:text-white transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {discardedItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, discardedItems.length)} of {discardedItems.length} items
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border rounded px-3 py-1 text-sm"
                      >
                        {[5, 10, 20, 50].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Discarded Item Form */}
      <AddDiscardedItemForm 
        show={showForm}
        onClose={() => setShowForm(false)} 
        onSubmit={handleSubmitDiscardedItem} 
        locations={locations}
        users={users}
      />

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Discard Details</h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">View discarded item information</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="font-medium py-2">ID</td>
                      <td className="py-2">Discard ID {selectedItem.id}</td>
                      <td className="font-medium py-2">Item</td>
                      <td className="py-2">{selectedItem.item?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Quantity</td>
                      <td className="py-2">{selectedItem.quantity}</td>
                      <td className="font-medium py-2">Location</td>
                      <td className="py-2">{selectedItem.location || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Date</td>
                      <td className="py-2">{formatDate(selectedItem.date)}</td>
                      <td className="font-medium py-2">Category</td>
                      <td className="py-2">{selectedItem.item?.category?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Reason</td>
                      <td className="py-2">{selectedItem.reason}</td>
                      <td className="font-medium py-2">Discarded By</td>
                      <td className="py-2">{selectedItem.discarded_by?.name || 'N/A'}</td>
                    </tr>
                    {selectedItem.notes && (
                      <tr>
                        <td className="font-medium py-2">Notes</td>
                        <td className="py-2" colSpan="3">{selectedItem.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t bg-white">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscardedItems;