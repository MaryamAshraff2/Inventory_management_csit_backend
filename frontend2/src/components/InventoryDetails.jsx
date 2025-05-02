const InventoryDetails = ({ item, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Inventory Details</h2>
                <p className="text-gray-600">View detailed information for this inventory item</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
  
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-2">Inventory ID</h3>
                <p className="text-gray-900">{item.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-2">Item Name</h3>
                <p className="text-gray-900">{item.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-2">Quantity</h3>
                <p className="text-gray-900">{item.quantity}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-2">Procurement ID</h3>
                <p className="text-gray-900">{item.procurementId}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <h3 className="font-medium text-gray-500 mb-2">Location</h3>
                <p className="text-gray-900">{item.location}</p>
              </div>
            </div>
  
            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-4">Procurement Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-500 mb-2">Supplier</h4>
                  <p className="text-gray-900">{item.supplier}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-500 mb-2">Date</h4>
                  <p className="text-gray-900">{item.date}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-500 mb-2">Added By</h4>
                  <p className="text-gray-900">{item.addedBy}</p>
                </div>
              </div>
            </div>
  
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default InventoryDetails;