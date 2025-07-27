import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaUpload, FaTrash, FaDownload, FaPlus, FaMinus } from 'react-icons/fa'

const DeliveryNote = () => {
  const navigate = useNavigate()
  const [deliveryNotes, setDeliveryNotes] = useState([])
  const [procurements, setProcurements] = useState([])
  const [transferOrders, setTransferOrders] = useState([])
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedOrderType, setSelectedOrderType] = useState('procurement')
  
  // Form states
  const [formData, setFormData] = useState({
    order_type: 'procurement',
    order_id: '',
    delivery_type: 'full',
    delivery_date: '',
    document: null,
    delivered_items: [{ item_id: '', lot_number: '', quantity: 1 }],
    notes: '',
    uploaded_by: ''
  })

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchDeliveryNotes()
    fetchProcurements()
    fetchTransferOrders()
    fetchItems()
    fetchUsers()
  }, [navigate])

  const fetchDeliveryNotes = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/delivery-notes/')
      const data = await response.json()
      setDeliveryNotes(data)
    } catch (error) {
      console.error('Error fetching delivery notes:', error)
    } finally {
      setLoading(false)
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

  const fetchTransferOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/sendingstockrequests/')
      const data = await response.json()
      setTransferOrders(data)
    } catch (error) {
      console.error('Error fetching transfer orders:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/items/')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
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

  const handleOrderTypeChange = (e) => {
    setSelectedOrderType(e.target.value)
    setFormData({ ...formData, order_type: e.target.value, order_id: '' })
  }

  const addDeliveredItem = () => {
    setFormData({
      ...formData,
      delivered_items: [...formData.delivered_items, { item_id: '', lot_number: '', quantity: 1 }]
    })
  }

  const removeDeliveredItem = (index) => {
    if (formData.delivered_items.length > 1) {
      const newItems = formData.delivered_items.filter((_, i) => i !== index)
      setFormData({ ...formData, delivered_items: newItems })
    }
  }

  const updateDeliveredItem = (index, field, value) => {
    const newItems = [...formData.delivered_items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, delivered_items: newItems })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!formData.document) {
      alert('Please select a document to upload')
      return
    }

    // Validate delivered items
    for (let i = 0; i < formData.delivered_items.length; i++) {
      const item = formData.delivered_items[i]
      if (!item.item_id || !item.lot_number || !item.quantity) {
        alert(`Please fill all fields for delivered item ${i + 1}`)
        return
      }
      if (item.quantity <= 0) {
        alert(`Quantity must be greater than 0 for delivered item ${i + 1}`)
        return
      }
    }

    try {
      const uploadData = new FormData()
      uploadData.append('order_type', formData.order_type)
      uploadData.append('order_id', formData.order_id)
      uploadData.append('delivery_type', formData.delivery_type)
      uploadData.append('delivery_date', formData.delivery_date)
      uploadData.append('document', formData.document)
      uploadData.append('delivered_items', JSON.stringify(formData.delivered_items))
      uploadData.append('notes', formData.notes)
      uploadData.append('uploaded_by', formData.uploaded_by)

      const response = await fetch('http://localhost:8000/inventory/api/delivery-note/', {
        method: 'POST',
        body: uploadData,
      })

      if (response.ok) {
        const result = await response.json()
        alert('Delivery note uploaded successfully!')
        setShowUploadModal(false)
        setFormData({
          order_type: 'procurement',
          order_id: '',
          delivery_type: 'full',
          delivery_date: '',
          document: null,
          delivered_items: [{ item_id: '', lot_number: '', quantity: 1 }],
          notes: '',
          uploaded_by: ''
        })
        fetchDeliveryNotes()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to upload delivery note'}`)
      }
    } catch (error) {
      console.error('Error uploading delivery note:', error)
      alert('Error uploading delivery note')
    }
  }

  const handleDelete = async (deliveryNoteId) => {
    if (!window.confirm('Are you sure you want to delete this delivery note?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/inventory/api/delivery-note/${deliveryNoteId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Delivery note deleted successfully!')
        fetchDeliveryNotes()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete delivery note'}`)
      }
    } catch (error) {
      console.error('Error deleting delivery note:', error)
      alert('Error deleting delivery note')
    }
  }

  const handleDownload = (documentUrl) => {
    if (documentUrl) {
      window.open(`http://localhost:8000${documentUrl}`, '_blank')
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

  const getOrderDisplayName = (orderType, orderId) => {
    if (orderType === 'procurement') {
      const procurement = procurements.find(p => p.id === orderId)
      return procurement ? `${procurement.order_number} - ${procurement.supplier || 'No Supplier'}` : `Procurement #${orderId}`
    } else {
      const transfer = transferOrders.find(t => t.id === orderId)
      return transfer ? `Transfer #${transfer.id} - ${transfer.requested_by?.name || 'Unknown'}` : `Transfer #${orderId}`
    }
  }

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.name : `Item #${itemId}`
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Delivery Note Management" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Delivery Note Management</h1>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
              >
                <FaUpload className="mr-2" />
                Upload Delivery Note
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading delivery notes...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getOrderDisplayName(note.order_type, note.order_id)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">{note.order_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            note.delivery_type === 'full' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {note.delivery_type === 'full' ? 'Full' : 'Partial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{note.delivery_date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {note.uploaded_by?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(note.uploaded_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {note.delivered_items?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {note.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownload(note.document)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Download Document"
                          >
                            <FaDownload className="inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Delivery Note"
                          >
                            <FaTrash className="inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {deliveryNotes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No delivery notes found
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
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Delivery Note</h3>
              <form onSubmit={handleUpload}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <select
                      value={formData.order_type}
                      onChange={handleOrderTypeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="procurement">Procurement</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={formData.order_id}
                      onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select {selectedOrderType === 'procurement' ? 'Procurement' : 'Transfer'}</option>
                      {selectedOrderType === 'procurement' 
                        ? procurements.map((procurement) => (
                            <option key={procurement.id} value={procurement.id}>
                              {procurement.order_number} - {procurement.supplier || 'No Supplier'}
                            </option>
                          ))
                        : transferOrders.map((transfer) => (
                            <option key={transfer.id} value={transfer.id}>
                              Transfer #{transfer.id} - {transfer.requested_by?.name || 'Unknown'}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
                    <select
                      value={formData.delivery_type}
                      onChange={(e) => setFormData({...formData, delivery_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="full">Full Delivery</option>
                      <option value="partial">Partial Delivery</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivered Items</label>
                  {formData.delivered_items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <select
                        value={item.item_id}
                        onChange={(e) => updateDeliveredItem(index, 'item_id', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Item</option>
                        {items.map((itemOption) => (
                          <option key={itemOption.id} value={itemOption.id}>{itemOption.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.lot_number}
                        onChange={(e) => updateDeliveredItem(index, 'lot_number', e.target.value)}
                        placeholder="Lot Number"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateDeliveredItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Quantity"
                        min="1"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeDeliveredItem(index)}
                        className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                        disabled={formData.delivered_items.length === 1}
                      >
                        <FaMinus className="inline" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDeliveredItem}
                    className="mt-2 px-3 py-1 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 text-sm"
                  >
                    <FaPlus className="inline mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional notes about the delivery..."
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
    </>
  )
}

export default DeliveryNote 