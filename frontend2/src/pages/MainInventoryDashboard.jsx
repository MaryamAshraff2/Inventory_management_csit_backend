import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'

const MainInventoryDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalMainInventoryItems: 0,
    pendingRequests: 0,
    mainInventoryValue: 0,
    recentMovements: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    const userType = sessionStorage.getItem('userType')
    if (!isLoggedIn || userType !== 'main_inventory_manager') {
      navigate('/loginpage')
    }
  }, [navigate])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, activityData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity()
        ])
        
        // Filter for main inventory specific data
        const mainInventoryStats = {
          totalMainInventoryItems: statsData.totalItems || 0,
          pendingRequests: statsData.pendingRequests || 0,
          mainInventoryValue: 0, // Will be calculated from main inventory items
          recentMovements: 0
        }
        
        setStats(mainInventoryStats)
        setRecentActivity(activityData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userType')
    navigate('/loginpage')
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'stock_movement':
        return '🔄'
      case 'stock_request':
        return '📋'
      case 'procurement':
        return '📦'
      default:
        return '📝'
    }
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Main Inventory Manager Dashboard" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Hello Main Inventory Manager
            </h1>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading dashboard data...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Main Inventory Items</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalMainInventoryItems}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Pending Requests</p>
                        <p className="text-2xl font-bold text-green-900">{stats.pendingRequests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Inventory Value</p>
                        <p className="text-2xl font-bold text-purple-900">${stats.mainInventoryValue}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Recent Movements</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.recentMovements}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Main Inventory Activity</h2>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(activity.date)} • {activity.user}
                                {activity.status && (
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                    activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {activity.status}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Overview</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Access Level</span>
                        <span className="text-sm font-bold text-blue-900">Main Inventory Only</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">Can View</span>
                        <span className="text-sm font-bold text-green-900">Main Inventory Assets</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-purple-800">Can Edit</span>
                        <span className="text-sm font-bold text-purple-900">Main Inventory Only</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm font-medium text-orange-800">Reports Access</span>
                        <span className="text-sm font-bold text-orange-900">Main Inventory Reports</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

export default MainInventoryDashboard 