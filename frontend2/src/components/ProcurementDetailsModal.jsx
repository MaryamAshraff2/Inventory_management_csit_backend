import { useState, useEffect } from "react";
import { FaTimes, FaSave, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const ProcurementDetailsModal = ({ procurement, mode, onClose, onSave }) => {
  const [editedProcurement, setEditedProcurement] = useState(procurement);
  const [newItem, setNewItem] = useState({
    name: "",
    type: "",
    quantity: 1,
    unitPrice: "",
    total: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEditedProcurement(procurement);
    setErrors({});
  }, [procurement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProcurement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...editedProcurement.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };
    
    // Calculate total if quantity or unitPrice changes
    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = parseFloat(name === 'quantity' ? value : updatedItems[index].quantity) || 0;
      const unitPrice = parseFloat(name === 'unitPrice' ? value.replace('$', '') : updatedItems[index].unitPrice.replace('$', '')) || 0;
      updatedItems[index].total = `$${(quantity * unitPrice).toFixed(2)}`;
    }
    
    setEditedProcurement(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    if (!newItem.name) {
      setErrors(prev => ({ ...prev, newItem: "Item name is required" }));
      return;
    }
    
    const quantity = parseFloat(newItem.quantity) || 0;
    const unitPrice = parseFloat(newItem.unitPrice.replace('$', '')) || 0;
    const total = `$${(quantity * unitPrice).toFixed(2)}`;
    
    setEditedProcurement(prev => ({
      ...prev,
      items: [...prev.items, {
        ...newItem,
        total
      }]
    }));
    
    setNewItem({
      name: "",
      type: "",
      quantity: 1,
      unitPrice: "",
      total: ""
    });
    setErrors(prev => ({ ...prev, newItem: null }));
  };

  const removeItem = (index) => {
    setEditedProcurement(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {};
    if (!editedProcurement.orderNumber) newErrors.orderNumber = "Order number is required";
    if (!editedProcurement.supplier) newErrors.supplier = "Supplier is required";
    if (!editedProcurement.date) newErrors.date = "Date is required";
    if (editedProcurement.items.length === 0) newErrors.items = "At least one item is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(editedProcurement);
  };

  const getDocumentIcon = (type) => {
    switch(type) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'doc': return <FaFileWord className="text-blue-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">
            {mode === "edit" ? "Edit Procurement" : "Procurement Details"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number *
                </label>
                {mode === "edit" ? (
                  <>
                    <input
                      type="text"
                      name="orderNumber"
                      value={editedProcurement.orderNumber || ""}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.orderNumber ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.orderNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.orderNumber}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-md">{editedProcurement.orderNumber}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                {mode === "edit" ? (
                  <>
                    <input
                      type="text"
                      name="supplier"
                      value={editedProcurement.supplier || ""}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.supplier ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.supplier && (
                      <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-md">{editedProcurement.supplier}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                {mode === "edit" ? (
                  <>
                    <input
                      type="date"
                      name="date"
                      value={editedProcurement.date || ""}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-md">{editedProcurement.date}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {mode === "edit" ? (
                  <select
                    name="status"
                    value={editedProcurement.status || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    editedProcurement.status === 'Completed' 
                      ? 'bg-green-100 text-green-800' 
                      : editedProcurement.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {editedProcurement.status}
                  </span>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document
                </label>
                {editedProcurement.document ? (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
                    {getDocumentIcon(editedProcurement.document.type)}
                    <span>{editedProcurement.document.name}</span>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-400">No document</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                {mode === "edit" ? (
                  <textarea
                    name="notes"
                    value={editedProcurement.notes || ""}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-md whitespace-pre-line">
                    {editedProcurement.notes || "No notes"}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Items</h3>
                {errors.items && (
                  <p className="text-sm text-red-600">{errors.items}</p>
                )}
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      {mode === "edit" && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editedProcurement.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {mode === "edit" ? (
                            <input
                              type="text"
                              name="name"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {mode === "edit" ? (
                            <input
                              type="text"
                              name="type"
                              value={item.type}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span>{item.type}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {mode === "edit" ? (
                            <input
                              type="number"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, e)}
                              min="1"
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span>{item.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {mode === "edit" ? (
                            <input
                              type="text"
                              name="unitPrice"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span>{item.unitPrice}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {item.total}
                        </td>
                        {mode === "edit" && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    
                    {mode === "edit" && (
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="name"
                            value={newItem.name}
                            onChange={handleNewItemChange}
                            placeholder="Item name"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="type"
                            value={newItem.type}
                            onChange={handleNewItemChange}
                            placeholder="Type"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            name="quantity"
                            value={newItem.quantity}
                            onChange={handleNewItemChange}
                            min="1"
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="unitPrice"
                            value={newItem.unitPrice}
                            onChange={handleNewItemChange}
                            placeholder="Price"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={addItem}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {mode === "edit" && (
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FaSave className="mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDetailsModal;