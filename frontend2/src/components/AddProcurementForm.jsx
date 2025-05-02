import { useState } from "react";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";

const AddProcurementForm = ({ onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState([
    { itemId: "", itemName: "", category: "1", quantity: "", unitPrice: "" }
  ]);
  const [formData, setFormData] = useState({
    procurementType: "",
    supplier: "",
    procurementDate: "",
    notes: "",
    documentType: "",
    documentFile: null
  });

  // Inventory items with procurement type included
  const inventoryItems = [
    { id: 1, name: "New Laptop", category: "1", procurementType: "Purchase" },
    { id: 2, name: "Printer", category: "1", procurementType: "Purchase" },
    { id: 3, name: "Office Desk", category: "3", procurementType: "Purchase" },
    { id: 4, name: "Used Computer", category: "2", procurementType: "Donation" },
    { id: 5, name: "Old Furniture", category: "3", procurementType: "Donation" },
    { id: 6, name: "Department Chair", category: "3", procurementType: "Transfer" },
    { id: 7, name: "Shared Equipment", category: "1", procurementType: "Transfer" }
  ];

  // Filter items based on selected procurement type
  const getFilteredItems = () => {
    if (!formData.procurementType) return [];
    return inventoryItems.filter(item => item.procurementType === formData.procurementType);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset items when procurement type changes
    if (name === "procurementType") {
      setItems([{ itemId: "", itemName: "", category: "1", quantity: "", unitPrice: "" }]);
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    
    if (name === "itemId") {
      const selectedItem = inventoryItems.find(item => item.id.toString() === value);
      newItems[index] = {
        ...newItems[index],
        itemId: value,
        itemName: selectedItem ? selectedItem.name : "",
        category: selectedItem ? selectedItem.category : "1"
      };
    } else {
      newItems[index] = { ...newItems[index], [name]: value };
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { itemId: "", itemName: "", category: "1", quantity: "", unitPrice: "" }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, documentFile: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format data to match procurement table structure
    const formattedItems = items.map(item => ({
      name: item.itemName || inventoryItems.find(i => i.id.toString() === item.itemId)?.name || "Custom Item",
      quantity: parseInt(item.quantity),
      unitPrice: item.unitPrice.includes('$') ? item.unitPrice : `$${item.unitPrice}`,
      total: `$${(parseInt(item.quantity) * parseFloat(item.unitPrice || 0)).toFixed(2)}`,
      type: "Purchase" // Default type as shown in your table
    }));

    const documentData = formData.documentFile ? {
      type: formData.documentFile.name.split('.').pop(),
      name: formData.documentFile.name,
      url: URL.createObjectURL(formData.documentFile)
    } : null;

    const submissionData = {
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-generate PO number
      items: formattedItems,
      supplier: formData.supplier,
      date: new Date(formData.procurementDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      documentType: formData.documentType || "Purchase Order",
      addedBy: "Current User", // This would be dynamic in a real app
      document: documentData,
      notes: formData.notes
    };

    onSubmit(submissionData);
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Add New Procurement</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">Add a new procurement to your inventory</p>
          
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${currentStep === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentStep(1)}
            >
              Basic Info
            </button>
            <button
              className={`px-4 py-2 font-medium ${currentStep === 2 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentStep(2)}
            >
              Additional Details
            </button>
            <button
              className={`px-4 py-2 font-medium ${currentStep === 3 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentStep(3)}
            >
              Documentation
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Type *</label>
                  <select
                    name="procurementType"
                    value={formData.procurementType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select procurement type</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Donation">Donation</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>

                {formData.procurementType && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Items</h4>
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FaPlus className="mr-1" /> Add Item
                      </button>
                    </div>
                    
                    {items.map((item, index) => (
                      <div key={index} className="mb-4 p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Item #{index + 1}</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <FaMinus />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Item *</label>
                            <select
                              name="itemId"
                              value={item.itemId}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              required
                            >
                              <option value="">Select an item</option>
                              {getFilteredItems().map((invItem) => (
                                <option key={invItem.id} value={invItem.id}>
                                  {invItem.name}
                                </option>
                              ))}
                              <option value="new">+ Add New Item</option>
                            </select>
                          </div>

                          {item.itemId === "new" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                                <input
                                  type="text"
                                  name="itemName"
                                  value={item.itemName}
                                  onChange={(e) => handleItemChange(index, e)}
                                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                                <select
                                  name="category"
                                  value={item.category}
                                  onChange={(e) => handleItemChange(index, e)}
                                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  required
                                >
                                  <option value="1">Furniture and Fixture</option>
                                  <option value="2">Consumable</option>
                                  <option value="3">Deadstock</option>
                                </select>
                              </div>
                            </>
                          )}
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                            <input
                              type="number"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              required
                              min="1"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price *</label>
                            <input
                              type="number"
                              name="unitPrice"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, e)}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4" style={{ minHeight: '400px' }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Source *</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="Enter supplier or source"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Date *</label>
                  <input
                    type="date"
                    name="procurementDate"
                    value={formData.procurementDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter additional notes about this procurement"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.supplier || !formData.procurementDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4 pb-6" style={{ minHeight: '400px' }}>
                <div>
                  <h3 className="text-lg font-medium mb-2">Document Type</h3>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select document type</option>
                    <option value="purchase_order">Purchase Order</option>
                    <option value="donation_letter">Donation Letter</option>
                    <option value="internal_memo">Internal Memo</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Upload Document</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      id="documentUpload"
                    />
                    <label
                      htmlFor="documentUpload"
                      className="cursor-pointer block"
                    >
                      <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG or PNG (max. 5MB)</p>
                    </label>
                    {formData.documentFile && (
                      <p className="text-sm text-green-600 mt-2">
                        {formData.documentFile.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {currentStep === 3 && (
          <div className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Procurement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProcurementForm;

