import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ChairmanDashboard from "./pages/ChairmanDashboard";
import MainInventoryDashboard from "./pages/MainInventoryDashboard";
import InventoryManagerDashboard from "./pages/InventoryManagerDashboard";
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
import StockInHand from "./pages/StockInHand";
import InventoryTransactions from "./pages/InventoryTransactions";
import LowStock from "./pages/LowStock";
import OutOfStock from "./pages/OutOfStock";
import StockMovement from "./pages/StockMovement";
import Transit from "./pages/Transit";
import ContractSchedule from "./pages/ContractSchedule";
import DeliveryNote from "./pages/DeliveryNote";
import ReceivingNote from "./pages/ReceivingNote";
import SendingStockRequest from "./UserView/SendingStockReq";
import StockRequestsManagement from "./pages/StockRequest";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from "./pages/AuditLogs";
import DeadStock from './pages/DeadStock';
import UserDiscard from "./pages/UserDiscard";

function App() {
  // Always clear login state on app load to force login page
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('userType');
  sessionStorage.removeItem('portalID');

  // Determine which dashboard to show based on userType
  const getDashboardComponent = () => {
    const userType = sessionStorage.getItem("userType");
    if (userType === "chairman") return <ChairmanDashboard />;
    if (userType === "main_inventory_manager") return <MainInventoryDashboard />;
    if (userType === "inventory_manager") return <InventoryManagerDashboard />;
    return <Dashboard />; // fallback
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Routes>
          {/* Public route */}
          <Route path="/loginpage" element={<Loginpage />} />

          {/* Root path - redirect to appropriate dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate
                  to={
                    sessionStorage.getItem("userType") === "chairman"
                      ? "/chairman-dashboard"
                      : sessionStorage.getItem("userType") === "main_inventory_manager"
                      ? "/main-inventory-dashboard"
                      : sessionStorage.getItem("userType") === "inventory_manager"
                      ? "/inventory-manager-dashboard"
                      : "/admin-dashboard"
                  }
                />
              </ProtectedRoute>
            }
          />

          {/* Chairman Dashboard Route */}
          <Route
            path="/chairman-dashboard"
            element={
              <ProtectedRoute>
                <ChairmanDashboard />
              </ProtectedRoute>
            }
          />

          {/* Main Inventory Manager Dashboard Route */}
          <Route
            path="/main-inventory-dashboard"
            element={
              <ProtectedRoute>
                <MainInventoryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Inventory Manager Dashboard Route */}
          <Route
            path="/inventory-manager-dashboard"
            element={
              <ProtectedRoute>
                <InventoryManagerDashboard />
              </ProtectedRoute>
            }
          />

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
                    sessionStorage.getItem("userType") === "chairman"
                      ? "/chairman-dashboard"
                      : sessionStorage.getItem("userType") === "main_inventory_manager"
                      ? "/main-inventory-dashboard"
                      : sessionStorage.getItem("userType") === "inventory_manager"
                      ? "/inventory-manager-dashboard"
                      : "/admin-dashboard"
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
          <Route
            path="/transit"
            element={
              <ProtectedRoute>
                <Transit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contract-schedule"
            element={
              <ProtectedRoute>
                <ContractSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-note"
            element={
              <ProtectedRoute>
                <DeliveryNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiving-note"
            element={
              <ProtectedRoute>
                <ReceivingNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-in-hand"
            element={
              <ProtectedRoute>
                <StockInHand />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-transactions"
            element={
              <ProtectedRoute>
                <InventoryTransactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/low-stock"
            element={
              <ProtectedRoute>
                <LowStock />
              </ProtectedRoute>
            }
          />
          <Route
            path="/out-of-stock"
            element={
              <ProtectedRoute>
                <OutOfStock />
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