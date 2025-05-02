
import React from 'react';
import { FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';

const DepartmentTable = ({ departments, onEdit, onDelete }) => {
  const [showLocations, setShowLocations] = React.useState(null);

  const toggleLocations = (deptId) => {
    setShowLocations(showLocations === deptId ? null : deptId);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {departments.map((dept) => (
            <React.Fragment key={dept.id}>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.userCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => toggleLocations(dept.id)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{dept.locations?.length || 0}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => onEdit(dept)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => onDelete(dept.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>

              {showLocations === dept.id && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 bg-gray-50">
                    <div className="pl-12">
                      <h4 className="font-medium mb-2">{dept.name} Locations:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {dept.locations?.map((location, index) => (
                          <li key={index} className="text-sm text-gray-700">{location}</li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTable;