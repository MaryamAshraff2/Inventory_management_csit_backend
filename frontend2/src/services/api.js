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
  getTotalInventory: () => apiRequest('/items/total_inventory/'),
  getLocationsWithStock: (itemId) => apiRequest(`/items/locations_with_stock/?item_id=${itemId}`),
  getItemsAtLocation: (locationId) => apiRequest(`/items/items_at_location/?location_id=${locationId}`),
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

// Reports API
export const reportsAPI = {
  // Get all reports
  getAll: () => apiRequest('/reports/'),
  
  // Get a specific report
  getById: (id) => apiRequest(`/reports/${id}/`),
  
  // Create a new report
  create: (data) => apiRequest('/reports/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update a report
  update: (id, data) => apiRequest(`/reports/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete a report
  delete: (id) => apiRequest(`/reports/${id}/`, {
    method: 'DELETE',
  }),

  // Generate specific report types
  generateProcurementReport: (filters) => apiRequest('/reports/generate_procurement_report/', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  }),

  generateStockMovementReport: (filters) => apiRequest('/reports/generate_stock_movement_report/', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  }),

  generateInventoryReport: (filters) => apiRequest('/reports/generate_inventory_report/', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  }),

  generateStockRequestsReport: (filters) => apiRequest('/reports/generate_stock_requests_report/', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  }),

  generateDiscardedItemsReport: (filters) => apiRequest('/reports/generate_discarded_items_report/', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  }),

  // Export reports
  exportPdf: async (reportId) => {
    const url = `${API_BASE_URL}/reports/${reportId}/export_pdf/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'report.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get the blob and create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, filename };
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  },

  exportExcel: async (reportId) => {
    const url = `${API_BASE_URL}/reports/${reportId}/export_excel/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get the blob and create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Excel export failed:', error);
      throw error;
    }
  },
};

// Locations API
export const locationsAPI = {
  getAll: () => apiRequest('/locations/'),
  getById: (id) => apiRequest(`/locations/${id}/`),
  getByProcurement: (procurementId) => apiRequest(`/locations/by_procurement/?procurement_id=${procurementId}`),
}; 