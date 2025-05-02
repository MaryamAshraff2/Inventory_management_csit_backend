import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AddDiscardedItemForm from "../components/AddDiscardedItemForm";

const DiscardedItems = () => {
  const [discardedItems, setDiscardedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDiscardedItems = async () => {
      try {
        setLoading(true);
        // Mock data with corrected reasons
        const mockData = [
          {
            id: 1,
            item: "Laptop",
            quantity: 2,
            date: "Aug 10, 2023",
            reason: "Damaged",
            discardedBy: "John Smith",
            procurementId: 1,
            notes: "Water damage from roof leak"
          },
          {
            id: 2,
            item: "Mouse",
            quantity: 5,
            date: "Aug 15, 2023",
            reason: "Obsolete",
            discardedBy: "Emily Davis",
            procurementId: 2
          },
          {
            id: 3,
            item: "Notebook",
            quantity: 20,
            date: "Aug 20, 2023",
            reason: "Expired",
            discardedBy: "Sarah Johnson",
            procurementId: 3
          },
          {
            id: 4,
            item: "Monitor",
            quantity: 3,
            date: "Aug 25, 2023",
            reason: "Damaged",
            discardedBy: "Michael Brown",
            procurementId: 4
          },
          {
            id: 5,
            item: "Keyboard",
            quantity: 8,
            date: "Sep 1, 2023",
            reason: "Other",
            discardedBy: "Robert Wilson",
            procurementId: 5
          }
        ];
        setDiscardedItems(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscardedItems();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(discardedItems.length / rowsPerPage);
  const paginatedItems = discardedItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleRefresh = () => {
    console.log("Refreshing discarded items...");
    // In a real app, you would refetch data here
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
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
                <h2 className="text-xl font-bold mb-2">Discarded Items</h2>
                <h3 className="text-lg font-semibold text-gray-600">
                  Manage and track discarded inventory
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center"
                >
                  <span className="mr-2">↻</span>
                  Refresh
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <span className="mr-2">+</span>
                  Record New Discard
                </button>
              </div>
            </div>

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REASON</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DISCARDED BY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.item}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.discardedBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => handleViewDetails(item)}
                              className="text-xs text-gray-600 hover:text-blue-600 border border-gray-300 rounded px-2 py-1 hover:border-blue-400 transition-colors"
  >
    View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <div className="text-sm text-gray-600">
                    Showing 1 to {discardedItems.length} of {discardedItems.length} items
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
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Discarded Item Form */}
      {showForm && (
        <AddDiscardedItemForm 
          onClose={() => setShowForm(false)} 
          onSubmit={(data) => {
            console.log("New discarded item:", data);
            setShowForm(false);
          }} 
        />
      )}

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
                      <td className="py-2">{selectedItem.item}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Quantity</td>
                      <td className="py-2">{selectedItem.quantity}</td>
                      <td className="font-medium py-2">Date</td>
                      <td className="py-2">{selectedItem.date}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Reason</td>
                      <td className="py-2">{selectedItem.reason}</td>
                      <td className="font-medium py-2">Procurement ID</td>
                      <td className="py-2">{selectedItem.procurementId}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-2">Discarded By</td>
                      <td className="py-2" colSpan="3">{selectedItem.discardedBy}</td>
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
            
            <div className="p-4 border-t bg-white sticky bottom-0">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscardedItems;