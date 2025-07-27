import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaUpload, FaTrash, FaDownload, FaEye, FaEdit, FaPlus } from 'react-icons/fa'

const ContractSchedule = () => {
  const navigate = useNavigate()
  const [contractSchedules, setContractSchedules] = useState([])
  const [procurements, setProcurements] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAmendmentModal, setShowAmendmentModal] = useState(false)
  const [selectedProcurement, setSelectedProcurement] = useState('')
  const [selectedContractSchedule, setSelectedContractSchedule] = useState(null)
  const [amendmentOrders, setAmendmentOrders] = useState([])
  
  // Form states
  const [formData, setFormData] = useState({
    procurement: '',
    title: '',
    document: null,
    notes: '',
    uploaded_by: ''
  })

  // Amendment form states
  const [amendmentFormData, setAmendmentFormData] = useState({
    title: '',
    document: null,
    reason: '',
    notes: '',
    amendment_date: '',
    uploaded_by: ''
  })

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchContractSchedules()
    fetchProcurements()
    fetchUsers()
  }, [navigate])

  const fetchContractSchedules = async () => {
    try {
      const url = selectedProcurement 
        ? `http://localhost:8000/inventory/contract-schedules/?procurement_id=${selectedProcurement}`
        : 'http://localhost:8000/inventory/contract-schedules/'
      
      const response = await fetch(url)
      const data = await response.json()
      setContractSchedules(data)
    } catch (error) {
      console.error('Error fetching contract schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAmendmentOrders = async (contractScheduleId) => {
    try {
      const response = await fetch(`http://localhost:8000/inventory/amendment-orders/?contract_schedule_id=${contractScheduleId}`)
      const data = await response.json()
      setAmendmentOrders(data)
    } catch (error) {
      console.error('Error fetching amendment orders:', error)
    }
  }

  const fetchProcurements = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/procurements/')
      const data = await response.json()
      setProcurements(data)
    } catch (error) {
      console.error('Error fetching procurements:', error)
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

  const handleFileChange = (e) => {
    setFormData({ ...formData, document: e.target.files[0] })
  }

  const handleAmendmentFileChange = (e) => {
    setAmendmentFormData({ ...amendmentFormData, document: e.target.files[0] })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!formData.document) {
      alert('Please select a document to upload')
      return
    }

    try {
      const uploadData = new FormData()
      uploadData.append('procurement', formData.procurement)
      uploadData.append('title', formData.title)
      uploadData.append('document', formData.document)
      uploadData.append('notes', formData.notes)
      uploadData.append('uploaded_by', formData.uploaded_by)

      const response = await fetch('http://localhost:8000/inventory/api/contract-schedule/', {
        method: 'POST',
        body: uploadData,
      })

      if (response.ok) {
        const result = await response.json()
        alert('Contract schedule uploaded successfully!')
        setShowUploadModal(false)
        setFormData({
          procurement: '',
          title: '',
          document: null,
          notes: '',
          uploaded_by: ''
        })
        fetchContractSchedules()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to upload contract schedule'}`)
      }
    } catch (error) {
      console.error('Error uploading contract schedule:', error)
      alert('Error uploading contract schedule')
    }
  }

  const handleAmendmentUpload = async (e) => {
    e.preventDefault()
    
    if (!amendmentFormData.document) {
      alert('Please select a document to upload')
      return
    }

    try {
      const uploadData = new FormData()
      uploadData.append('title', amendmentFormData.title)
      uploadData.append('document', amendmentFormData.document)
      uploadData.append('reason', amendmentFormData.reason)
      uploadData.append('notes', amendmentFormData.notes)
      uploadData.append('amendment_date', amendmentFormData.amendment_date)
      uploadData.append('uploaded_by', amendmentFormData.uploaded_by)

      const response = await fetch(`http://localhost:8000/inventory/api/contract-schedule/${selectedContractSchedule.id}/amendment/`, {
        method: 'POST',
        body: uploadData,
      })

      if (response.ok) {
        const result = await response.json()
        alert('Amendment order uploaded successfully!')
        setShowAmendmentModal(false)
        setAmendmentFormData({
          title: '',
          document: null,
          reason: '',
          notes: '',
          amendment_date: '',
          uploaded_by: ''
        })
        fetchAmendmentOrders(selectedContractSchedule.id)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to upload amendment order'}`)
      }
    } catch (error) {
      console.error('Error uploading amendment order:', error)
      alert('Error uploading amendment order')
    }
  }

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this contract schedule?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/inventory/api/contract-schedule/${scheduleId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Contract schedule deleted successfully!')
        fetchContractSchedules()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete contract schedule'}`)
      }
    } catch (error) {
      console.error('Error deleting contract schedule:', error)
      alert('Error deleting contract schedule')
    }
  }

  const handleAmendmentDelete = async (amendmentId) => {
    if (!window.confirm('Are you sure you want to delete this amendment order?')) {
      return
    }

    try {
      const response = await fetch('http://localhost:8000/inventory/api/contract-schedule/amendment/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amendment_id: amendmentId }),
      })

      if (response.ok) {
        alert('Amendment order deleted successfully!')
        fetchAmendmentOrders(selectedContractSchedule.id)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete amendment order'}`)
      }
    } catch (error) {
      console.error('Error deleting amendment order:', error)
      alert('Error deleting amendment order')
    }
  }

  const handleDownload = (documentUrl) => {
    if (documentUrl) {
      window.open(`http://localhost:8000${documentUrl}`, '_blank')
    }
  }

  const handleViewAmendments = (contractSchedule) => {
    setSelectedContractSchedule(contractSchedule)
    fetchAmendmentOrders(contractSchedule.id)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userType')
    navigate('/loginpage')
  }

  const handleProcurementFilter = (e) => {
    setSelectedProcurement(e.target.value)
  }

  useEffect(() => {
    fetchContractSchedules()
  }, [selectedProcurement])

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Contract Schedule Management" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Contract Schedule Management</h1>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
              >
                <FaUpload className="mr-2" />
                Upload Contract Schedule
              </button>
            </div>

            {/* Filter by Procurement */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Procurement</label>
              <select
                value={selectedProcurement}
                onChange={handleProcurementFilter}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Procurements</option>
                {procurements.map((procurement) => (
                  <option key={procurement.id} value={procurement.id}>
                    {procurement.order_number} - {procurement.supplier || 'No Supplier'}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading contract schedules...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procurement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contractSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{schedule.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {schedule.procurement?.order_number || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {schedule.uploaded_by?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(schedule.uploaded_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {schedule.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownload(schedule.document)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Download Document"
                          >
                            <FaDownload className="inline" />
                          </button>
                          <button
                            onClick={() => handleViewAmendments(schedule)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="View Amendments"
                          >
                            <FaEdit className="inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Contract Schedule"
                          >
                            <FaTrash className="inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {contractSchedules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No contract schedules found
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Contract Schedule</h3>
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procurement</label>
                  <select
                    value={formData.procurement}
                    onChange={(e) => setFormData({...formData, procurement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Procurement</option>
                    {procurements.map((procurement) => (
                      <option key={procurement.id} value={procurement.id}>
                        {procurement.order_number} - {procurement.supplier || 'No Supplier'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g., Schedule A"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional notes about the contract schedule..."
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded By</label>
                  <select
                    value={formData.uploaded_by}
                    onChange={(e) => setFormData({...formData, uploaded_by: e.target.value})}
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
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Amendment Orders Modal */}
      {selectedContractSchedule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Amendment Orders - {selectedContractSchedule.title}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAmendmentModal(true)}
                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 flex items-center text-sm"
                  >
                    <FaPlus className="mr-1" />
                    Add Amendment
                  </button>
                  <button
                    onClick={() => setSelectedContractSchedule(null)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amendment Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {amendmentOrders.map((amendment) => (
                      <tr key={amendment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{amendment.title}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{amendment.reason}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{amendment.amendment_date}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {amendment.uploaded_by?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {amendment.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownload(amendment.document)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            title="Download Document"
                          >
                            <FaDownload className="inline" />
                          </button>
                          <button
                            onClick={() => handleAmendmentDelete(amendment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Amendment"
                          >
                            <FaTrash className="inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {amendmentOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No amendment orders found for this contract schedule
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amendment Upload Modal */}
      {showAmendmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Amendment Order</h3>
              <form onSubmit={handleAmendmentUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={amendmentFormData.title}
                    onChange={(e) => setAmendmentFormData({...amendmentFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g., Amendment #2"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  <input
                    type="file"
                    onChange={handleAmendmentFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={amendmentFormData.reason}
                    onChange={(e) => setAmendmentFormData({...amendmentFormData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g., Change in scope due to funding"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amendment Date</label>
                  <input
                    type="date"
                    value={amendmentFormData.amendment_date}
                    onChange={(e) => setAmendmentFormData({...amendmentFormData, amendment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={amendmentFormData.notes}
                    onChange={(e) => setAmendmentFormData({...amendmentFormData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="e.g., Increase in total budget by 20%"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded By</label>
                  <select
                    value={amendmentFormData.uploaded_by}
                    onChange={(e) => setAmendmentFormData({...amendmentFormData, uploaded_by: e.target.value})}
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
                    onClick={() => setShowAmendmentModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Upload Amendment
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

export default ContractSchedule 