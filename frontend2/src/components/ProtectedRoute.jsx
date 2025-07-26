// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
  const userType = sessionStorage.getItem('userType')

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/loginpage" replace />
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && userType !== requiredRole) {
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin-dashboard" replace />
    } else {
      return <Navigate to="/user-dashboard" replace />
    }
  }

  // If all checks pass, render the protected component
  return children
}

export default ProtectedRoute
