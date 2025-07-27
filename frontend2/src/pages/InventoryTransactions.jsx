import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaCalendarAlt, FaFilter, FaDownload, FaChartBar, FaExchangeAlt, FaEye } from 'react-icons/fa'

const InventoryTransactions = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    // Set default date range to last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [navigate])

  useEffect(() => {
    if (startDate && endDate) {
      fetchTransactions()
      fetchSummaryData()
    }
  }, [startDate, endDate])

  const fetchTransactions = async () => {
    setLoading(true)
    setError('')
    
    try {
      const url = `http://localhost:8000/inventory/api/inventory-transactions/?start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch transactions')
      }
      
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryData = async () => {
    try {
      const url = `http://localhost:8000/inventory/api/inventory-transactions/summary/?start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Error fetching summary data:', error)
    }
  }

  const handleExport = async () => {
    try {
      const url = `http://localhost:8000/inventory/api/inventory-transactions/export/?start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export transactions')
      }
      
      const data = await response.json()
      
      // Download CSV file
      const blob = new Blob([data.csv_data], { type: 'text/csv' })
      const url_blob = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url_blob
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url_blob)
    } catch (error) {
      console.error('Error exporting transactions:', error)
      setError(error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userType')
    navigate('/loginpage')
  }

  const handleDateChange = () => {
    if (startDate && endDate) {
      fetchTransactions()
      fetchSummaryData()
    }
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Inventory Transactions" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Inventory Transactions</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <FaChartBar className="mr-2" />
                  {showSummary ? 'Hide Summary' : 'Show Summary'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={transactions.length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Date Range Filter</h2>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={handleDateChange}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <FaFilter className="mr-2" />
                  Apply Filter
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-medium">Error: {error}</div>
              </div>
            )}

            {/* Summary Section */}
            {showSummary && summaryData && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Transaction Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">
                      {summaryData.summary.total_transactions}
                    </div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">
                      {summaryData.summary.total_quantity_moved}
                    </div>
                    <div className="text-sm text-gray-600">Total Quantity Moved</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-purple-600">
                      {summaryData.summary.unique_items}
                    </div>
                    <div className="text-sm text-gray-600">Unique Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-orange-600">
                      {summaryData.summary.unique_locations}
                    </div>
                    <div className="text-sm text-gray-600">Unique Locations</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-indigo-600">
                      {summaryData.summary.unique_users}
                    </div>
                    <div className="text-sm text-gray-600">Unique Users</div>
                  </div>
                </div>
                
                {/* Top Items */}
                {summaryData.top_items && summaryData.top_items.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Top Moved Items</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summaryData.top_items.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{item.item__name}</div>
                          <div className="text-sm text-gray-600">
                            {item.total_quantity} units | {item.transaction_count} transactions
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Top Users */}
                {summaryData.top_users && summaryData.top_users.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Top Users by Movements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {summaryData.top_users.map((user, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">
                            {user.moved_by__first_name} {user.moved_by__last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.movement_count} movements
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Table */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Transactions ({transactions.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movement Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moved By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{transaction.transaction_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.item_name}</div>
                          <div className="text-sm text-gray-500">ID: {transaction.item_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.from_location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.to_location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(transaction.movement_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.moved_by}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={transaction.notes}>
                            {transaction.notes || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {transactions.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions found for the selected date range
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

export default InventoryTransactions 