// import { useState, useEffect } from 'react';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
// import UserTable from '../components/UserTable';
// import AddUserForm from '../components/AddUserForm';
// import { FiSearch, FiUserPlus, FiFilter, FiX } from 'react-icons/fi';

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filters, setFilters] = useState({
//     department: 'All Departments',
//     role: 'All Roles',
//     status: 'All Statuses'
//   });

//   // Mock data - replace with API call
//   useEffect(() => {
//     const mockUsers = [
//       {
//         id: 1,
//         name: 'Admin User',
//         email: 'admin@ned.edu.pk',
//         role: 'Admin',
//         department: 'IT Administration',
//         status: 'Active'
//       },
//       {
//         id: 2,
//         name: 'Jahanzalb',
//         email: 'jahanzalb@ned.edu.pk',
//         role: 'User',
//         department: 'Engineering Department',
//         status: 'Active'
//       },
//       {
//         id: 3,
//         name: 'Saad',
//         email: 'saad@ned.edu.pk',
//         role: 'User',
//         department: 'Computer Science',
//         status: 'Active'
//       },
//       {
//         id: 4,
//         name: 'Fahad',
//         email: 'fahad@ned.edu.pk',
//         role: 'User',
//         department: 'Electrical Engineering',
//         status: 'Inactive'
//       }
//     ];
//     setUsers(mockUsers);
//     setLoading(false);
//   }, []);

//   const handleDelete = (id) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       setUsers(users.filter(user => user.id !== id));
//     }
//   };

//   const handleAddUser = (newUser) => {
//     setUsers([...users, { ...newUser, id: users.length + 1 }]);
//     setShowForm(false);
//   };

//   const handleEditUser = (updatedUser) => {
//     setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
//     setEditingUser(null);
//   };

//   const clearFilters = () => {
//     setFilters({
//       department: 'All Departments',
//       role: 'All Roles',
//       status: 'All Statuses'
//     });
//     setSearchTerm('');
//   };

//   const filteredUsers = users.filter(user => {
//     const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesDepartment = filters.department === 'All Departments' || 
//                             user.department === filters.department;
//     const matchesRole = filters.role === 'All Roles' || 
//                        user.role === filters.role;
//     const matchesStatus = filters.status === 'All Statuses' || 
//                          user.status === filters.status;
    
//     return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
//   });

//   const departments = [
//     'All Departments',
//     'IT Administration',
//     'Engineering Department',
//     'Computer Science',
//     'Electrical Engineering',
//     'Civil Engineering'
//   ];

//   const roles = ['All Roles', 'Admin', 'User'];
//   const statuses = ['All Statuses', 'Active', 'Inactive'];

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar />
//       <div className="flex-1 overflow-auto">
//         <Navbar />
//         <div className="p-6">
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//             {/* Header */}
//             <div className="px-6 py-4 border-b border-gray-200">
//               <h1 className="text-xl font-semibold text-gray-800">User Management</h1>
//             </div>

//             {/* Search and Filters */}
//             <div className="px-6 py-4 border-b border-gray-200">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                 <div className="flex-1">
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <FiSearch className="text-gray-400" />
//                     </div>
//                     <input
//                       type="text"
//                       className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                       placeholder="Search by name or email..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setShowForm(true)}
//                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     <FiUserPlus className="mr-2" />
//                     Add User
//                   </button>
//                 </div>
//               </div>

//               {/* Filter Row */}
//               <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
//                   <select
//                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
//                     value={filters.department}
//                     onChange={(e) => setFilters({...filters, department: e.target.value})}
//                   >
//                     {departments.map(dept => (
//                       <option key={dept} value={dept}>{dept}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//                   <select
//                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
//                     value={filters.role}
//                     onChange={(e) => setFilters({...filters, role: e.target.value})}
//                   >
//                     {roles.map(role => (
//                       <option key={role} value={role}>{role}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                   <div className="flex items-center gap-2">
//                     <select
//                       className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
//                       value={filters.status}
//                       onChange={(e) => setFilters({...filters, status: e.target.value})}
//                     >
//                       {statuses.map(status => (
//                         <option key={status} value={status}>{status}</option>
//                       ))}
//                     </select>
//                     <button
//                       onClick={clearFilters}
//                       className="p-2 text-gray-500 hover:text-gray-700"
//                       title="Clear filters"
//                     >
//                       <FiX />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* User Table */}
//             <div className="px-6 py-4">
//               <UserTable 
//                 users={filteredUsers} 
//                 loading={loading}
//                 onEdit={setEditingUser}
//                 onDelete={handleDelete}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Add/Edit User Modal */}
//       {(showForm || editingUser) && (
//         <AddUserForm 
//           user={editingUser}
//           departments={departments.filter(d => d !== 'All Departments')}
//           onClose={() => {
//             setShowForm(false);
//             setEditingUser(null);
//           }}
//           onSubmit={editingUser ? handleEditUser : handleAddUser}
//         />
//       )}
//     </div>
//   );
// };

// export default Users;


import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import UserTable from '../components/UserTable';
import AddUserForm from '../components/AddUserForm';
import { FiSearch, FiUserPlus, FiFilter, FiX } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'All Departments',
    role: 'All Roles',
    status: 'All Statuses'
  });

  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@ned.edu.pk',
        role: 'Admin',
        department: 'IT Administration',
        status: 'Active'
      },
      {
        id: 2,
        name: 'Jahanzalb',
        email: 'jahanzalb@ned.edu.pk',
        role: 'User',
        department: 'Engineering Department',
        status: 'Active'
      },
      {
        id: 3,
        name: 'Saad',
        email: 'saad@ned.edu.pk',
        role: 'User',
        department: 'Computer Science',
        status: 'Active'
      },
      {
        id: 4,
        name: 'Fahad',
        email: 'fahad@ned.edu.pk',
        role: 'User',
        department: 'Electrical Engineering',
        status: 'Inactive'
      }
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const handleAddUser = (newUser) => {
    setUsers([...users, { ...newUser, id: users.length + 1 }]);
    setShowForm(false);
  };

  const handleEditUser = (updatedUser) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setEditingUser(null);
  };

  const clearFilters = () => {
    setFilters({
      department: 'All Departments',
      role: 'All Roles',
      status: 'All Statuses'
    });
    setSearchTerm('');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'All Departments' ||
      user.department === filters.department;
    const matchesRole = filters.role === 'All Roles' ||
      user.role === filters.role;
    const matchesStatus = filters.status === 'All Statuses' ||
      user.status === filters.status;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const departments = [
    'All Departments',
    'IT Administration',
    'Engineering Department',
    'Computer Science',
    'Electrical Engineering',
    'Civil Engineering'
  ];

  const roles = ['All Roles', 'Admin', 'User'];
  const statuses = ['All Statuses', 'Active', 'Inactive'];

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800">User Management</h1>
            </div>

            {/* Search and Filters */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiUserPlus className="mr-2" />
                  Add User
                </button>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <FiX className="flex-shrink-0" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="px-4 sm:px-6 py-4 overflow-x-auto">
              <UserTable
                users={filteredUsers}
                loading={loading}
                onEdit={setEditingUser}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit User Modal */}
      {(showForm || editingUser) && (
        <AddUserForm
          user={editingUser}
          departments={departments.filter(d => d !== 'All Departments')}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSubmit={editingUser ? handleEditUser : handleAddUser}
        />
      )}
    </div>
  );
};

export default Users;
