# Discarded Items API Integration

This document describes the integration between the React frontend and Django backend for the Discarded Items functionality.

## Backend API Endpoints

### Base URL
```
http://localhost:8000/inventory/
```

### Discarded Items Endpoints
- `GET /discardeditems/` - List all discarded items
- `POST /discardeditems/` - Create a new discarded item
- `GET /discardeditems/{id}/` - Get a specific discarded item
- `PUT /discardeditems/{id}/` - Update a discarded item
- `DELETE /discardeditems/{id}/` - Delete a discarded item

### Supporting Endpoints
- `GET /items/` - List all items (for dropdown)
- `GET /users/` - List all users (for dropdown)
- `GET /categories/` - List all categories
- `GET /departments/` - List all departments

## Frontend Components

### 1. DiscardedItems.jsx
**Location**: `src/pages/DiscardedItems.jsx`

**Features**:
- Displays list of discarded items in a table format
- Pagination support
- Real-time data fetching from API
- Error handling and loading states
- Refresh functionality
- View details modal

**API Integration**:
- Uses `discardedItemsAPI.getAll()` to fetch data
- Uses `discardedItemsAPI.create()` to create new items
- Automatic refresh after successful creation

### 2. AddDiscardedItemForm.jsx
**Location**: `src/components/AddDiscardedItemForm.jsx`

**Features**:
- Form for creating new discarded items
- Dynamic dropdowns populated from API
- Form validation
- Loading and error states
- Real-time data fetching for dropdowns

**API Integration**:
- Uses `itemsAPI.getAll()` to populate items dropdown
- Uses `usersAPI.getAll()` to populate users dropdown
- Submits data to parent component for API call

### 3. API Service
**Location**: `src/services/api.js`

**Features**:
- Centralized API configuration
- Error handling
- Request/response interceptors
- Reusable API functions

## Data Flow

1. **Page Load**: `DiscardedItems` component fetches discarded items list
2. **Form Open**: `AddDiscardedItemForm` fetches items and users for dropdowns
3. **Form Submit**: Form data is validated and sent to parent component
4. **API Call**: Parent component transforms data and calls API
5. **Success**: List is refreshed to show new data
6. **Error**: User is notified of any errors

## Data Transformation

### Frontend to Backend
```javascript
// Frontend form data
{
  item: "1",           // Item ID
  quantity: "5",       // Quantity as string
  reason: "Damaged",   // Reason
  discardedBy: "1",    // User ID
  notes: "Water damage" // Notes
}

// Transformed for API
{
  item_id: 1,          // Converted to integer
  quantity: 5,         // Converted to integer
  reason: "Damaged",
  discarded_by_id: 1,  // Converted to integer
  notes: "Water damage"
}
```

### Backend to Frontend
```javascript
// API response
{
  id: 1,
  item: {
    id: 1,
    name: "Laptop",
    category: { name: "Electronics" }
  },
  quantity: 5,
  date: "2024-01-15",
  reason: "Damaged",
  discarded_by: {
    id: 1,
    name: "John Smith",
    department: { name: "IT" }
  },
  notes: "Water damage"
}
```

## Error Handling

### Network Errors
- Displayed as user-friendly messages
- Retry functionality available
- Console logging for debugging

### Validation Errors
- Form-level validation before submission
- API-level validation with error messages
- User feedback for invalid data

### Loading States
- Spinner during data fetching
- Disabled buttons during operations
- Clear loading indicators

## Testing

### Backend Testing
```bash
# Test API endpoints
curl http://localhost:8000/inventory/discardeditems/
curl http://localhost:8000/inventory/items/
curl http://localhost:8000/inventory/users/
```

### Frontend Testing
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm start`
3. Navigate to Discarded Items page
4. Test create, read, update, delete operations

## Configuration

### CORS Settings
Ensure Django CORS settings allow frontend domain:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### API Base URL
Update in `src/services/api.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:8000/inventory';
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check Django CORS settings
2. **404 Errors**: Verify API endpoints are registered
3. **500 Errors**: Check Django server logs
4. **Network Errors**: Ensure both servers are running

### Debug Steps
1. Check browser console for errors
2. Check Django server logs
3. Test API endpoints directly with curl
4. Verify data format matches expectations 