import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AddProcurementForm from "../components/AddProcurementForm";
import { FaEye, FaEdit, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";
import ProcurementDetailsModal from "../components/ProcurementDetailsModal";

const Procurements = () => {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedProcurement, setSelectedProcurement] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProcurements();
  }, []);

  const fetchProcurements = async () => {
    try {
      setLoading(true);
      // Mock data with support for multiple items
      const mockData = [
        {
          id: 1,
          orderNumber: "PO-2023-001",
          items: [
            {
              name: "Damaged Computer Monitor",
              type: "Hardware",
              quantity: 5,
              unitPrice: "N/A",
              total: "N/A"
            }
          ],
          type: "Purchase",
          supplier: "Tech Solutions Inc.",
          date: "May 15, 2023",
          documentType: "Purchase Order",
          addedBy: "John Smith",
          document: { type: "pdf", name: "invoice.pdf", url: "#" },
          notes: "Replacement for damaged units"
        },
        {
          id: 2,
          orderNumber: "PO-2023-002",
          items: [
            {
              name: "Office Desk",
              type: "Furniture",
              quantity: 8,
              unitPrice: "$150",
              total: "$1,200"
            },
            {
              name: "Executive Chair",
              type: "Furniture",
              quantity: 4,
              unitPrice: "$250",
              total: "$1,000"
            }
          ],
          type: "Purchase",
          supplier: "Office Furniture Co.",
          date: "Jun 2, 2023",
          documentType: "MOU",
          addedBy: "Sarah Johnson",
          document: { type: "pdf", name: "mou.pdf", url: "#" },
          notes: "For new office setup"
        },
        {
          id: 3,
          orderNumber: "PO-2023-003",
          items: [
            {
              name: "Printer Paper",
              type: "Consumable",
              quantity: 50,
              unitPrice: "$5",
              total: "$250"
            },
            {
              name: "Ink Cartridges",
              type: "Consumable",
              quantity: 10,
              unitPrice: "$35",
              total: "$350"
            }
          ],
          type: "Donation",
          supplier: "Office Depot",
          date: "Jun 10, 2023",
          documentType: "Internal Memo",
          addedBy: "Emily Davis",
          document: { type: "doc", name: "memo.doc", url: "#" },
          notes: "Monthly office supplies"
        }
      ];
      setProcurements(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = ["All Suppliers", ...new Set(procurements.map(p => p.supplier))];

  // Calculate total for procurement with multiple items
  const calculateTotal = (procurement) => {
    if (procurement.items.length === 1) {
      return procurement.items[0].total;
    }
    return procurement.items.reduce((sum, item) => {
      const value = item.total ? parseFloat(item.total.replace('$', '')) : 0;
      return sum + value;
    }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Filter procurements
  const filteredProcurements = procurements.filter((procurement) => {
    const matchesSearch = procurement.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         procurement.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procurement.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSupplier = supplierFilter === "All Suppliers" || procurement.supplier === supplierFilter;
    const matchesTime = timeFilter === "All Time" || true;
    
    return matchesSearch && matchesSupplier && matchesTime;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProcurements.length / rowsPerPage);
  const paginatedProcurements = filteredProcurements.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDocumentClick = (document) => {
    if (document) {
      alert(`Opening document: ${document.name}`);
    }
  };

  const handleView = (procurement) => {
    setSelectedProcurement(procurement);
    setViewMode(true);
    setEditMode(false);
  };

  const handleEdit = (procurement) => {
    setSelectedProcurement(procurement);
    setViewMode(false);
    setEditMode(true);
  };

  const handleSave = (updatedProcurement) => {
    setProcurements(procurements.map(p => 
      p.id === updatedProcurement.id ? updatedProcurement : p
    ));
    setEditMode(false);
    setSelectedProcurement(null);
  };

  const getDocumentIcon = (type) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'doc': return <FaFileWord className="text-blue-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Procurement Management" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Manage and track all procurement orders
                </h1>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <span className="mr-2">+</span>
                Add New Procurement
              </button>
            </div>

            {/* Filters Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by item, order number or supplier..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>

            {/* Procurement Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading procurements...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procument ID </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedProcurements.length > 0 ? (
                        paginatedProcurements.map((procurement) => (
                          <tr key={procurement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {procurement.orderNumber}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="space-y-1">
                                {procurement.items.map((item, index) => (
                                  <div key={index}>
                                    <span className="font-medium">{item.name}</span>
                                    <div className="text-xs text-gray-400">
                                      {item.quantity} × {item.unitPrice}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {procurement.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {procurement.supplier}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {procurement.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {calculateTotal(procurement)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {procurement.document ? (
                                <button
                                  onClick={() => handleDocumentClick(procurement.document)}
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 hover:underline"
                                >
                                  {getDocumentIcon(procurement.document.type)}
                                  <span>{procurement.document.name}</span>
                                </button>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleView(procurement)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(procurement)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            No procurements found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredProcurements.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 text-sm">
                    <div className="text-gray-600">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * rowsPerPage,
                        filteredProcurements.length
                      )}{" "}
                      of {filteredProcurements.length} procurements
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[5, 10, 20, 50].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, i) => {
                          const page =
                            currentPage <= 3
                              ? i + 1
                              : currentPage >= totalPages - 2
                              ? totalPages - 4 + i
                              : currentPage - 2 + i;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 border rounded-md ${
                                currentPage === page
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              } transition-colors`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Procurement Form */}
      {showForm && (
        <AddProcurementForm 
          onClose={() => setShowForm(false)} 
          onSubmit={async (data) => {
            console.log("New procurement:", data);
            setShowForm(false);
            fetchProcurements();
          }} 
        />
      )}

      {/* View/Edit Procurement Modal */}
      {selectedProcurement && (
        <ProcurementDetailsModal
          procurement={selectedProcurement}
          mode={editMode ? "edit" : "view"}
          onClose={() => {
            setSelectedProcurement(null);
            setViewMode(false);
            setEditMode(false);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default Procurements;
