import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  FaInfoCircle, FaChartBar, FaClock, FaRegFileAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, 
  FaExclamationTriangle, FaShoppingCart, FaWaveSquare, FaFolderOpen, FaDollarSign, FaHistory, 
  FaChartLine, FaSearch, FaSyncAlt, FaUsers, FaBullseye, FaCalendarAlt
} from 'react-icons/fa';
import React, { useState } from 'react';

const informationalReports = [
  {
    title: 'Current Inventory Summary Report',
    description: 'Overview of all current stock levels',
    icon: <FaRegFileAlt className="text-blue-500 text-xl mr-3" />,
  },
  {
    title: 'Detailed Stock by Location Report',
    description: 'Stock breakdown by warehouse locations',
    icon: <FaMapMarkerAlt className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Dead Stock Report',
    description: 'Items with no movement over extended periods',
    icon: <FaExclamationTriangle className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Procurement History Report',
    description: 'Complete history of procurement activities',
    icon: <FaShoppingCart className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Stock Movement Log Report',
    description: 'Detailed log of all stock movements',
    icon: <FaWaveSquare className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Low Stock & Reorder Alert Report',
    description: 'Items approaching or below reorder levels',
    icon: <FaInfoCircle className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Category-Wise Inventory Report',
    description: 'Inventory breakdown by product categories',
    icon: <FaFolderOpen className="text-blue-400 text-xl mr-3" />,
  },
  {
    title: 'Expired/Damaged Stock Report',
    description: 'Items that are expired or marked as damaged',
    icon: <FaExclamationTriangle className="text-blue-400 text-xl mr-3" />,
  },
];

const managementReports = [
    {
      title: 'Inventory Valuation Report',
      description: 'Total value of current inventory assets',
      icon: <FaDollarSign className="text-green-500 text-xl mr-3" />,
    },
    {
      title: 'Stock Aging & Obsolescence Risk Report',
      description: 'Analysis of stock age and obsolescence risks',
      icon: <FaHistory className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Procurement Efficiency Report',
      description: 'Metrics on procurement process efficiency',
      icon: <FaChartLine className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Stockout & Overstock Analysis',
      description: 'Analysis of stockout and overstock situations',
      icon: <FaExclamationTriangle className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Dead Stock Root Cause Analysis',
      description: 'Identify root causes of dead stock issues',
      icon: <FaSearch className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Replenishment Recommendations Report',
      description: 'AI-driven recommendations for stock replenishment',
      icon: <FaSyncAlt className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Departmental Stock Usage Report',
      description: 'Stock consumption patterns by department',
      icon: <FaUsers className="text-green-400 text-xl mr-3" />,
    },
    {
      title: 'Forecast Accuracy Report',
      description: 'Analysis of inventory forecasting accuracy',
      icon: <FaBullseye className="text-green-400 text-xl mr-3" />,
    },
  ];

const timeBasedReports = [
    {
      title: 'Stock Movement Trends Report',
      description: 'Analyze inventory movement patterns over time',
      icon: <FaChartLine className="text-purple-500 text-xl mr-3" />,
    },
    {
      title: 'Procurement Spend Over Time',
      description: 'Track procurement spending trends across periods',
      icon: <FaDollarSign className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Dead Stock Accumulation Report',
      description: 'Monitor how dead stock accumulates over time',
      icon: <FaExclamationTriangle className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Inventory Turnover Report',
      description: 'Measure inventory turnover rates across time periods',
      icon: <FaSyncAlt className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Stockout History Report',
      description: 'Historical analysis of stockout incidents',
      icon: <FaHistory className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Seasonal Demand Forecast Report',
      description: 'Predict seasonal demand patterns based on historical data',
      icon: <FaCalendarAlt className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Inventory Audit Trail Report',
      description: 'Complete audit trail of inventory changes over time',
      icon: <FaRegFileAlt className="text-purple-400 text-xl mr-3" />,
    },
    {
      title: 'Cost Inflation Impact Report',
      description: 'Analyze the impact of cost inflation on inventory value',
      icon: <FaWaveSquare className="text-purple-400 text-xl mr-3" />,
    },
  ];

const sections = [
  {
    key: 'informational',
    title: 'Informational Reports',
    icon: <FaInfoCircle className="text-blue-500 text-2xl mr-2" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    content: null,
  },
  {
    key: 'management',
    title: 'Management Reports',
    icon: <FaChartBar className="text-green-500 text-2xl mr-2" />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    content: null,
  },
  {
    key: 'timebased',
    title: 'Time-based Reports',
    icon: <FaClock className="text-purple-500 text-2xl mr-2" />,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    content: null,
  },
];

function Reports() {
  const [expanded, setExpanded] = useState('informational');

  const handleReportClick = (report) => {
    console.log(`Clicked: ${report.title}`);
  };

  sections[0].content = (
    <>
      <div className="text-blue-700 text-base mb-4 ml-1">Click on any report below to generate it:</div>
      <div className="flex flex-col gap-4">
        {informationalReports.map((report) => (
          <button
            key={report.title}
            className="w-full text-left bg-white hover:bg-blue-100 border border-blue-100 rounded-lg px-6 py-4 flex items-center shadow-sm transition group focus:outline-none"
            onClick={() => handleReportClick(report)}
            tabIndex={0}
          >
            {report.icon}
            <div>
              <div className="font-semibold text-blue-900 text-lg group-hover:underline">{report.title}</div>
              <div className="text-blue-500 text-sm mt-0.5">{report.description}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  sections[1].content = (
    <>
      <div className="text-green-700 text-base mb-4 ml-1">Click on any report below to generate it:</div>
      <div className="flex flex-col gap-4">
        {managementReports.map((report) => (
          <button
            key={report.title}
            className="w-full text-left bg-white hover:bg-green-100 border border-green-100 rounded-lg px-6 py-4 flex items-center shadow-sm transition group focus:outline-none"
            onClick={() => handleReportClick(report)}
            tabIndex={0}
          >
            {report.icon}
            <div>
              <div className="font-semibold text-green-900 text-lg group-hover:underline">{report.title}</div>
              <div className="text-green-500 text-sm mt-0.5">{report.description}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  sections[2].content = (
    <>
      <div className="text-purple-700 text-base mb-4 ml-1">Click on any report below to generate it:</div>
      <div className="flex flex-col gap-4">
        {timeBasedReports.map((report) => (
          <button
            key={report.title}
            className="w-full text-left bg-white hover:bg-purple-100 border border-purple-100 rounded-lg px-6 py-4 flex items-center shadow-sm transition group focus:outline-none"
            onClick={() => handleReportClick(report)}
            tabIndex={0}
          >
            {report.icon}
            <div>
              <div className="font-semibold text-purple-900 text-lg group-hover:underline">{report.title}</div>
              <div className="text-purple-500 text-sm mt-0.5">{report.description}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Reports & Analytics" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center mb-2">
              <FaRegFileAlt className="text-3xl text-black mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            </div>
            <div className="text-gray-500 text-lg mb-8 ml-1">Generate comprehensive inventory reports and analytics</div>

            <div className="space-y-8">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className={`${section.bg} ${section.border} border rounded-xl p-6 md:p-8 mb-2 transition-shadow duration-200 ${expanded === section.key ? 'shadow-md' : 'shadow-sm'}`}
                >
                  <div
                    className={`flex items-center mb-4 cursor-pointer select-none`}
                    onClick={() => setExpanded(section.key)}
                  >
                    {section.icon}
                    <span className={`text-2xl font-semibold ${section.text}`}>{section.title}</span>
                    <span className="ml-auto">
                      {expanded === section.key ? (
                        <FaChevronUp className="text-gray-400 text-xl" />
                      ) : (
                        <FaChevronDown className="text-gray-400 text-xl" />
                      )}
                    </span>
                  </div>
                  {expanded === section.key && (
                    <div className="mt-2">
                      {section.content ? (
                        section.content
                      ) : (
                        <div className="min-h-[80px] border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 text-lg bg-white/30">
                          Report components will be added here
                  </div>
                      )}
              </div>
            )}
                </div>
              ))}
              </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Reports;
