import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const AddDiscardedItemForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    procurement: "",
    item: "",
    quantity: "",
    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    reason: "",
    notes: "",
    discardedBy: ""
  });

  // Mock procurement data - replace with actual API call
  const [procurements, setProcurements] = useState([
    {
      id: "PO-2023-001",
      supplier: "Tech Solutions Inc.",
      items: ["Laptop", "Monitor", "Keyboard"]
    },
    {
      id: "PO-2023-002",
      supplier: "Office Supplies Ltd.",
      items: ["Mouse", "Notebook", "Printer"]
    },
    {
      id: "PO-2023-003",
      supplier: "Furniture World",
      items: ["Chair", "Desk"]
    }
  ]);

  // State for filtered items based on selected procurement
  const [filteredItems, setFilteredItems] = useState([]);

  const discardReasons = [
    "Dumped",
    "Obsolete",
    "Expired",
    "Damaged",
    "Lost",
    "Other"
  ];

  const staffMembers = [
    "John Smith",
    "Emily Davis",
    "Sarah Johnson",
    "Michael Brown",
    "Robert Wilson"
  ];

  // Update filtered items when procurement changes
  useEffect(() => {
    if (formData.procurement) {
      const selectedProcurement = procurements.find(p => p.id === formData.procurement);
      setFilteredItems(selectedProcurement ? selectedProcurement.items : []);
      setFormData(prev => ({ ...prev, item: "" })); // Reset item selection
    } else {
      setFilteredItems([]);
    }
  }, [formData.procurement, procurements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Record Discarded Items</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Record items that have been discarded from inventory.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Procurement Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procurement *</label>
                <select
                  name="procurement"
                  value={formData.procurement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a procurement</option>
                  {procurements.map((procurement, index) => (
                    <option key={index} value={procurement.id}>
                      {procurement.id} - {procurement.supplier}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Items Dropdown (dynamically filtered) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                <select
                  name="item"
                  value={formData.item}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.procurement}
                >
                  <option value="">{formData.procurement ? "Select an item" : "First select a procurement"}</option>
                  {filteredItems.map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discard Date *</label>
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select reason</option>
                  {discardReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discarded By *</label>
                <select
                  name="discardedBy"
                  value={formData.discardedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select staff member</option>
                  {staffMembers.map((staff, index) => (
                    <option key={index} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t bg-white sticky bottom-0">
          <div className="flex justify-end space-x-3">
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
              disabled={!formData.procurement || !formData.item}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Record Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDiscardedItemForm;