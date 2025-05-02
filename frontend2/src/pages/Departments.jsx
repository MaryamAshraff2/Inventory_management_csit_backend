// import { useState, useEffect } from "react";
// import Sidebar from "../components/Sidebar";
// import Navbar from "../components/Navbar";
// import DepartmentTable from "../components/DepartmentTable";
// import AddDepartmentForm from "../components/AddDepartmentForm";

// const Departments = () => {
//   const [showForm, setShowForm] = useState(false);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterBy, setFilterBy] = useState("name");
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   // Add this state near the top of your component
//   const [editingDepartment, setEditingDepartment] = useState(null);

//   // Fetch departments from API
//   useEffect(() => {
//     const fetchDepartments = async () => {
//       try {
//         setLoading(true);
//         // Mock data - replace with API call
//         const mockData = [
//           {
//             id: 1,
//             name: "IT",
//             email: "it@example.com",
//             userCount: 12,
//             locations: ["Main Floor - IT101", "Basement - Server Room"],
//           },
//           {
//             id: 2,
//             name: "HR",
//             email: "hr@example.com",
//             userCount: 8,
//             locations: ["Floor 2 - HR Wing"],
//           },
//         ];
//         setDepartments(mockData);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDepartments();
//   }, []);

//   // Filter departments based on search
//   const filteredDepartments = departments.filter((dept) => {
//     const searchLower = searchTerm.toLowerCase();
//     if (filterBy === "name") {
//       return dept.name.toLowerCase().includes(searchLower);
//     } else {
//       return dept.locations.some((loc) =>
//         loc.toLowerCase().includes(searchLower)
//       );
//     }
//   });

//   // Pagination logic
//   const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);
//   const paginatedDepartments = filteredDepartments.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const handleAddDepartment = (newDepartment) => {
//     if (editingDept) {
//       // Update existing department
//       setDepartments(
//         departments.map((d) =>
//           d.id === editingDept.id ? { ...newDepartment, id: editingDept.id } : d
//         )
//       );
//       setEditingDepartment(null);
//     } else {
//       // Add new department
//       const newDept = {
//         ...newDepartment,
//         id: Math.max(...departments.map((d) => d.id), 0) + 1,
//       };
//       setDepartments([...departments, newDept]);
//     }
//     setShowForm(false);
//   };

//   // Modify your edit handler
//   const handleEdit = (department) => {
//     setEditingDepartment(department);
//     setShowForm(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this department?")) {
//       setDepartments(departments.filter((d) => d.id !== id));
//     }
//   };

//   return (
//     <>
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Navbar title="Department Management" />
//         <main className="flex-1 overflow-y-auto p-6">
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <h3 className="text-lg font-semibold">
//                   Manage system departments and contact information
//                 </h3>
//               </div>
//               <button
//                 onClick={() => {
//                   setEditingDepartment(null);
//                   setShowForm(true);
//                 }}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
//               >
//                 <span className="mr-2">+</span>
//                 Add New Department
//               </button>
//             </div>
//             {/* Replace your search controls with this */}
//             <div className="flex flex-col sm:flex-row gap-4 mb-6">
//               <div className="flex-1">
//                 <div className="flex border rounded-md overflow-hidden">
//                   <select
//                     value={filterBy}
//                     onChange={(e) => setFilterBy(e.target.value)}
//                     className="bg-gray-100 px-3 py-2 text-sm focus:outline-none"
//                   >
//                     <option value="name">Department</option>
//                     <option value="location">Location</option>
//                   </select>
//                   <input
//                     type="text"
//                     placeholder={
//                       filterBy === "name"
//                         ? "Search departments..."
//                         : "Search locations..."
//                     }
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="flex-1 px-3 py-2 text-sm focus:outline-none"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-600">Show:</span>
//                 <select
//                   value={rowsPerPage}
//                   onChange={(e) => setRowsPerPage(Number(e.target.value))}
//                   className="border rounded px-3 py-2 text-sm"
//                 >
//                   {[5, 10, 20, 50].map((num) => (
//                     <option key={num} value={num}>
//                       {num}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//             {loading ? (
//               <div className="text-center py-8">Loading departments...</div>
//             ) : (
//               <>
//                 <DepartmentTable
//                   departments={paginatedDepartments}
//                   onEdit={handleEdit}
//                   onDelete={handleDelete}
//                 />

//                 {/* Pagination Controls */}
//                 {filteredDepartments.length > 0 && (
//                   <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
//                     <div className="text-sm text-gray-600">
//                       Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
//                       {Math.min(
//                         currentPage * rowsPerPage,
//                         filteredDepartments.length
//                       )}{" "}
//                       of {filteredDepartments.length} departments
//                     </div>

//                     <div className="flex gap-1">
//                       <button
//                         onClick={() =>
//                           setCurrentPage((p) => Math.max(p - 1, 1))
//                         }
//                         disabled={currentPage === 1}
//                         className="px-3 py-1 border rounded disabled:opacity-50"
//                       >
//                         Previous
//                       </button>

//                       {Array.from({ length: Math.min(5, totalPages) }).map(
//                         (_, i) => {
//                           const page =
//                             currentPage <= 3
//                               ? i + 1
//                               : currentPage >= totalPages - 2
//                               ? totalPages - 4 + i
//                               : currentPage - 2 + i;
//                           return (
//                             <button
//                               key={page}
//                               onClick={() => setCurrentPage(page)}
//                               className={`px-3 py-1 border rounded ${
//                                 currentPage === page
//                                   ? "bg-blue-100 text-blue-700"
//                                   : ""
//                               }`}
//                             >
//                               {page}
//                             </button>
//                           );
//                         }
//                       )}

//                       <button
//                         onClick={() =>
//                           setCurrentPage((p) => Math.min(p + 1, totalPages))
//                         }
//                         disabled={currentPage === totalPages}
//                         className="px-3 py-1 border rounded disabled:opacity-50"
//                       >
//                         Next
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//             {/* Update your form rendering */}
//             {showForm && (
//               <AddDepartmentForm
//                 onClose={() => {
//                   setShowForm(false);
//                   setEditingDepartment(null);
//                 }}
//                 onSubmit={handleAddDepartment}
//                 departmentToEdit={editingDepartment}
//               />
//             )}
//           </div>
//         </main>
//       </div>
//     </>
//   );
// };

// export default Departments;

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DepartmentTable from "../components/DepartmentTable";
import AddDepartmentForm from "../components/AddDepartmentForm";

const Departments = () => {
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDepartment, setEditingDepartment] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const mockData = [
          {
            id: 1,
            name: "IT",
            email: "it@example.com",
            userCount: 12,
            locations: ["Main Floor - IT101", "Basement - Server Room"],
          },
          {
            id: 2,
            name: "HR",
            email: "hr@example.com",
            userCount: 8,
            locations: ["Floor 2 - HR Wing"],
          },
        ];
        setDepartments(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter((dept) => {
    const searchLower = searchTerm.toLowerCase();
    if (filterBy === "name") {
      return dept.name.toLowerCase().includes(searchLower);
    } else {
      return dept.locations.some((loc) =>
        loc.toLowerCase().includes(searchLower)
      );
    }
  });

  const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleAddDepartment = (newDepartment) => {
    if (editingDepartment) {
      // Update existing department
      setDepartments(
        departments.map((d) =>
          d.id === editingDepartment.id 
            ? { ...newDepartment, id: editingDepartment.id } 
            : d
        )
      );
    } else {
      // Add new department
      const newDept = {
        ...newDepartment,
        id: Math.max(...departments.map((d) => d.id), 0) + 1,
      };
      setDepartments([...departments, newDept]);
    }
    setShowForm(false);
    setEditingDepartment(null);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      setDepartments(departments.filter((d) => d.id !== id));
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Department Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Manage system departments and contact information
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingDepartment(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">+</span>
                Add New Department
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
                    <option value="name">By Department</option>
                    <option value="location">By Location</option>
                  </select>
                  <input
                    type="text"
                    placeholder={
                      filterBy === "name"
                        ? "Search departments..."
                        : "Search locations..."
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
              <div className="text-center py-8">Loading departments...</div>
            ) : (
              <>
                <DepartmentTable
                  departments={paginatedDepartments}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

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

            {showForm && (
              <AddDepartmentForm
                onClose={() => {
                  setShowForm(false);
                  setEditingDepartment(null);
                }}
                onSubmit={handleAddDepartment}
                department={editingDepartment}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Departments;