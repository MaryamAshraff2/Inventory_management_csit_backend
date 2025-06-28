import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FaChartBar, FaBoxOpen, FaTruck, FaClipboardList, FaTrashAlt, FaFilter, FaCalendarAlt, FaSyncAlt, FaFilePdf, FaFileExcel, FaUser, FaBox } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { reportsAPI, usersAPI, itemsAPI } from '../services/api';

const tabList = [
  { key: 'procurement', label: 'Procurement', icon: <FaBoxOpen /> },
  { key: 'stock_movement', label: 'Stock Movement', icon: <FaTruck /> },
  { key: 'inventory', label: 'Inventory', icon: <FaChartBar /> },
  { key: 'stock_requests', label: 'Stock Requests', icon: <FaClipboardList /> },
  { key: 'discarded_items', label: 'Discarded Items', icon: <FaTrashAlt /> },
];

function Reports() {
  const [activeTab, setActiveTab] = useState('procurement');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    item: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Load dropdown data on component mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const [usersData, itemsData] = await Promise.all([
        usersAPI.getAll(),
        itemsAPI.getAll()
      ]);
      setUsers(usersData);
      setItems(itemsData);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      setError('Failed to load filter options');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '', user: '', item: '' });
    setReportData(null);
    setError(null);
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );

      // Remove user filter for procurement reports since they don't support it
      if (activeTab === 'procurement' && cleanFilters.user) {
        delete cleanFilters.user;
      }

      switch (activeTab) {
        case 'procurement':
          response = await reportsAPI.generateProcurementReport(cleanFilters);
          break;
        case 'stock_movement':
          response = await reportsAPI.generateStockMovementReport(cleanFilters);
          break;
        case 'inventory':
          response = await reportsAPI.generateInventoryReport(cleanFilters);
          break;
        case 'stock_requests':
          response = await reportsAPI.generateStockRequestsReport(cleanFilters);
          break;
        case 'discarded_items':
          response = await reportsAPI.generateDiscardedItemsReport(cleanFilters);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(response);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!reportData?.report_id) {
      setError('No report data available for export');
      return;
    }

    try {
      setLoading(true);
      if (format === 'pdf') {
        const result = await reportsAPI.exportPdf(reportData.report_id);
        // Show success message
        setError(null);
        // You could add a success state here if needed
        console.log(`PDF exported successfully: ${result.filename}`);
      } else if (format === 'excel') {
        const result = await reportsAPI.exportExcel(reportData.report_id);
        // Show success message
        setError(null);
        console.log('Excel export initiated:', result.message);
      }
    } catch (err) {
      setError(`Failed to export ${format.toUpperCase()}: ${err.message}`);
      console.error(`Export error:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Reports & Analytics" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header Section */}
            <div className="mb-5">
              <div className="flex items-center mb-1">
                {/* <FaChartBar className="text-xl text-gray-700 mr-2" /> */}
                <h1 className="text-lg font-semibold">Generate and export comprehensive inventory reports</h1>
              </div>
            </div>

            

            {/* Tab Navigation Bar */}
            <div className="flex space-x-1 mb-6 bg-gray-50 rounded-md border border-gray-100 p-1 shadow-none w-full max-w-3xl">
              {tabList.map(tab => (
                <button
                  key={tab.key}
                  className={`flex items-center px-4 py-1.5 rounded-md font-normal text-sm transition focus:outline-none ${
                    activeTab === tab.key
                      ? 'bg-white border border-gray-200 text-gray-800 shadow-none'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className={`mr-2 text-base ${activeTab === tab.key ? 'text-blue-500' : 'text-gray-400'}`}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50 border border-gray-100 rounded-md p-4 mb-2 shadow-none">
              <div className="flex items-center mb-3">
                <FaFilter className="text-base text-gray-700 mr-2" />
                <span className="font-medium text-base text-gray-700">Filters</span>
              </div>
              <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0 mb-3">
                <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-md px-2 py-1.5">
                  <FaCalendarAlt className="text-gray-300 mr-2" />
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleInputChange}
                    className="w-full outline-none bg-transparent text-gray-700 text-sm"
                    placeholder="Start date"
                  />
                </div>
                <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-md px-2 py-1.5">
                  <FaCalendarAlt className="text-gray-300 mr-2" />
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                    className="w-full outline-none bg-transparent text-gray-700 text-sm"
                    placeholder="End date"
                  />
                </div>
                {activeTab !== 'procurement' && (
                  <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-md px-2 py-1.5">
                    <FaUser className="text-gray-300 mr-2" />
                    <select
                      name="user"
                      value={filters.user}
                  onChange={handleInputChange}
                      className="w-full outline-none bg-transparent text-gray-700 text-sm"
                      disabled={loadingDropdowns}
                    >
                      <option value="">
                        {loadingDropdowns ? 'Loading users...' : 'Select User'}
                      </option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-md px-2 py-1.5">
                  <FaBox className="text-gray-300 mr-2" />
                  <select
                    name="item"
                    value={filters.item}
                  onChange={handleInputChange}
                    className="w-full outline-none bg-transparent text-gray-700 text-sm"
                    disabled={loadingDropdowns}
                  >
                    <option value="">
                      {loadingDropdowns ? 'Loading items...' : 'Select Item'}
                    </option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button 
                  className="flex items-center bg-blue-500 text-white px-4 py-1.5 rounded-md font-medium shadow-none hover:bg-blue-600 transition text-sm" 
                  type="button" 
                  onClick={generateReport}
                  disabled={loading}
                >
                  <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
                  {loading ? 'Generating...' : 'Apply Filters'}
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-200 transition text-sm" type="button" onClick={handleReset}>
                  Reset
                </button>
                <button 
                  className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm" 
                  type="button" 
                  onClick={() => exportReport('pdf')}
                  disabled={!reportData}
                >
                  <FaFilePdf className="mr-2 text-red-400" /> Export PDF
                </button>
                <button 
                  className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm" 
                  type="button" 
                  onClick={() => exportReport('excel')}
                  disabled={!reportData}
                >
                  <FaFileExcel className="mr-2 text-green-500" /> Export Excel
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-blue-700 text-sm">Generating report...</p>
              </div>
            )}

            {/* Procurement Report Section (only for Procurement tab) */}
            {activeTab === 'procurement' && reportData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Procurement Report</h2>
                  <span className="text-sm text-gray-500">{reportData.total_records} items</span>
                </div>
                {reportData.total_amount && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-700 text-sm">
                      <strong>Total Amount:</strong> ${reportData.total_amount.toFixed(2)}
                    </p>
                </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="px-4 py-2 border-b">Order Number</th>
                        <th className="px-4 py-2 border-b">Item Name</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">Unit Price</th>
                        <th className="px-4 py-2 border-b">Total Amount</th>
                        <th className="px-4 py-2 border-b">Supplier</th>
                        <th className="px-4 py-2 border-b">Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{item.order_number}</td>
                            <td className="px-4 py-2 border-b">{item.item_name}</td>
                            <td className="px-4 py-2 border-b">{item.quantity}</td>
                            <td className="px-4 py-2 border-b">${item.unit_price}</td>
                            <td className="px-4 py-2 border-b">${item.total_amount}</td>
                            <td className="px-4 py-2 border-b">{item.supplier || 'N/A'}</td>
                            <td className="px-4 py-2 border-b">
                              {item.order_date ? new Date(item.order_date).toLocaleDateString() : 
                               new Date(item.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                            No procurement data found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stock Movement Report Section */}
            {activeTab === 'stock_movement' && reportData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Stock Movement Report</h2>
                  <span className="text-sm text-gray-500">{reportData.total_records} movements</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="px-4 py-2 border-b">Item Name</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">From Location</th>
                        <th className="px-4 py-2 border-b">To Location</th>
                        <th className="px-4 py-2 border-b">Movement Date</th>
                        <th className="px-4 py-2 border-b">Received By</th>
                        <th className="px-4 py-2 border-b">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{item.item_name}</td>
                            <td className="px-4 py-2 border-b">{item.quantity}</td>
                            <td className="px-4 py-2 border-b">{item.from_location}</td>
                            <td className="px-4 py-2 border-b">{item.to_location}</td>
                            <td className="px-4 py-2 border-b">{new Date(item.movement_date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 border-b">{item.received_by}</td>
                            <td className="px-4 py-2 border-b">{item.notes || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                            No stock movement data found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inventory Report Section */}
            {activeTab === 'inventory' && reportData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Inventory Report</h2>
                  <span className="text-sm text-gray-500">{reportData.total_items} items</span>
                </div>
                {reportData.total_value && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm">
                      <strong>Total Inventory Value:</strong> ${reportData.total_value.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="px-4 py-2 border-b">Item Name</th>
                        <th className="px-4 py-2 border-b">Category</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">Unit Price</th>
                        <th className="px-4 py-2 border-b">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{item.item_name}</td>
                            <td className="px-4 py-2 border-b">{item.category}</td>
                            <td className="px-4 py-2 border-b">{item.quantity}</td>
                            <td className="px-4 py-2 border-b">${item.unit_price}</td>
                            <td className="px-4 py-2 border-b">${item.total_value}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                            No inventory data found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stock Requests Report Section */}
            {activeTab === 'stock_requests' && reportData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Stock Requests Report</h2>
                  <span className="text-sm text-gray-500">{reportData.total_records} requests</span>
                </div>
                {(reportData.pending_requests || reportData.approved_requests || reportData.rejected_requests) && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reportData.pending_requests !== undefined && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-700 text-sm">
                          <strong>Pending:</strong> {reportData.pending_requests}
                        </p>
                      </div>
                    )}
                    {reportData.approved_requests !== undefined && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 text-sm">
                          <strong>Approved:</strong> {reportData.approved_requests}
                        </p>
                      </div>
                    )}
                    {reportData.rejected_requests !== undefined && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">
                          <strong>Rejected:</strong> {reportData.rejected_requests}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="px-4 py-2 border-b">Item Name</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">Status</th>
                        <th className="px-4 py-2 border-b">Requested By</th>
                        <th className="px-4 py-2 border-b">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{item.item_name}</td>
                            <td className="px-4 py-2 border-b">{item.quantity}</td>
                            <td className="px-4 py-2 border-b">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                item.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 border-b">{item.requested_by}</td>
                            <td className="px-4 py-2 border-b">{new Date(item.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                            No stock request data found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Discarded Items Report Section */}
            {activeTab === 'discarded_items' && reportData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2 md:mb-0">Discarded Items Report</h2>
                  <span className="text-sm text-gray-500">{reportData.total_records} items</span>
                </div>
                {reportData.total_quantity_discarded && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-orange-700 text-sm">
                      <strong>Total Quantity Discarded:</strong> {reportData.total_quantity_discarded}
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="px-4 py-2 border-b">Item Name</th>
                        <th className="px-4 py-2 border-b">Location</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">Reason</th>
                        <th className="px-4 py-2 border-b">Date</th>
                        <th className="px-4 py-2 border-b">Discarded By</th>
                        <th className="px-4 py-2 border-b">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 border-b">{item.item_name}</td>
                            <td className="px-4 py-2 border-b">{item.location}</td>
                            <td className="px-4 py-2 border-b">{item.quantity}</td>
                            <td className="px-4 py-2 border-b">
                              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                {item.reason}
                              </span>
                            </td>
                            <td className="px-4 py-2 border-b">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 border-b">{item.discarded_by}</td>
                            <td className="px-4 py-2 border-b">{item.notes || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                            No discarded items data found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default Reports;
