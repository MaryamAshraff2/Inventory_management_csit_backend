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

// Dashboard API
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const [departments, users, items, requests] = await Promise.all([
        apiRequest('/departments/'),
        apiRequest('/users/'),
        apiRequest('/items/'),
        apiRequest('/sendingstockrequests/')
      ]);

      return {
        totalDepartments: departments.length,
        totalUsers: users.length,
        totalItems: items.length,
        pendingRequests: requests.filter(req => req.status === 'Pending').length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalDepartments: 0,
        totalUsers: 0,
        totalItems: 0,
        pendingRequests: 0
      };
    }
  },

  // Get recent activity
  getRecentActivity: async () => {
    try {
      const [stockMovements, stockRequests, procurements] = await Promise.all([
        apiRequest('/stockmovements/'),
        apiRequest('/sendingstockrequests/'),
        apiRequest('/procurements/')
      ]);

      // Combine and sort activities by date
      const activities = [
        ...stockMovements.map(movement => ({
          type: 'stock_movement',
          description: `${movement.quantity} x ${movement.item_name || 'Item'} moved from ${movement.from_location_name || 'Location'} to ${movement.to_location_name || 'Location'}`,
          date: movement.movement_date,
          user: movement.received_by_name || 'Unknown'
        })),
        ...stockRequests.map(request => ({
          type: 'stock_request',
          description: `${request.quantity} x ${request.item_name || 'Item'} requested`,
          date: request.created_at,
          user: request.requested_by_name || 'Unknown',
          status: request.status
        })),
        ...procurements.map(procurement => ({
          type: 'procurement',
          description: `${procurement.quantity} x ${procurement.item_name || 'Item'} procured`,
          date: procurement.created_at,
          orderNumber: procurement.order_number
        }))
      ];

      // Sort by date (most recent first) and take the latest 5
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
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