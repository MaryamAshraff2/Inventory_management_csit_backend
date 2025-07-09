import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { FiSearch, FiGrid, FiClock } from 'react-icons/fi';
import { auditLogsAPI } from '../services/api';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

const AuditLogs = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actions, setActions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // Fetch filter options on mount
  useEffect(() => {
    auditLogsAPI.getActions().then(setActions);
    auditLogsAPI.getEntities().then(setEntities);
    auditLogsAPI.getUsers().then(setUsers);
  }, []);

  // Fetch logs when filters/search change
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search) params.search = search;
        if (selectedAction) params.action = selectedAction;
        if (selectedEntity) params.entity_type = selectedEntity;
        if (selectedUser) params.performed_by = selectedUser;
        const data = await auditLogsAPI.getAll(params);
        setLogs(data);
      } catch (err) {
        setError('Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [search, selectedAction, selectedEntity, selectedUser]);

  // Remove the handleExportCSV function and the Export CSV button from the Audit Log page UI
  const handleExportPDF = () => {
    const params = {};
    if (search) params.search = search;
    if (selectedAction) params.action = selectedAction;
    if (selectedEntity) params.entity_type = selectedEntity;
    if (selectedUser) params.performed_by = selectedUser;
    auditLogsAPI.exportPDF(params);
  };
  const handleExportExcel = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedAction) params.action = selectedAction;
      if (selectedEntity) params.entity_type = selectedEntity;
      if (selectedUser) params.performed_by = selectedUser;

      const response = await auditLogsAPI.exportExcel(params);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit_logs.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export failed", error);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Audit Logs" />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manage and review audit logs</h3>
              <div className="flex gap-2">
                <button
                  className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm shadow-sm"
                  onClick={handleExportPDF}
                  type="button"
                >
                  <FaFilePdf className="mr-2 text-red-400" /> Export PDF
                </button>
                <button
                  className="flex items-center bg-white text-gray-700 px-4 py-1.5 rounded-md font-medium border border-gray-200 hover:bg-gray-100 transition text-sm shadow-sm"
                  onClick={handleExportExcel}
                  type="button"
                >
                  <FaFileExcel className="mr-2 text-green-500" /> Export Excel
                </button>
              </div>
            </div>
            {/* Tabs Toggle */}
            <div className="px-4 sm:px-6 border-b border-gray-200" style={{background: 'transparent'}}>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === 'table'
                      ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiGrid className="h-4 w-4" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center space-x-2 ${
                    activeTab === 'timeline'
                      ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiClock className="h-4 w-4" />
                  <span>Timeline View</span>
                </button>
              </div>
            </div>
            {/* Search and Filters */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex flex-row gap-3 w-full">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none border border-gray-300 rounded-md"
                      placeholder="Search actions, users, or details..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border border-gray-300 rounded-md" value={selectedAction} onChange={e => setSelectedAction(e.target.value)}>
                    <option value="">All Actions</option>
                    {actions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                  <select className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border border-gray-300 rounded-md" value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)}>
                    <option value="">All Entities</option>
                    {entities.map(entity => (
                      <option key={entity} value={entity}>{entity}</option>
                    ))}
                  </select>
                  <select className="bg-gray-100 px-3 py-2 text-sm focus:outline-none border border-gray-300 rounded-md" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Table View */}
            {activeTab === 'table' && (
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading...</div>
                ) : error ? (
                  <div className="py-8 text-center text-red-500">{error}</div>
                ) : (
                  <table className="min-w-full bg-white rounded-lg shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entity Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performed By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.action.toLowerCase().includes('created') || log.action.toLowerCase().includes('added') ? 'bg-green-50 text-green-700 border border-green-200' : log.action.toLowerCase().includes('updated') ? 'bg-blue-50 text-blue-700 border border-blue-200' : log.action.toLowerCase().includes('deleted') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{log.action}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.entity_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.performed_by ? log.performed_by.name : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {/* Timeline View */}
            {activeTab === 'timeline' && (
              <div className="space-y-4 p-4">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading...</div>
                ) : error ? (
                  <div className="py-8 text-center text-red-500">{error}</div>
                ) : (
                  logs
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(log => (
                      <div key={log.id} className={`border-l-4 pl-4 py-2 ${log.action.toLowerCase().includes('deleted') ? 'border-red-400 bg-red-50' : log.action.toLowerCase().includes('updated') ? 'border-blue-400 bg-blue-50' : 'border-green-400 bg-green-50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{log.action}</span> <span className="text-gray-500">({log.entity_type})</span>
                            <span className="ml-2 text-sm text-gray-400">by {log.performed_by ? log.performed_by.name : ''}</span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-gray-700 mt-1">{log.details}</div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AuditLogs; 