import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
    }
  }, [navigate])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userType')
    navigate('/loginpage')
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800">Total Departments</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h3 className="text-lg font-medium text-green-800">Total Users</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">45</p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                <h3 className="text-lg font-medium text-purple-800">Total Items</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">128</p>
              </div>
              
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                <h3 className="text-lg font-medium text-amber-800">Pending Requests</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">5</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-gray-600">New user registered - John Doe</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-gray-600">IT department updated</p>
                    <p className="text-sm text-gray-400">5 hours ago</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-gray-600">New item added - Microscope</p>
                    <p className="text-sm text-gray-400">1 day ago</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition">
                    Add New User
                  </button>
                  <button className="bg-green-100 text-green-800 p-4 rounded-lg hover:bg-green-200 transition">
                    Create Request
                  </button>
                  <button className="bg-purple-100 text-purple-800 p-4 rounded-lg hover:bg-purple-200 transition">
                    Manage Inventory
                  </button>
                  <button className="bg-amber-100 text-amber-800 p-4 rounded-lg hover:bg-amber-200 transition">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default Dashboard 