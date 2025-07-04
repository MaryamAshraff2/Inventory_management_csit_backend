import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import InventoryDetails from "../components/InventoryDetails";
import { FiSearch, FiEye } from "react-icons/fi";

const UserInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterBy, setFilterBy] = useState("name");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [locationName, setLocationName] = useState('Lab 1');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const portalId = localStorage.getItem('portalID') || 'user';
        const response = await fetch(`http://localhost:8000/inventory/user/location-inventory/?portal_id=${portalId}`);
        if (response.ok) {
          const data = await response.json();
          setInventory(data.inventory || []);
          setLocationName(data.location || 'Lab 1');
        } else {
          setInventory([]);
          setLocationName('Lab 1');
        }
      } catch (error) {
        setInventory([]);
        setLocationName('Lab 1');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return filterBy === "name"
      ? item.name.toLowerCase().includes(searchLower)
      : item.category.toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(filteredInventory.length / rowsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen bg-gray-100">
      <Sidebar userType="user" />
      <div className="flex-1 flex flex-col">
        <Navbar title={`Inventory - ${locationName}`} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Total Inventory for {locationName}</h3>
            </div>

            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex">
                  <select
                    value={filterBy}
                    onChange={(e) => {
                      setFilterBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border-r border-gray-300 rounded-l-md"
                  >
                    <option value="name">By Item Name</option>
                    <option value="category">By Category</option>
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-l-0 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={
                        filterBy === "name"
                          ? "Search items..."
                          : "Search categories..."
                      }
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
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
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
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

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ITEM NAME
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          QUANTITY
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CATEGORY
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UNIT PRICE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedInventory.length > 0 ? (
                        paginatedInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.unit_price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                aria-label="View details"
                              >
                                <FiEye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No inventory items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {filteredInventory.length > 0 && (
                    <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between">
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedItem && (
        <InventoryDetails
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default UserInventory;