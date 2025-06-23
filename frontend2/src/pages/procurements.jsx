import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ProcurementForm from '../components/AddProcurementForm';
import axios from 'axios';
import ProcurementDetailsModal from '../components/ProcurementDetailsModal';
import ProcurementViewModal from '../components/ProcurementViewModal';

const ProcurementPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [procurements, setProcurements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [modalProcurement, setModalProcurement] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [editingProcurement, setEditingProcurement] = useState(null);
  const [viewProcurement, setViewProcurement] = useState(null);

  // Fetch procurements from backend
  const fetchProcurements = async () => {
    try {
      const response = await axios.get('http://localhost:8000/inventory/procurements/');
      setProcurements(response.data);
    } catch (error) {
      console.error('Failed to fetch procurements:', error);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, []);

  // Filtered suppliers for dropdown
  const uniqueSuppliers = [
    'All Suppliers',
    ...Array.from(new Set(procurements.map((p) => p.supplier || ''))).filter(Boolean),
  ];

  // Filtered procurements
  const filteredProcurements = procurements.filter((proc) => {
    const matchesSearch =
      (proc.order_number && proc.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc.supplier && proc.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSupplier = supplierFilter === 'All Suppliers' || proc.supplier === supplierFilter;
    // Time filter is not implemented (for demo)
    return matchesSearch && matchesSupplier;
  });

  // Add new procurement handler
  const handleAddClick = () => {
    setEditingProcurement(null);
    setShowForm(true);
  };
  const handleEdit = (proc) => {
    setEditingProcurement(proc);
    setShowForm(true);
  };
  const handleFormSubmit = async () => {
    await fetchProcurements();
    setShowForm(false);
    setEditingProcurement(null);
  };

  const handleView = (proc) => {
    setViewProcurement(proc);
  };
  const handleDelete = async (proc) => {
    if (window.confirm('Are you sure you want to delete this procurement?')) {
      try {
        await axios.delete(`http://localhost:8000/inventory/procurements/${proc.id}/`);
        await fetchProcurements();
      } catch (error) {
        alert('Failed to delete procurement.');
      }
    }
  };
  const handleModalClose = () => setModalProcurement(null);
  const handleModalSave = async (updatedProc) => {
    try {
      await axios.put(`http://localhost:8000/inventory/procurements/${updatedProc.id}/`, updatedProc);
      await fetchProcurements();
      setModalProcurement(null);
    } catch (error) {
      alert('Failed to update procurement.');
    }
  };
  const handleViewClose = () => setViewProcurement(null);

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Procurements" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">
                Manage and track all procurement orders
              </h1>
              <button
                onClick={handleAddClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <span className="mr-2">+</span>
                Add New Procurement
              </button>
            </div>
            {/* Filters Section */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by order number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>All Time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            {/* Procurement Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER NUMBER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SUPPLIER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL AMOUNT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOCUMENT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTION</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProcurements.length > 0 ? (
                    filteredProcurements.map((proc) => (
                      <tr key={proc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {proc.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proc.supplier || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proc.order_date ? new Date(proc.order_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${parseFloat(proc.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                          {proc.document ? (
                            <a href={proc.document} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              View Document
                            </a>
                          ) : (
                            'No document'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                          <button onClick={() => handleView(proc)} className="text-blue-600 hover:underline">View</button>
                          <button onClick={() => handleEdit(proc)} className="text-yellow-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(proc)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No procurements found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {/* Modal for Add Procurement Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowForm(false)}
            >
              &times;
            </button>
            <ProcurementForm procurement={editingProcurement} onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />
          </div>
        </div>
      )}
      {modalProcurement && (
        <ProcurementDetailsModal
          procurement={modalProcurement}
          mode={modalMode}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
      {viewProcurement && (
        <ProcurementViewModal procurement={viewProcurement} onClose={handleViewClose} />
      )}
    </>
  );
};

export default ProcurementPage; 