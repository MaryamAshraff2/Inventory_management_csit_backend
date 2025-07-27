import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaExclamationTriangle, FaDownload, FaChartBar, FaFilter, FaBoxes, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa'

const LowStock = () => {
  const navigate = useNavigate()
  const [lowStockItems, setLowStockItems] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [viewMode, setViewMode] = useState('all') // 'all' or 'category'
  const [urgencyFilter, setUrgencyFilter] = useState('all') // 'all', 'critical', 'warning', 'notice'

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchCategories()
    fetchLowStockData()
    fetchSummaryData()
  }, [navigate])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/categories/')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchLowStockData = async () => {
    setLoading(true)
    try {
      let url = 'http://localhost:8000/inventory/api/low-stock/'
      const params = new URLSearchParams()
      
      if (selectedCategory) {
        url = 'http://localhost:8000/inventory/api/low-stock/by-category/'
        params.append('category', selectedCategory)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (selectedCategory) {
        // Data is grouped by category, flatten it
        const flattenedData = []
        Object.values(data).forEach(categoryItems => {
          flattenedData.push(...categoryItems)
        })
        setLowStockItems(flattenedData)
      } else {
        setLowStockItems(data)
      }
    } catch (error) {
      console.error('Error fetching low stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/api/low-stock/summary/')
      const data = await response.json()
      setSummaryData(data)
    } catch (error) {
      console.error('Error fetching summary data:', error)
    }
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setViewMode(e.target.value ? 'category' : 'all')
  }

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/api/low-stock/export/')
      const data = await response.json()
      
      // Download CSV file
      const blob = new Blob([data.csv_data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting low stock data:', error)
    }
  }

  const getUrgencyLevel = (item) => {
    if (item.min_threshold === 0) return 'notice'
    const percentage = (item.total_quantity / item.min_threshold) * 100
    if (percentage <= 25) return 'critical'
    if (percentage <= 50) return 'warning'
    return 'notice'
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'notice':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <FaExclamationCircle className="text-red-600" />
      case 'warning':
        return <FaExclamationTriangle className="text-orange-600" />
      case 'notice':
        return <FaInfoCircle className="text-yellow-600" />
      default:
        return <FaInfoCircle className="text-gray-600" />
    }
  }

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'Critical'
      case 'warning':
        return 'Warning'
      case 'notice':
        return 'Notice'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userType')
    navigate('/loginpage')
  }

  // Filter items by urgency
  const filteredItems = lowStockItems.filter(item => {
    if (urgencyFilter === 'all') return true
    return getUrgencyLevel(item) === urgencyFilter
  })

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Low Stock List" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Low Stock List</h1>
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
                  disabled={lowStockItems.length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary Section */}
            {showSummary && summaryData && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Low Stock Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">
                      {summaryData.summary.total_low_stock_items}
                    </div>
                    <div className="text-sm text-gray-600">Low Stock Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-red-600">
                      {summaryData.urgency_levels.critical}
                    </div>
                    <div className="text-sm text-gray-600">Critical Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-orange-600">
                      {summaryData.urgency_levels.warning}
                    </div>
                    <div className="text-sm text-gray-600">Warning Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">
                      {summaryData.urgency_levels.notice}
                    </div>
                    <div className="text-sm text-gray-600">Notice Items</div>
                  </div>
                </div>
                
                {/* Category Breakdown */}
                {summaryData.category_breakdown && Object.keys(summaryData.category_breakdown).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Category Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(summaryData.category_breakdown).map(([category, data]) => (
                        <div key={category} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{category}</div>
                          <div className="text-sm text-gray-600">
                            {data.count} items | {data.total_deficit} units deficit
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category Filter:</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Urgency Filter:</label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical (0-25%)</option>
                  <option value="warning">Warning (25-50%)</option>
                  <option value="notice">Notice (50-100%)</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                {viewMode === 'all' ? 'All Categories' : 'Category View'} - {filteredItems.length} items
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading low stock data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Threshold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deficit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Breakdown</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const urgency = getUrgencyLevel(item)
                      const deficit = item.min_threshold - item.total_quantity
                      return (
                        <tr key={item.item_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(urgency)}`}>
                              {getUrgencyIcon(urgency)}
                              <span className="ml-1">{getUrgencyText(urgency)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                            <div className="text-sm text-gray-500">ID: {item.item_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.item_code || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.unit || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.min_threshold}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-orange-600' : 'text-yellow-600'}`}>
                              {item.total_quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">{deficit}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {item.store_quantities.length > 0 ? (
                                <div className="space-y-1">
                                  {item.store_quantities.map((store, index) => (
                                    <div key={index} className="text-xs">
                                      <span className="font-medium">{store.store_name}:</span> {store.quantity}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500">No stock</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(item.last_updated)}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {filteredItems.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {lowStockItems.length === 0 ? 'No low stock items found' : 'No items match the selected filters'}
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

export default LowStock 