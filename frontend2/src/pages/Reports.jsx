import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { FaChartBar, FaBoxOpen, FaTruck, FaClipboardList, FaTrashAlt, FaFilter, FaCalendarAlt, FaSyncAlt, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { useState } from 'react';

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
    supplier: '',
    category: '',
    procurementType: '',
  });

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '', supplier: '', category: '', procurementType: '' });
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
                <input
                  type="text"
                  name="supplier"
                  value={filters.supplier}
                  onChange={handleInputChange}
                  className="flex-1 bg-white border border-gray-100 rounded-md px-2 py-1.5 text-gray-700 text-sm placeholder-gray-400"
                  placeholder="Filter by supplier"
                />
                <input
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleInputChange}
                  className="flex-1 bg-white border border-gray-100 rounded-md px-2 py-1.5 text-gray-700 text-sm placeholder-gray-400"
                  placeholder="Filter by category"
                />
                <input
                  type="text"
                  name="procurementType"
                  value={filters.procurementType}
                  onChange={handleInputChange}
                  className="flex-1 bg-white border border-gray-100 rounded-md px-2 py-1.5 text-gray-700 text-sm placeholder-gray-400"
                  placeholder="Filter by procurement type"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button className="flex items-center bg-blue-500 text-white px-4 py-1.5 rounded-md font-medium shadow-none hover:bg-blue-600 transition text-sm" type="button">
                  <FaSyncAlt className="mr-2" /> Apply Filters
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-200 transition text-sm" type="button" onClick={handleReset}>
                  Reset
                </button>
                <button className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm" type="button">
                  <FaFilePdf className="mr-2 text-red-400" /> Export PDF
                </button>
                <button className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm" type="button">
                  <FaFileExcel className="mr-2 text-green-500" /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Reports;
