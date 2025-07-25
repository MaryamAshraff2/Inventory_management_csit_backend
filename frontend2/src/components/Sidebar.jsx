import { Link, useLocation } from 'react-router-dom'
import { FaTachometerAlt, FaUsers, FaBuilding, FaMapMarkerAlt, FaTags, FaBoxes, FaShoppingCart, FaWarehouse, FaExchangeAlt, FaClipboardList, FaTrashAlt, FaChartBar } from 'react-icons/fa'
import '../styles/sidebar.css'

const Sidebar = () => {
  const location = useLocation();
  const userType = localStorage.getItem('userType'); // 'admin' or 'user'

  // Helper function to determine active link
  const isActive = (path) => {
    return location.pathname === path;
  }

  return (
    <div className="sidebar w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">NED UET Inventory</h1>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          
          {/* Shared - Dashboard */}
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

          {/* Admin-only links */}
          {userType === 'admin' && (
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
              <li>
                <Link 
                  to="/dead-stock" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/dead-stock') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaBoxes className="mr-3" />
                  Dead Stock
                </Link>
              </li>
              <li>
                <Link 
                  to="/stock-movements" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/stock-movements') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaExchangeAlt className="mr-3" />
                  Stock Movements
                </Link>
              </li>
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
              <li>
                <Link 
                  to="/discardeditems" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/discardeditems') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaTrashAlt className="mr-3" />
                  Discarded Items
                </Link>
              </li>
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
            </>
          )}

          {/* User-only links */}
          {userType === 'user' && (
            <>
              <li>
                <Link 
                  to="/user-inventory" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/user-inventory') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaWarehouse className="mr-3" />
                  User Inventory
                </Link>
              </li>
              <li>
                <Link 
                  to="/user-stock-requests" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/user-stock-requests') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaClipboardList className="mr-3" />
                  Stock Requests
                </Link>
              </li>
              <li>
                <Link 
                  to="/discardeditems" 
                  className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                    isActive('/discardeditems') ? 'bg-gray-700' : ''
                  }`}
                >
                  <FaTrashAlt className="mr-3" />
                  Discarded Items
                </Link>
              </li>
            </>
          )}
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