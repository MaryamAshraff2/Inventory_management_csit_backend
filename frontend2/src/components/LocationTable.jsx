import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const LocationTable = ({ locations, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.department}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.roomNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => onEdit(loc)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => onDelete(loc.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocationTable;