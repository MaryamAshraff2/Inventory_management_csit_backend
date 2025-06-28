import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import InventoryDetails from "../components/InventoryDetails";
import { FiSearch, FiGrid, FiMapPin, FiChevronDown } from "react-icons/fi";
import TotalInventoryTable from "../components/TotalInventoryTable";
import { itemsAPI, discardedItemsAPI } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterBy, setFilterBy] = useState("name");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("total");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [discardedItems, setDiscardedItems] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await itemsAPI.getTotalInventory();
        setInventory(data);
      } catch (err) {
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    const fetchDiscarded = async () => {
      try {
        const data = await discardedItemsAPI.getAll();
        setDiscardedItems(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchDiscarded();
  }, []);

  // Get unique locations
  const uniqueLocations = [...new Set(inventory.map(item => item.location))];

  // When switching to 'location' tab, default to Lab 1 or first location only if nothing is selected yet
  useEffect(() => {
    if (activeTab === "location") {
      if (!selectedLocation) {
        const lab1 = uniqueLocations.find(loc => loc.toLowerCase().includes("lab 1"));
        if (lab1) {
          setSelectedLocation(lab1);
        } else if (uniqueLocations.length > 0) {
          setSelectedLocation(uniqueLocations[0]);
        }
      }
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Filter based on search term and selected location
  const filteredInventory = inventory.filter((item) => {
    // First filter by location if one is selected
    if (activeTab === "location" && selectedLocation && item.location !== selectedLocation) {
      return false;
    }
    
    // Then filter by search term
    if (filterBy === "name") {
      return item.item_name && item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.order_number && item.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const totalPages = Math.ceil(filteredInventory.length / rowsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar title="Inventory Management" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">
                  View and manage inventory
                </h3>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-6 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setActiveTab("total");
                    setSelectedLocation("");
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === "total"
                      ? "bg-white border-t border-l border-r border-gray-200 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiGrid className="h-4 w-4" />
                  <span>Total Inventory</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("location");
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === "location"
                      ? "bg-white border-t border-l border-r border-gray-200 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiMapPin className="h-4 w-4" />
                  <span>Inventory by Location</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 space-y-4">
              <h2 className="text-base sm:text-lg font-medium text-gray-800">
                {activeTab === "total" ? "Total Inventory" : "Inventory by Location"}
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Combined filter dropdown + search input */}
                <div className="flex-1">
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <select
                      value={filterBy}
                      onChange={(e) => {
                        setFilterBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border-r border-gray-300"
                    >
                      <option value="name">By Item Name</option>
                      <option value="procurement">By Procurement ID</option>
                    </select>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none"
                        placeholder={
                          filterBy === "name"
                            ? "Search items..."
                            : "Search procurement IDs..."
                        }
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Location dropdown (only shown in Inventory by Location view) */}
                {activeTab === "location" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="flex items-center justify-between w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <span>{selectedLocation || "Select Location"}</span>
                      <FiChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {showLocationDropdown && (
                      <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white shadow-lg rounded-md py-1 border border-gray-200 max-h-60 overflow-auto">
                      
                    {uniqueLocations.map((location) => (
                          <div
                            key={location}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedLocation(location);
                              setShowLocationDropdown(false);
                              setCurrentPage(1);
                            }}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cards for available stock by item in selected location */}
            {activeTab === "location" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {Object.entries(
                  filteredInventory.reduce((acc, item) => {
                    if (!acc[item.item_name]) acc[item.item_name] = 0;
                    acc[item.item_name] += item.available_qty;
                    return acc;
                  }, {})
                ).map(([itemName, qty]) => {
                  // Calculate discarded for this item at selectedLocation
                  const discardedQty = discardedItems
                    .filter(d => d.item && d.item.name === itemName && d.location === selectedLocation)
                    .reduce((sum, d) => sum + d.quantity, 0);
                  const netAvailable = qty - discardedQty;
                  return (
                    <div
                      key={itemName}
                      className="bg-white border border-blue-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-3 flex flex-col items-center justify-center min-h-[70px] w-full max-w-[200px] mx-auto"
                    >
                      <div className="text-sm font-semibold text-blue-700 mb-0.5 text-center">{itemName}</div>
                      <div className="flex flex-col items-center w-full">
                        <div className="text-xs text-gray-500 text-center tracking-wide uppercase">Available</div>
                        <div className="text-xl font-bold text-blue-600 text-center mb-1">{netAvailable}</div>
                        <div className="text-xs text-gray-500 text-center tracking-wide uppercase">Discarded</div>
                        <div className="text-lg font-bold text-red-500 text-center">{discardedQty}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table Section */}
            <div className="p-4">
              {activeTab === "total" ? (
                <TotalInventoryTable />
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {filterBy === "name" ? "Procurement ID" : "Item Name"}
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedInventory.length > 0 ? (
                        paginatedInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.id}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.item_name}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.available_qty}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.order_number}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.location}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="View Details"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  ></path>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  ></path>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
                            No inventory items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {filteredInventory.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * rowsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * rowsPerPage,
                            filteredInventory.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredInventory.length}
                        </span>{" "}
                        items
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
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
                                className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                  currentPage === page
                                    ? "bg-blue-50 text-blue-600 border-blue-300"
                                    : "text-gray-700"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Inventory Details Modal */}
      {selectedItem && (
        <InventoryDetails
          item={{
            id: selectedItem.id,
            name: selectedItem.item_name,
            quantity: selectedItem.available_qty,
            procurementId: selectedItem.order_number,
            location: selectedItem.location,
            supplier: selectedItem.supplier,
            orderDate: selectedItem.order_date,
            unitPrice: selectedItem.unit_price,
            // You can add more details here as needed
          }}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default Inventory;