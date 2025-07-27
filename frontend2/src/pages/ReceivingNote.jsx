import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FaPlus, FaTrash, FaEye, FaCheck } from 'react-icons/fa'

const ReceivingNote = () => {
  const navigate = useNavigate()
  const [receivingNotes, setReceivingNotes] = useState([])
  const [deliveryNotes, setDeliveryNotes] = useState([])
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null)
  const [deliveryNoteItems, setDeliveryNoteItems] = useState([])
  
  // Form states
  const [formData, setFormData] = useState({
    delivery_note: '',
    receiving_type: 'full',
    receiving_date: '',
    received_items: [],
    received_by: '',
    notes: '',
    uploaded_by: ''
  })

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
    if (!isLoggedIn) {
      navigate('/loginpage')
      return
    }
    
    fetchReceivingNotes()
    fetchDeliveryNotes()
    fetchItems()
    fetchUsers()
  }, [navigate])

  const fetchReceivingNotes = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/receiving-notes/')
      const data = await response.json()
      setReceivingNotes(data)
    } catch (error) {
      console.error('Error fetching receiving notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryNotes = async () => {
    try {
      const response = await fetch('http://localhost:8000/inventory/delivery-notes/')
      const data = await response.json()
      setDeliveryNotes(data)
    } catch (error) {
      console.error('Error fetching delivery notes:', error)
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

  const fetchDeliveryNoteItems = async (deliveryNoteId) => {
    try {
      const response = await fetch(`http://localhost:8000/inventory/delivery-notes/${deliveryNoteId}/`)
      const data = await response.json()
      setDeliveryNoteItems(data.delivered_items || [])
    } catch (error) {
      console.error('Error fetching delivery note items:', error)
    }
  }

  const handleDeliveryNoteChange = (e) => {
    const deliveryNoteId = e.target.value
    setFormData({ ...formData, delivery_note: deliveryNoteId })
    
    if (deliveryNoteId) {
      fetchDeliveryNoteItems(deliveryNoteId)
      const selectedNote = deliveryNotes.find(note => note.id === parseInt(deliveryNoteId))
      setSelectedDeliveryNote(selectedNote)
    } else {
      setDeliveryNoteItems([])
      setSelectedDeliveryNote(null)
    }
  }

  const handleItemToggle = (item) => {
    const existingIndex = formData.received_items.findIndex(
      receivedItem => receivedItem.item_id === item.item_id && receivedItem.lot_number === item.lot_number
    )
    
    if (existingIndex >= 0) {
      // Remove item
      const newItems = formData.received_items.filter((_, index) => index !== existingIndex)
      setFormData({ ...formData, received_items: newItems })
    } else {
      // Add item
      setFormData({
        ...formData,
        received_items: [...formData.received_items, {
          item_id: item.item_id,
          lot_number: item.lot_number,
          quantity: item.quantity
        }]
      })
    }
  }

  const updateReceivedItemQuantity = (itemId, lotNumber, newQuantity) => {
    const newItems = formData.received_items.map(item => {
      if (item.item_id === itemId && item.lot_number === lotNumber) {
        return { ...item, quantity: parseInt(newQuantity) || 0 }
      }
      return item
    })
    setFormData({ ...formData, received_items: newItems })
  }

  const isItemSelected = (item) => {
    return formData.received_items.some(
      receivedItem => receivedItem.item_id === item.item_id && receivedItem.lot_number === item.lot_number
    )
  }

  const getSelectedItemQuantity = (item) => {
    const selectedItem = formData.received_items.find(
      receivedItem => receivedItem.item_id === item.item_id && receivedItem.lot_number === item.lot_number
    )
    return selectedItem ? selectedItem.quantity : 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    
    if (formData.received_items.length === 0) {
      alert('Please select at least one item to receive')
      return
    }

    // Validate quantities
    for (const item of formData.received_items) {
      if (item.quantity <= 0) {
        alert('All quantities must be greater than 0')
        return
      }
    }

    try {
      const requestData = {
        delivery_note: parseInt(formData.delivery_note),
        receiving_type: formData.receiving_type,
        receiving_date: formData.receiving_date,
        received_items: formData.received_items,
        received_by: parseInt(formData.received_by),
        notes: formData.notes,
        uploaded_by: parseInt(formData.uploaded_by)
      }

      const response = await fetch('http://localhost:8000/inventory/api/receiving-note/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        alert('Receiving note created successfully!')
        setShowCreateModal(false)
        setFormData({
          delivery_note: '',
          receiving_type: 'full',
          receiving_date: '',
          received_items: [],
          received_by: '',
          notes: '',
          uploaded_by: ''
        })
        setDeliveryNoteItems([])
        setSelectedDeliveryNote(null)
        fetchReceivingNotes()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create receiving note'}`)
      }
    } catch (error) {
      console.error('Error creating receiving note:', error)
      alert('Error creating receiving note')
    }
  }

  const handleDelete = async (receivingNoteId) => {
    if (!window.confirm('Are you sure you want to delete this receiving note?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/inventory/api/receiving-note/${receivingNoteId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Receiving note deleted successfully!')
        fetchReceivingNotes()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete receiving note'}`)
      }
    } catch (error) {
      console.error('Error deleting receiving note:', error)
      alert('Error deleting receiving note')
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

  const getDeliveryNoteDisplayName = (deliveryNoteId) => {
    const deliveryNote = deliveryNotes.find(note => note.id === deliveryNoteId)
    if (deliveryNote) {
      const orderType = deliveryNote.order_type === 'procurement' ? 'Procurement' : 'Transfer'
      return `${orderType} #${deliveryNote.order_id} - ${deliveryNote.get_delivery_type_display()}`
    }
    return `Delivery Note #${deliveryNoteId}`
  }

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.name : `Item #${itemId}`
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Receiving Note Management" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Receiving Note Management</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
              >
                <FaPlus className="mr-2" />
                Create Receiving Note
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading receiving notes...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiving Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiving Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receivingNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getDeliveryNoteDisplayName(note.delivery_note)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            note.receiving_type === 'full' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {note.receiving_type === 'full' ? 'Full' : 'Partial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{note.receiving_date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {note.received_by?.name || 'N/A'}
                          </div>
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
                            {note.received_items?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {note.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Receiving Note"
                          >
                            <FaTrash className="inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {receivingNotes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No receiving notes found
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Receiving Note</h3>
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Note</label>
                    <select
                      value={formData.delivery_note}
                      onChange={handleDeliveryNoteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Delivery Note</option>
                      {deliveryNotes.map((note) => (
                        <option key={note.id} value={note.id}>
                          {getDeliveryNoteDisplayName(note.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receiving Type</label>
                    <select
                      value={formData.receiving_type}
                      onChange={(e) => setFormData({...formData, receiving_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="full">Full Receipt</option>
                      <option value="partial">Partial Receipt</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receiving Date</label>
                    <input
                      type="date"
                      value={formData.receiving_date}
                      onChange={(e) => setFormData({...formData, receiving_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
                    <select
                      value={formData.received_by}
                      onChange={(e) => setFormData({...formData, received_by: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {selectedDeliveryNote && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Items to Receive</label>
                    <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                      {deliveryNoteItems.length > 0 ? (
                        <div className="space-y-2">
                          {deliveryNoteItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                              <div className="flex items-center space-x-4">
                                <input
                                  type="checkbox"
                                  checked={isItemSelected(item)}
                                  onChange={() => handleItemToggle(item)}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {getItemName(item.item_id)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Lot: {item.lot_number} | Delivered: {item.quantity}
                                  </div>
                                </div>
                              </div>
                              {isItemSelected(item) && (
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-700">Quantity:</label>
                                  <input
                                    type="number"
                                    value={getSelectedItemQuantity(item)}
                                    onChange={(e) => updateReceivedItemQuantity(item.item_id, item.lot_number, e.target.value)}
                                    min="1"
                                    max={item.quantity}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          No items found in this delivery note
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Optional notes about the receipt..."
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded By</label>
                  <select
                    value={formData.uploaded_by}
                    onChange={(e) => setFormData({...formData, uploaded_by: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Create Receiving Note
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

export default ReceivingNote 