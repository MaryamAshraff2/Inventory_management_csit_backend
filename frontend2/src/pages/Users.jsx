import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import UserTable from '../components/UserTable';
import AddUserForm from '../components/AddUserForm';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/inventory';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users from backend
  const fetchUsers = () => {
    setLoading(true);
    axios.get(`${API_BASE}/users/`)
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Fetch departments from backend
  const fetchDepartments = () => {
    axios.get(`${API_BASE}/departments/`)
      .then(res => setDepartments(res.data))
      .catch(() => setDepartments([]));
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      axios.delete(`${API_BASE}/users/${id}/`).then(fetchUsers);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleFormSubmit = (newUser) => {
    if (editingUser) {
      axios.patch(`${API_BASE}/users/${editingUser.id}/`, newUser)
        .then(() => {
          fetchUsers();
          setShowForm(false);
          setEditingUser(null);
        });
    } else {
      axios.post(`${API_BASE}/users/`, newUser)
        .then(() => {
          fetchUsers();
          setShowForm(false);
          setEditingUser(null);
        });
    }
  };

  const handleEditUser = (updatedUser) => {
    axios.put(`${API_BASE}/users/${updatedUser.id}/`, updatedUser)
      .then(() => {
        fetchUsers();
        setEditingUser(null);
      });
  };

  // Filtering logic
  const filteredUsers = searchTerm.trim() === ''
    ? users
    : users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        if (filterCategory === 'name') {
          return user.name.toLowerCase().includes(searchLower);
        } else if (filterCategory === 'email') {
          return user.email.toLowerCase().includes(searchLower);
        } else if (filterCategory === 'department') {
          // department can be object or string
          const dept = user.department?.name || user.department;
          return dept?.toLowerCase().includes(searchLower);
        } else if (filterCategory === 'role') {
          return user.role.toLowerCase().includes(searchLower);
        }
        return true;
      });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const roles = ['Admin', 'User'];

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="User Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Manage system users and their permissions
                </h3>
              </div>
              <button
                onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Add New User
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="flex border rounded-md overflow-hidden">
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="department">Department</option>
                    <option value="role">Role</option>
                  </select>
                  <input
                    type="text"
                    placeholder={
                      filterCategory === 'name'
                        ? 'Search by name...'
                        : filterCategory === 'email'
                        ? 'Search by email...'
                        : filterCategory === 'department'
                        ? 'Search by department...'
                        : 'Search by role...'
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
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <>
                <UserTable
                  users={paginatedUsers}
                  loading={loading}
                  onEdit={(user) => {
                    setEditingUser(user);
                    setShowForm(true);
                  }}
                  onDelete={handleDelete}
                />

                {filteredUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
                            className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-100 text-blue-700' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

            {(showForm || editingUser) && (
              <AddUserForm
                user={editingUser}
                departments={departments}
                roles={roles}
                onClose={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                onSubmit={handleFormSubmit}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Users;
