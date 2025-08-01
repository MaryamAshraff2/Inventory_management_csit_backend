import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaWarehouse, FaBoxes, FaFilter, FaDownload, FaEye, FaChartBar } from 'react-icons/fa'

const StockInHand = () => {
  const navigate = useNavigate()
  const [stockData, setStockData] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState('')
  const [showZeroStock, setShowZeroStock] = useState(false)
  const [viewMode, setViewMode] = useState('full') // 'full' or 'store'
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchLocations()
    fetchStockData()
    fetchSummaryData()
  }, [navigate])

  useEffect(() => {
    fetchStockData()
  }, [selectedStore, showZeroStock])

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/locations/')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchStockData = async () => {
    setLoading(true)
    try {
      let url = 'http://localhost:8000/inventory/api/stock-in-hand/'
      const params = new URLSearchParams()
      
      if (selectedStore) {
        params.append('store', selectedStore)
      }
      
      if (!showZeroStock) {
        params.append('show_zero_stock', 'false')
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStockData(data)
    } catch (error) {
      console.error('Error fetching stock data:', error)
      setStockData([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryData = async () => {
    try {
      let url = 'http://localhost:8000/inventory/api/stock-in-hand/summary/'
      const params = new URLSearchParams()
      
      if (selectedStore) {
        params.append('store', selectedStore)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSummaryData(data)
    } catch (error) {
      console.error('Error fetching summary data:', error)
      setSummaryData(null) // Set null on error
    }
  }

  const handleStoreChange = (e) => {
    setSelectedStore(e.target.value)
    setViewMode(e.target.value ? 'store' : 'full')
  }

  const handleExport = () => {
    // Create CSV data
    let csvContent = ''
    
    if (viewMode === 'full') {
      csvContent = 'Item ID,Item Name,Item Code,Unit,Category,Total Quantity,Stores\n'
      stockData.forEach(item => {
        const stores = item.store_quantities.map(sq => `${sq.store_name}: ${sq.quantity}`).join('; ')
        csvContent += `${item.item_id},"${item.item_name}","${item.item_code}","${item.unit}","${item.category}",${item.total_quantity},"${stores}"\n`
      })
    } else {
      csvContent = 'Item ID,Item Name,Item Code,Unit,Category,Quantity,Store,Last Updated\n'
      stockData.forEach(item => {
        csvContent += `${item.item_id},"${item.item_name}","${item.item_code}","${item.unit}","${item.category}",${item.quantity},"${item.store_name}","${item.last_updated}"\n`
      })
    }
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_in_hand_${selectedStore ? 'store_' + selectedStore : 'full'}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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

  const getStoreName = (storeId) => {
    const location = locations.find(loc => loc.id === parseInt(storeId))
    return location ? location.name : `Store #${storeId}`
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Stock in Hand" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Stock in Hand</h1>
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
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary Section */}
            {showSummary && summaryData && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">
                      {summaryData.total_items || summaryData.items_with_stock || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedStore ? 'Items in Store' : 'Total Items'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">
                      {summaryData.total_quantity || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Quantity</div>
                  </div>
                  {!selectedStore && summaryData.store_breakdown && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-purple-600">
                        {summaryData.store_breakdown.length}
                      </div>
                      <div className="text-sm text-gray-600">Stores</div>
                    </div>
                  )}
                  {selectedStore && summaryData.category_breakdown && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-orange-600">
                        {summaryData.category_breakdown.length}
                      </div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                  )}
                </div>
                
                {/* Store Breakdown */}
                {!selectedStore && summaryData.store_breakdown && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Store Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {summaryData.store_breakdown.map((store) => (
                        <div key={store.store_id} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{store.store_name}</div>
                          <div className="text-sm text-gray-600">
                            {store.total_quantity} units | {store.items_with_stock} items
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Category Breakdown */}
                {selectedStore && summaryData.category_breakdown && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Category Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {summaryData.category_breakdown.map((category, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow">
                          <div className="font-semibold text-gray-800">{category.item__category__name || 'Uncategorized'}</div>
                          <div className="text-sm text-gray-600">
                            {category.total_quantity} units | {category.item_count} items
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
                <label className="text-sm font-medium text-gray-700">Store Filter:</label>
                <select
                  value={selectedStore}
                  onChange={handleStoreChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stores (Full View)</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showZeroStock"
                  checked={showZeroStock}
                  onChange={(e) => setShowZeroStock(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showZeroStock" className="text-sm text-gray-700">
                  Show items with zero stock
                </label>
              </div>
              
              <div className="text-sm text-gray-600">
                {viewMode === 'full' ? 'Full View' : 'Store View'} - {stockData.length} items
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading stock data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      {viewMode === 'full' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Breakdown</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockData.map((item) => (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
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
                        {viewMode === 'full' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.total_quantity}</div>
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
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.store_name}</div>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(item.last_updated)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {stockData.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Data Available</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedStore 
                        ? `No stock items found in the selected store. Try selecting a different store or check if items have been added to inventory.`
                        : 'No stock data is currently available. This could be because no items have been added to inventory yet, or there are no stock movements recorded.'
                      }
                    </p>
                    <div className="text-sm text-gray-400">
                      <p>• Check if items have been added to the system</p>
                      <p>• Verify that stock movements have been recorded</p>
                      <p>• Try adjusting your filters</p>
                    </div>
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

export default StockInHand 