
import { useState } from 'react';

const AddDepartmentForm = ({ onClose, onSubmit, department }) => {
  // Initialize with proper default values
  const [formData, setFormData] = useState({
    name: department?.name || '',
    email: department?.email || '',
    locations: department?.locations || [''] // Ensure locations is always an array
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (index, value) => {
    const newLocations = [...formData.locations];
    newLocations[index] = value;
    setFormData(prev => ({
      ...prev,
      locations: newLocations
    }));
  };

  const addLocationField = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, '']
    }));
  };

  const removeLocationField = (index) => {
    const newLocations = formData.locations.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      locations: newLocations
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      locations: formData.locations.filter(loc => loc.trim() !== '')
    });
    console.log('Form submitted:', formData)
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {department ? 'Edit Department' : 'Add New Department'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''} // Ensure value is never undefined
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''} // Ensure value is never undefined
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
{/* 
              <div>
                { <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locations *
                </label> }
                {formData.locations.map((location, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={location || ''} // Ensure value is never undefined
                      onChange={(e) => handleLocationChange(index, e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLocationField(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLocationField}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add another location
                </button>
              </div> */}
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
                {department ? 'Update Department' : 'Add Department'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDepartmentForm;