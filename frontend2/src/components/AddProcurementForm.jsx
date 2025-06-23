import React, { useState, useEffect } from "react";
import axios from 'axios';

export default function ProcurementForm({ procurement, onClose, onSubmit }) {
  const [procurementType, setProcurementType] = useState("");
  const [items, setItems] = useState([
    { itemName: "", quantity: "", unitPrice: "", categoryID: "", isNew: false, itemId: null },
  ]);
  const [availableItems, setAvailableItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [supplier, setSupplier] = useState("");
  const [ProcurementDate, setProcurementDate] = useState("");
  const [notes, setNotes] = useState("");
  const [document, setDocument] = useState(null);
  const [documentType, setDocumentType] = useState("");

  // Fetch available items and categories from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:8000/inventory/items/');
        setAvailableItems(response.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8000/inventory/categories/')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (procurement) {
      setProcurementType(procurement.type || "");
      setSupplier(procurement.supplier || "");
      setProcurementDate(procurement.order_date || "");
      setNotes(procurement.notes || "");
      setDocument(null); // Don't prefill file
      setItems([
        {
          itemName: procurement.item?.name || "",
          quantity: procurement.quantity || "",
          unitPrice: procurement.unit_price || "",
          categoryID: procurement.item?.category?.id || "",
          isNew: false,
          itemId: procurement.item?.id || null,
        },
      ]);
    }
  }, [procurement]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // If user chooses "+ Add New Item", switch to manual input mode
    if (field === "itemName" && value === "__new__") {
      updated[index] = { ...updated[index], itemName: "", itemId: null, isNew: true };
    } else if (field === "itemName" && updated[index].isNew) {
      // Keep isNew true when typing in the item name
      updated[index] = { ...updated[index], itemName: value };
    } else if (field === "itemName") {
      // When selecting an existing item, store both name and ID
      const selectedItem = availableItems.find(item => item.name === value);
      updated[index] = { 
        ...updated[index], 
        itemName: value,
        itemId: selectedItem?.id || null
      };
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: "", unitPrice: "", categoryID: "", isNew: false, itemId: null }]);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleFileUpload = (e) => {
    setDocument(e.target.files[0] || null);
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || !items[0].itemName) {
      alert("Please add at least one item to the procurement.");
      return;
    }
    const formData = new FormData();
    formData.append('supplier', supplier);
    formData.append('order_date', ProcurementDate);
    if (document) {
      formData.append('document', document);
    }
    const item = items[0];
    if (item.isNew) {
      if (!item.itemName || !item.categoryID || !item.quantity || !item.unitPrice) {
        alert("Please fill all fields for new items.");
        return;
      }
      formData.append('item_name', item.itemName);
      formData.append('category_id', Number(item.categoryID));
    } else {
      if (!item.itemId) {
        alert("Please select an item.");
        return;
      }
      formData.append('item_id', item.itemId);
    }
    formData.append('quantity', Number(item.quantity));
    formData.append('unit_price', Number(item.unitPrice));
    try {
      if (procurement) {
        await axios.patch(`http://localhost:8000/inventory/procurements/${procurement.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Procurement updated successfully!');
      } else {
        await axios.post('http://localhost:8000/inventory/procurements/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Procurement added successfully!');
      }
      if (onSubmit) onSubmit();
      if (onClose) onClose();
    } catch (error) {
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`Error: ${errorDetail}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="border-b mb-4">
        <nav className="flex space-x-6 text-sm font-semibold text-blue-600 cursor-pointer">
          <div
            className={`pb-1 border-b-2 ${activeTab === "basic" ? "border-blue-600" : "text-gray-400"}`}
            onClick={() => setActiveTab("basic")}
          >
            Basic Info
          </div>
          <div
            className={`pb-1 border-b-2 ${activeTab === "additional" ? "border-blue-600" : "text-gray-400"}`}
            onClick={() => setActiveTab("additional")}
          >
            Additional Details
          </div>
          <div
            className={`pb-1 border-b-2 ${activeTab === "docs" ? "border-blue-600" : "text-gray-400"}`}
            onClick={() => setActiveTab("docs")}
          >
            Documentation
          </div>
        </nav>
      </div>
  
      <h2 className="text-2xl font-bold mb-4">Add New Procurement</h2>
  
      {activeTab === "additional" && (
        <div className="space-y-4 h-[400px] overflow-y-auto pr-4">
          <div>
            <label htmlFor="supplier" className="block font-medium mb-1">Supplier / Source *</label>
            <input
              id="supplier"
              name="supplier"
              type="text"
              className="w-full border p-2 rounded"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier or source"
            />
          </div>
  
          <div>
            <label htmlFor="procurement-date" className="block font-medium mb-1">Procurement Date *</label>
            <input
              id="procurement-date"
              name="procurement-date"
              type="date"
              className="w-full border p-2 rounded"
              value={ProcurementDate}
              onChange={(e) => setProcurementDate(e.target.value)}
            />
          </div>
  
          <div>
            <label htmlFor="notes" className="block font-medium mb-1">Notes</label>
            <textarea
              id="notes"
              name="notes"
              className="w-full border p-2 rounded"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter additional notes about this procurement"
            />
          </div>
  
          <div className="flex justify-between">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => setActiveTab("basic")}
            >
              Back
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setActiveTab("docs")}
            >
              Next
            </button>
          </div>
        </div>
      )}
  
      {activeTab === "basic" && (
        <>
        <div className="h-[400px] overflow-y-auto pr-4">
          <div className="mb-4">
            <label htmlFor="procurement-type" className="block font-medium mb-1">Procurement Type *</label>
            <select
              id="procurement-type"
              name="procurement-type"
              className="w-full border border-gray-300 p-2 rounded"
              value={procurementType}
              onChange={(e) => setProcurementType(e.target.value)}
            >
              <option value="">Select procurement type</option>
              <option value="Purchase">Purchase</option>
              <option value="Donation">Donation</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>
  
          {procurementType && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-2">Items</h3>
              {items.map((item, index) => (
                <div key={index} className="mb-4 border p-4 rounded">
                  <div className="font-semibold mb-2">Item #{index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 float-right text-lg font-bold"
                    title="Remove item"
                  >
                    &minus;
                  </button>
  
                  {!item.isNew ? (
                    <>
                      <label htmlFor={`itemName-${index}`} className="block mb-1">Item *</label>
                      <select
                        id={`itemName-${index}`}
                        name={`itemName-${index}`}
                        className="w-full border p-2 rounded mb-2"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                      >
                        <option value="">Select an item</option>
                        {availableItems.map((availItem) => (
                          <option key={availItem.id} value={availItem.name}>
                            {availItem.name}
                          </option>
                        ))}
                        <option value="__new__">+ Add new item</option>
                      </select>
                    </>
                  ) : null}
  
                  {(item.itemName === "__new__" || item.isNew) && (
                    <>
                      <label htmlFor={`newItemName-${index}`} className="block mb-1">Item Name *</label>
                      <input
                        id={`newItemName-${index}`}
                        name={`newItemName-${index}`}
                        type="text"
                        placeholder="Item Name *"
                        className="w-full border p-2 rounded mb-2"
                        value={item.itemName === "__new__" ? "" : item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                      />
                      <label htmlFor={`categoryID-${index}`} className="block mb-1">Category *</label>
                      <select
                        id={`categoryID-${index}`}
                        name={`categoryID-${index}`}
                        className="w-full border p-2 rounded mb-2"
                        value={item.categoryID}
                        onChange={(e) => handleItemChange(index, "categoryID", e.target.value)}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
  
                  <label htmlFor={`quantity-${index}`} className="block mb-1">Quantity *</label>
                  <input
                    id={`quantity-${index}`}
                    name={`quantity-${index}`}
                    type="number"
                    placeholder="Quantity *"
                    className="w-full border p-2 rounded mb-2"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  />
                  <label htmlFor={`unitPrice-${index}`} className="block mb-1">Unit Price *</label>
                  <input
                    id={`unitPrice-${index}`}
                    name={`unitPrice-${index}`}
                    type="number"
                    step="0.01"
                    placeholder="Unit Price *"
                    className="w-full border p-2 rounded"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                  />
                </div>
              ))}
  
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 font-semibold mt-2 hover:underline disabled:text-gray-400 disabled:no-underline"
                disabled={items.length > 0}
              >
                + Add Item
              </button>
  
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setActiveTab("additional")}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
        </>
      )}
  
      {activeTab === "docs" && (
        <div className="space-y-4 h-[400px] overflow-y-auto pr-4">
          <div>
            <label htmlFor="documentType" className="block font-medium mb-1">Document Type</label>
            <select
              id="documentType"
              name="documentType"
              className="w-full border p-2 rounded"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="">Select document type</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="MOU (Email)">MOU (Email)</option>
              <option value="Internal Memo">Internal Memo</option>
              <option value="Donation Letter">Donation Letter</option>
              <option value="Invoice">Invoice</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">Type of document associated with this procurement.</p>
          </div>

          <div>
            <label className="block font-medium mb-1">Upload Document</label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-500">
              <input
                id="documents"
                name="documents"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="documents" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 block font-medium text-blue-600">
                  Click to upload
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, DOC, JPG or PNG (max. 5MB)
                </p>
              </label>
            </div>
          </div>

          {document && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Uploaded Document:</h4>
              <span>{document.name}</span>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => setActiveTab("additional")}
            >
              Back
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleSubmit}
            >
              Submit Procurement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}