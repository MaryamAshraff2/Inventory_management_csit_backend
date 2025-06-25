import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalUsers: 0,
    totalItems: 0,
    pendingRequests: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
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
        setStats(statsData)
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
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userType')
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
        {/* Pass handleLogout to Navbar */}
        <Navbar title="Dashboard" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Dynamic greeting based on user type */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Hello {localStorage.getItem('userType') === 'admin' ? 'Admin' : 'User'}
            </h1>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading dashboard data...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Stats Cards */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-medium text-blue-800">Total Departments</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalDepartments}</p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                    <h3 className="text-lg font-medium text-green-800">Total Users</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalUsers}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                    <h3 className="text-lg font-medium text-purple-800">Total Items</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalItems}</p>
                  </div>
                  
                  <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                    <h3 className="text-lg font-medium text-amber-800">Pending Requests</h3>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingRequests}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="border-b pb-3">
                            <div className="flex items-start space-x-2">
                              <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              <div className="flex-1">
                                <p className="text-gray-600">{activity.description}</p>
                                <p className="text-sm text-gray-400">
                                  {activity.user && `by ${activity.user} • `}
                                  {formatDate(activity.date)}
                                  {activity.status && (
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                      activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                      activity.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {activity.status}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => navigate('/departments')}
                        className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition"
                      >
                        Manage Departments
                      </button>
                      <button 
                        onClick={() => navigate('/stock-requests')}
                        className="bg-green-100 text-green-800 p-4 rounded-lg hover:bg-green-200 transition"
                      >
                        View Requests
                      </button>
                      <button 
                        onClick={() => navigate('/items')}
                        className="bg-purple-100 text-purple-800 p-4 rounded-lg hover:bg-purple-200 transition"
                      >
                        Manage Inventory
                      </button>
                      <button 
                        onClick={() => navigate('/stock-movements')}
                        className="bg-amber-100 text-amber-800 p-4 rounded-lg hover:bg-amber-200 transition"
                      >
                        Stock Movements
                      </button>
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

export default Dashboard 