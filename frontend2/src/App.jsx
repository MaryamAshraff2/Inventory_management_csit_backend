import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard"; // user-specific dashboard
import UserStockRequests from "./pages/UserStockRequests";
import Departments from "./pages/Departments";
import Users from "./pages/Users";
import Categories from "./pages/categories";
import Items from "./pages/Items";
import Locations from "./pages/Locations";
import Procurements from "./pages/procurements";
import DiscardedItems from "./pages/DiscardedItems";
import Loginpage from "./pages/loginpage";
import Inventory from "./pages/Inventory";
import UserInventory from "./pages/UserInventory";
import StockMovement from "./pages/StockMovement";
import SendingStockRequest from "./UserView/SendingStockReq";
import StockRequestsManagement from "./pages/StockRequest";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from "./pages/AuditLogs";
import DeadStock from './pages/DeadStock';
import UserDiscard from "./pages/UserDiscard";

function App() {
  // Always clear login state on app load to force login page
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userType');
  localStorage.removeItem('portalID');

  // Determine which dashboard to show based on userType
  const getDashboardComponent = () => {
    const userType = localStorage.getItem("userType");
    return userType === "admin" ? <Dashboard /> : <UserDashboard />;
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Routes>
          {/* Public route */}
          <Route path="/loginpage" element={<Loginpage />} />

          {/* Admin Dashboard Route */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy dashboard route - redirect based on user type */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate
                  to={
                    localStorage.getItem("userType") === "admin"
                      ? "/admin-dashboard"
                      : "/user-dashboard"
                  }
                />
              </ProtectedRoute>
            }
          />

          {/* User Dashboard Route */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy user dashboard route */}
          <Route
            path="/userdashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/user-dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-stock-requests"
            element={
              <ProtectedRoute>
                <UserStockRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes (accessible if userType is 'admin') */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute>
                <Locations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurements"
            element={
              <ProtectedRoute>
                <Procurements />
              </ProtectedRoute>
            }
          />

          {/* Shared or user-accessible routes */}
          <Route
            path="/discardeditems"
            element={
              <ProtectedRoute>
                <DiscardedItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
           <Route
            path="/user-inventory"
            element={
              <ProtectedRoute>
                <UserInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute>
                <StockMovement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sending-stock-requests"
            element={
              <ProtectedRoute>
                <SendingStockRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-requests"
            element={
              <ProtectedRoute>
                <StockRequestsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route path="/dead-stock" element={<DeadStock />} />
          <Route
            path="/user-discard-requests"
            element={
              <ProtectedRoute>
                <UserDiscard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate
                  to={
                    localStorage.getItem("userType") === "admin"
                      ? "/admin-dashboard"
                      : "/user-dashboard"
                  }
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;