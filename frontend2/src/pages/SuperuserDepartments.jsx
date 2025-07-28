import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API_BASE = 'http://localhost:8000/inventory';

const SuperuserDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showChairmanForm, setShowChairmanForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDepartmentsWithChairmen();
  }, []);

  const fetchDepartmentsWithChairmen = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/superuser-management/departments_with_chairmen/`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const searchLower = searchTerm.toLowerCase();
    return dept.name.toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleCreateDepartment = async (departmentData) => {
    try {
      const res = await fetch(`${API_BASE}/departments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departmentData)
      });
      
      if (res.ok) {
        await fetchDepartmentsWithChairmen();
        setShowDepartmentForm(false);
      } else {
        const error = await res.json();
        alert(`Failed to create department: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department');
    }
  };

  const handleAssignChairman = async (chairmanData) => {
    try {
      const res = await fetch(`${API_BASE}/superuser-management/${selectedDepartment.id}/assign_chairman/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chairmanData)
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`Chairman assigned successfully!\nUsername: ${result.chairman.name}\nPassword: ${result.chairman.password}`);
        await fetchDepartmentsWithChairmen();
        setShowChairmanForm(false);
        setSelectedDepartment(null);
      } else {
        const error = await res.json();
        alert(`Failed to assign chairman: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning chairman:', error);
      alert('Failed to assign chairman');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm("Are you sure you want to delete this department? This will also delete all associated users.")) {
      try {
        const res = await fetch(`${API_BASE}/departments/${id}/`, { 
          method: "DELETE" 
        });
        if (res.ok) {
          await fetchDepartmentsWithChairmen();
        } else {
          alert('Failed to delete department');
        }
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Failed to delete department');
      }
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Superuser Department Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Create Departments and Assign Chairmen
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Manage departments and assign chairmen with login credentials
                </p>
              </div>
              <button
                onClick={() => setShowDepartmentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Create Department
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
              <div className="text-center py-8">Loading departments...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chairman
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Main Manager
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {dept.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {dept.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dept.chairman ? (
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{dept.chairman.name}</div>
                                <div className="text-xs text-gray-500">{dept.chairman.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No chairman assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dept.main_inventory_manager ? (
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{dept.main_inventory_manager.name}</div>
                                <div className="text-xs text-gray-500">{dept.main_inventory_manager.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No manager assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {dept.user_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {!dept.chairman && (
                                <button
                                  onClick={() => {
                                    setSelectedDepartment(dept);
                                    setShowChairmanForm(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-xs"
                                >
                                  Assign Chairman
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredDepartments.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * rowsPerPage,
                        filteredDepartments.length
                      )}{" "}
                      of {filteredDepartments.length} departments
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
          </div>
        </main>
      </div>

      {/* Department Creation Form */}
      {showDepartmentForm && (
        <DepartmentForm
          onClose={() => setShowDepartmentForm(false)}
          onSubmit={handleCreateDepartment}
        />
      )}

      {/* Chairman Assignment Form */}
      {showChairmanForm && selectedDepartment && (
        <ChairmanForm
          onClose={() => {
            setShowChairmanForm(false);
            setSelectedDepartment(null);
          }}
          onSubmit={handleAssignChairman}
          department={selectedDepartment}
        />
      )}
    </>
  );
};

// Department Creation Form Component
const DepartmentForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Create New Department</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science Department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., cs@neduet.edu.pk"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Department
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Chairman Assignment Form Component
const ChairmanForm = ({ onClose, onSubmit, department }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: 'chairman123',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Assign Chairman</h3>
          <p className="text-sm text-gray-600 mb-4">
            Assign a chairman to <strong>{department.name}</strong>
          </p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., dr_smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default: chairman123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., dr.smith@neduet.edu.pk"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Assign Chairman
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperuserDepartments; 