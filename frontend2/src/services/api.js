const API_BASE_URL = 'http://localhost:8000/inventory';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Discarded Items API
export const discardedItemsAPI = {
  // Get all discarded items
  getAll: () => apiRequest('/discardeditems/'),
  
  // Get a specific discarded item
  getById: (id) => apiRequest(`/discardeditems/${id}/`),
  
  // Create a new discarded item
  create: (data) => apiRequest('/discardeditems/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update a discarded item
  update: (id, data) => apiRequest(`/discardeditems/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete a discarded item
  delete: (id) => apiRequest(`/discardeditems/${id}/`, {
    method: 'DELETE',
  }),
};

// Items API (for dropdown)
export const itemsAPI = {
  getAll: () => apiRequest('/items/'),
  getById: (id) => apiRequest(`/items/${id}/`),
};

// Users API (for dropdown)
export const usersAPI = {
  getAll: () => apiRequest('/users/'),
  getById: (id) => apiRequest(`/users/${id}/`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiRequest('/categories/'),
};

// Departments API
export const departmentsAPI = {
  getAll: () => apiRequest('/departments/'),
}; 