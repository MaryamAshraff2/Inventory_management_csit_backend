import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaTimesCircle, FaDownload, FaChartBar, FaFilter, FaBoxes, FaExclamationTriangle } from 'react-icons/fa'

const OutOfStock = () => {
  const navigate = useNavigate()
  const [outOfStockItems, setOutOfStockItems] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [viewMode, setViewMode] = useState('all') // 'all', 'category', 'store'

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchCategories()
    fetchStores()
    fetchOutOfStockData()
    fetchSummaryData()
  }, [navigate])

  useEffect(() => {
    fetchOutOfStockData()
  }, [selectedCategory, selectedStore])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/categories/')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/locations/')
      const data = await response.json()
      setStores(data)
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchOutOfStockData = async () => {
    setLoading(true)
    try {
      let url = 'http://localhost:8000/inventory/api/out-of-stock/'
      const params = new URLSearchParams()
      
      if (selectedCategory) {
        url = 'http://localhost:8000/inventory/api/out-of-stock/by-category/'
        params.append('category', selectedCategory)
      } else if (selectedStore) {
        url = 'http://localhost:8000/inventory/api/out-of-stock/by-store/'
        params.append('store', selectedStore)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (selectedCategory || selectedStore) {
        // Data is grouped by category/store, flatten it
        const flattenedData = []
        Object.values(data).forEach(groupItems => {
          flattenedData.push(...groupItems)
        })
        setOutOfStockItems(flattenedData)
      } else {
        setOutOfStockItems(data)
      }
    } catch (error) {
      console.error('Error fetching out of stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/api/out-of-stock/summary/')
      const data = await response.json()
      setSummaryData(data)
    } catch (error) {
      console.error('Error fetching summary data:', error)
    }
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setSelectedStore('')
    setViewMode(e.target.value ? 'category' : 'all')
  }

  const handleStoreChange = (e) => {
    setSelectedStore(e.target.value)
    setSelectedCategory('')
    setViewMode(e.target.value ? 'store' : 'all')
  }

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/api/out-of-stock/export/')
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
      console.error('Error exporting out of stock data:', error)
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

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Out of Stock List" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Out of Stock List</h1>
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
                  disabled={outOfStockItems.length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary Section */}
            {showSummary && summaryData && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <h2 className="text-xl font-semibold text-red-800 mb-4">Out of Stock Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-red-600">
                      {summaryData.summary.total_out_of_stock_items}
                    </div>
                    <div className="text-sm text-gray-600">Out of Stock Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">
                      {summaryData.summary.total_items}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-orange-600">
                      {summaryData.summary.percentage_out_of_stock.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Percentage Out of Stock</div>
                  </div>
                </div>
                
                {/* Category Breakdown */}
                {summaryData.category_breakdown && Object.keys(summaryData.category_breakdown).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Category Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(summaryData.category_breakdown).map(([category, data]) => (
                        <div key={category} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{category}</div>
                          <div className="text-sm text-gray-600">
                            {data.count} items out of stock
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Store Breakdown */}
                {summaryData.store_breakdown && Object.keys(summaryData.store_breakdown).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Store Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(summaryData.store_breakdown).map(([store, data]) => (
                        <div key={store} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{store}</div>
                          <div className="text-sm text-gray-600">
                            {data.count} items out of stock
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
                <label className="text-sm font-medium text-gray-700">Store Filter:</label>
                <select
                  value={selectedStore}
                  onChange={handleStoreChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                {viewMode === 'all' ? 'All Items' : viewMode === 'category' ? 'Category View' : 'Store View'} - {outOfStockItems.length} items
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">Loading out of stock data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Breakdown</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outOfStockItems.map((item) => (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <FaTimesCircle className="mr-1" />
                            Out of Stock
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
                          <div className="text-sm text-gray-900">{item.category || 'Uncategorized'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.unit || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">{item.total_quantity}</div>
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
                              <span className="text-gray-500">No stores</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(item.last_updated)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {outOfStockItems.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {selectedCategory || selectedStore ? 'No out of stock items found for the selected filter' : 'No out of stock items found'}
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

export default OutOfStock 