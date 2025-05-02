import { Link, useLocation } from 'react-router-dom'
import { FaTachometerAlt, FaUsers, FaBuilding, FaMapMarkerAlt, FaTags, FaBoxes, FaShoppingCart, FaWarehouse, FaExchangeAlt, FaClipboardList, FaTrashAlt, FaChartBar } from 'react-icons/fa'
import '../styles/sidebar.css'

const Sidebar = () => {
  const location = useLocation();

  // Helper function to determine active link
  const isActive = (path) => {
    return location.pathname === path;
  }

  return (
    <div className="sidebar w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">ManageVerse</h1>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
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
              to="/DiscardedItems" 
              className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                isActive('/DiscardedItems') ? 'bg-gray-700' : ''
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
        </ul>
      </nav>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <p className="text-sm text-gray-400">Activate Windows</p>
        <p className="text-xs text-gray-500">Go to Settings to activate Windows.</p>
      </div>
    </div>
  )
}

export default Sidebar