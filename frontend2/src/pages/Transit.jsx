import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaTruck, FaCheck, FaTimes, FaPlus } from 'react-icons/fa'

const Transit = () => {
  const navigate = useNavigate()
  const [transits, setTransits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [selectedTransit, setSelectedTransit] = useState(null)
  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  
  // Form states
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
    from_location_id: '',
    to_location_id: '',
    sent_by_id: ''
  })
  
  const [receiveData, setReceiveData] = useState({
    received_by_user_id: '',
    notes: ''
  })

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchTransits()
    fetchUsers()
    fetchItems()
    fetchLocations()
  }, [navigate])

  const fetchTransits = async () => {
    try {
      const userType = sessionStorage.getItem('userType')
      const userLocation = sessionStorage.getItem('userLocation')
      
      const response = await fetch(`http://localhost:8000/inventory/transits/?userType=${userType}&userLocation=${userLocation || ''}`)
      const data = await response.json()
      setTransits(data)
    } catch (error) {
      console.error('Error fetching transits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/users/')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const userType = sessionStorage.getItem('userType')
      const userLocation = sessionStorage.getItem('userLocation')
      
      const response = await fetch(`http://localhost:8000/inventory/items/?userType=${userType}&userLocation=${userLocation || ''}`)
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/locations/')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleCreateTransit = async (e) => {
    e.preventDefault()
    try {
      const userType = sessionStorage.getItem('userType')
      const userLocation = sessionStorage.getItem('userLocation')
      
      const response = await fetch('http://localhost:8000/inventory/transits/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType,
          userLocation
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          item_id: '',
          quantity: '',
          from_location_id: '',
          to_location_id: '',
          sent_by_id: ''
        })
        fetchTransits()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create transit'}`)
      }
    } catch (error) {
      console.error('Error creating transit:', error)
      alert('Error creating transit')
    }
  }

  const handleReceiveTransit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/inventory/api/transit/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transit_id: selectedTransit.id,
          ...receiveData
        }),
      })

      if (response.ok) {
        setShowReceiveModal(false)
        setSelectedTransit(null)
        setReceiveData({
          received_by_user_id: '',
          notes: ''
        })
        fetchTransits()
        alert('Transit marked as delivered successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to mark transit as delivered'}`)
      }
    } catch (error) {
      console.error('Error receiving transit:', error)
      alert('Error receiving transit')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_transit':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">In Transit</span>
      case 'delivered':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Delivered</span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Cancelled</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userType')
    navigate('/loginpage')
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Transit Management" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Transit Management</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
              >
                <FaPlus className="mr-2" />
                Create Transit
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading transits...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transits.map((transit) => (
                      <tr key={transit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transit.item_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transit.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transit.from_location_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transit.to_location_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transit.sent_by_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transit.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(transit.sent_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {transit.status === 'in_transit' && (
                            <button
                              onClick={() => {
                                setSelectedTransit(transit)
                                setShowReceiveModal(true)
                              }}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <FaCheck className="inline mr-1" />
                              Receive
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {transits.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transits found
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Transit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Transit</h3>
              <form onSubmit={handleCreateTransit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                  <select
                    value={formData.item_id}
                    onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="1"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Location</label>
                  <select
                    value={formData.from_location_id}
                    onChange={(e) => setFormData({...formData, from_location_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select From Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Location</label>
                  <select
                    value={formData.to_location_id}
                    onChange={(e) => setFormData({...formData, to_location_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select To Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sent By</label>
                  <select
                    value={formData.sent_by_id}
                    onChange={(e) => setFormData({...formData, sent_by_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Create Transit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receive Transit Modal */}
      {showReceiveModal && selectedTransit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Receive Transit</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Receiving: {selectedTransit.quantity} x {selectedTransit.item_name}
                </p>
                <p className="text-sm text-gray-600">
                  From: {selectedTransit.from_location_name} → To: {selectedTransit.to_location_name}
                </p>
              </div>
              <form onSubmit={handleReceiveTransit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
                  <select
                    value={receiveData.received_by_user_id}
                    onChange={(e) => setReceiveData({...receiveData, received_by_user_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={receiveData.notes}
                    onChange={(e) => setReceiveData({...receiveData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes about the receipt..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReceiveModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Mark as Delivered
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Transit 