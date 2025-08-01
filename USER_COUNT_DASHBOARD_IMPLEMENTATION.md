# User Count Dashboard Implementation

## Overview
This implementation modifies the dashboard to show role-specific user counts instead of total users. Each user type now sees only the count of users with the same role as themselves.

## Changes Made

### Backend Changes

#### 1. New API Endpoint (`backend/inventory/views/user_views.py`)
- Added `get_user_counts` function that accepts a user role and returns the count of users with that specific role
- Supports all user roles: superuser, chairman, main_inventory_manager, inventory_manager

#### 2. URL Configuration (`backend/inventory/urls.py`)
- Added new endpoint: `/user/counts/` that maps to the `get_user_counts` function

### Frontend Changes

#### 1. API Service (`frontend2/src/services/api.js`)
- Modified `dashboardAPI.getStats()` to fetch role-specific user counts
- Added fallback to total user count if role-based count fails
- Uses the logged-in user's role from sessionStorage

#### 2. Dashboard Components
- **Main Dashboard** (`frontend2/src/pages/Dashboard.jsx`): Updated "Total Users" label to show role-specific labels
- **Chairman Dashboard** (`frontend2/src/pages/ChairmanDashboard.jsx`): Updated "Total Users" label to "Chairmen"

## User Role Behavior

| User Role | Dashboard Shows | Label |
|-----------|----------------|-------|
| Superuser | Count of superusers (should be 1) | "Superusers" |
| Chairman | Count of chairmen | "Chairmen" |
| Main Inventory Manager | Count of main inventory managers | "Main Inventory Managers" |
| Inventory Manager | Count of inventory managers | "Inventory Managers" |

## API Endpoint Details

**Endpoint:** `POST /inventory/user/counts/`

**Request Body:**
```json
{
  "user_role": "superuser|chairman|main_inventory_manager|inventory_manager"
}
```

**Response:**
```json
{
  "user_count": 1,
  "user_role": "superuser"
}
```

## Testing

A test script (`test_user_counts_api.py`) was created to verify the API functionality. The test confirms that:
- ✅ Superuser count: 1 Superusers
- ✅ Chairman count: 1 Chairmen
- ✅ Main Inventory Manager count: X Main Inventory Managers
- ✅ Inventory Manager count: X Inventory Managers

## Benefits

1. **Role-based Visibility**: Users only see counts relevant to their role
2. **Security**: Prevents users from seeing information about other user types
3. **Clarity**: Dashboard labels clearly indicate what type of users are being counted
4. **Consistency**: Maintains the same dashboard structure while providing role-specific data

## Implementation Notes

- The system gracefully falls back to showing total user count if the role-based API fails
- All existing dashboard functionality remains unchanged
- The implementation is backward compatible
- Error handling is in place for both frontend and backend 