import { Link, useLocation } from 'react-router-dom'
import { FaTachometerAlt, FaUsers, FaBuilding, FaMapMarkerAlt, FaTags, FaBoxes, FaShoppingCart, FaWarehouse, FaExchangeAlt, FaClipboardList, FaTrashAlt, FaChartBar, FaTruck, FaFileContract, FaTruckLoading, FaCheckCircle, FaBoxOpen, FaHistory, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa'
import '../styles/sidebar.css'

const Sidebar = () => {
  const location = useLocation();
  const userType = sessionStorage.getItem('userType'); // 'chairman', 'main_inventory_manager', 'inventory_manager'

  // Helper function to determine active link
  const isActive = (path) => {
    return location.pathname === path;
  }

  // Helper function to check if user can access a feature
  const canAccess = (feature) => {
    switch (feature) {
      case 'all':
        return userType === 'chairman';
      case 'main_inventory':
        return userType === 'chairman' || userType === 'main_inventory_manager';
      case 'lab_inventory':
        return userType === 'chairman' || userType === 'inventory_manager';
      case 'management':
        return userType === 'chairman' || userType === 'main_inventory_manager';
      case 'superuser':
        return userType === 'superuser';
      default:
        return false;
    }
  }

  return (
    <div className="sidebar w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">NED UET Inventory</h1>
        <p className="text-sm text-gray-400 mt-1">
          {userType === 'chairman' && 'Chairman'}
          {userType === 'main_inventory_manager' && 'Main Inventory Manager'}
          {userType === 'inventory_manager' && 'Inventory Manager'}
        </p>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          
          {/* Dashboard - All users */}
          <li>
            <Link 
              to="/" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/') ? 'bg-gray-700' : ''
              }`}
            >
              <FaTachometerAlt className="mr-3" />
              Dashboard
            </Link>
          </li>

          {/* Management features - Chairman and Main Inventory Manager */}
          {canAccess('management') && (
            <>
              <li>
                <Link 
                  to="/users" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/users') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaUsers className="mr-3" />
                  Users
                </Link>
              </li>
              <li>
                <Link 
                  to="/departments" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/departments') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaBuilding className="mr-3" />
                  Departments
                </Link>
              </li>
            </>
          )}

          {/* Superuser-only features */}
          {canAccess('superuser') && (
            <>
              <li>
                <Link 
                  to="/superuser-departments" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/superuser-departments') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaBuilding className="mr-3" />
                  Manage Departments & Chairmen
                </Link>
              </li>
            </>
          )}

          {/* Management features - Chairman and Main Inventory Manager */}
          {canAccess('management') && (
            <>
              <li>
                <Link 
                  to="/locations" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/locations') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaMapMarkerAlt className="mr-3" />
                  Locations
                </Link>
              </li>
              <li>
                <Link 
                  to="/categories" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/categories') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaTags className="mr-3" />
                  Categories
                </Link>
              </li>
            </>
          )}

          {/* Inventory Management - All users */}
          <li>
            <Link 
              to="/items" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/items') ? 'bg-gray-700' : ''
              }`}
            >
              <FaBoxes className="mr-3" />
              Items
            </Link>
          </li>

          {/* Procurement - Chairman and Main Inventory Manager */}
          {canAccess('main_inventory') && (
            <li>
              <Link 
                to="/procurements" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActive('/procurements') ? 'bg-gray-700' : ''
                }`}
              >
                <FaShoppingCart className="mr-3" />
                Procurements
              </Link>
            </li>
          )}

          {/* Contract Schedule - Chairman and Main Inventory Manager */}
          {canAccess('main_inventory') && (
            <li>
              <Link 
                to="/contract-schedule" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActive('/contract-schedule') ? 'bg-gray-700' : ''
                }`}
              >
                <FaFileContract className="mr-3" />
                Contract Schedule
              </Link>
            </li>
          )}

          {/* Delivery Note - Chairman and Main Inventory Manager */}
          {canAccess('main_inventory') && (
            <li>
              <Link 
                to="/delivery-note" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActive('/delivery-note') ? 'bg-gray-700' : ''
                }`}
              >
                <FaTruckLoading className="mr-3" />
                Delivery Note
              </Link>
            </li>
          )}

          {/* Receiving Note - Chairman and Main Inventory Manager */}
          {canAccess('main_inventory') && (
            <li>
              <Link 
                to="/receiving-note" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActive('/receiving-note') ? 'bg-gray-700' : ''
                }`}
              >
                <FaCheckCircle className="mr-3" />
                Receiving Note
              </Link>
            </li>
          )}

          {/* Inventory - All users */}
          <li>
            <Link 
              to="/inventory" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/inventory') ? 'bg-gray-700' : ''
              }`}
            >
              <FaWarehouse className="mr-3" />
              Inventory
            </Link>
          </li>

          {/* Stock in Hand - All users */}
          <li>
            <Link 
              to="/stock-in-hand" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/stock-in-hand') ? 'bg-gray-700' : ''
              }`}
            >
              <FaBoxOpen className="mr-3" />
              Stock in Hand
            </Link>
          </li>

          {/* Inventory Transactions - All users */}
          <li>
            <Link 
              to="/inventory-transactions" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/inventory-transactions') ? 'bg-gray-700' : ''
              }`}
            >
              <FaHistory className="mr-3" />
              Inventory Transactions
            </Link>
          </li>

          {/* Low Stock - All users */}
          <li>
            <Link 
              to="/low-stock" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/low-stock') ? 'bg-gray-700' : ''
              }`}
            >
              <FaExclamationTriangle className="mr-3" />
              Low Stock
            </Link>
          </li>

          {/* Out of Stock - All users */}
          <li>
            <Link 
              to="/out-of-stock" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/out-of-stock') ? 'bg-gray-700' : ''
              }`}
            >
              <FaTimesCircle className="mr-3" />
              Out of Stock
            </Link>
          </li>

          {/* Stock Movement - All users */}
          <li>
            <Link 
              to="/stock-movement" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/stock-movement') ? 'bg-gray-700' : ''
              }`}
            >
              <FaExchangeAlt className="mr-3" />
              Stock Movement
            </Link>
          </li>

          {/* Transit - All users */}
          <li>
            <Link 
              to="/transit" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/transit') ? 'bg-gray-700' : ''
              }`}
            >
              <FaTruck className="mr-3" />
              Transit
            </Link>
          </li>

          {/* Stock Requests - All users */}
          <li>
            <Link 
              to="/stock-requests" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/stock-requests') ? 'bg-gray-700' : ''
              }`}
            >
              <FaClipboardList className="mr-3" />
              Stock Requests
            </Link>
          </li>

          {/* Discarded Items - All users */}
          <li>
            <Link 
              to="/discarded-items" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/discarded-items') ? 'bg-gray-700' : ''
              }`}
            >
              <FaTrashAlt className="mr-3" />
              Discarded Items
            </Link>
          </li>

          {/* Reports - All users */}
          <li>
            <Link 
              to="/reports" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/reports') ? 'bg-gray-700' : ''
              }`}
            >
              <FaChartBar className="mr-3" />
              Reports
            </Link>
          </li>

          {/* Audit Logs - Chairman only */}
          {userType === 'chairman' && (
            <li>
              <Link 
                to="/audit-logs" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActive('/audit-logs') ? 'bg-gray-700' : ''
                }`}
              >
                <FaClipboardList className="mr-3" />
                Audit Logs
              </Link>
            </li>
          )}

          {/* Dead Stock - All users */}
          <li>
            <Link 
              to="/dead-stock" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/dead-stock') ? 'bg-gray-700' : ''
              }`}
            >
              <FaTrashAlt className="mr-3" />
              Dead Stock
            </Link>
          </li>

        </ul>
      </nav>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <p className="text-sm text-gray-400">Developed by CS department</p>
        <p className="text-xs text-gray-500">NED UET</p>
      </div>
    </div>
  )
}

export default Sidebar