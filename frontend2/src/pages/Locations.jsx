import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LocationTable from "../components/LocationTable";
import LocationForm from "../components/AddLocationForm";

const Locations = () => {
  const [showForm, setShowForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLocation, setEditingLocation] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data - replace with API calls
        setLocations([
          { id: 1, name: "Main Warehouse", department: "Operations", roomNumber: "W101", description: "Primary storage facility" },
          { id: 2, name: "IT Storage", department: "IT", roomNumber: "IT205", description: "Tech equipment storage" },
          { id: 3, name: "Sales Showroom", department: "Sales", roomNumber: "SH001", description: "Product display area" }
        ]);
        
        setDepartments(["IT", "HR", "Finance", "Operations", "Sales"]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const searchLower = searchTerm.toLowerCase();
    if (filterBy === "name") {
      return loc.name.toLowerCase().includes(searchLower);
    } else {
      return loc.department.toLowerCase().includes(searchLower);
    }
  });

  const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleAddLocation = (newLocation) => {
    if (editingLocation) {
      // Update existing location
      setLocations(
        locations.map((loc) =>
          loc.id === editingLocation.id 
            ? { ...newLocation, id: editingLocation.id } 
            : loc
        )
      );
    } else {
      // Add new location
      const newLoc = {
        ...newLocation,
        id: Math.max(...locations.map((loc) => loc.id), 0) + 1,
      };
      setLocations([...locations, newLoc]);
    }
    setShowForm(false);
    setEditingLocation(null);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      setLocations(locations.filter((loc) => loc.id !== id));
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Location Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Manage inventory storage locations across departments
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Add New Location
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="flex border rounded-md overflow-hidden">
                  <select
                    value={filterBy}
                    onChange={(e) => {
                      setFilterBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="name">By Location</option>
                    <option value="department">By Department</option>
                  </select>
                  <input
                    type="text"
                    placeholder={
                      filterBy === "name"
                        ? "Search locations..."
                        : "Search departments..."
                    }
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
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
                  {[5, 10, 20, 50].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading locations...</div>
            ) : (
              <>
                <LocationTable
                  locations={paginatedLocations}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

                {filteredLocations.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * rowsPerPage,
                        filteredLocations.length
                      )}{" "}
                      of {filteredLocations.length} locations
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
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
                              className={`px-3 py-1 border rounded ${
                                currentPage === page
                                  ? "bg-blue-100 text-blue-700"
                                  : ""
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
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {showForm && (
              <LocationForm
                onClose={() => {
                  setShowForm(false);
                  setEditingLocation(null);
                }}
                onSubmit={handleAddLocation}
                location={editingLocation}
                departments={departments}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Locations;