const InventoryDetails = ({ item, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl sm:max-w-xl md:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Inventory Details</h2>
                <p className="text-gray-600 text-xs sm:text-sm">View detailed information for this inventory item</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 self-end sm:self-auto"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-1 text-xs">Inventory ID</h3>
                <p className="text-gray-900 break-all text-xs sm:text-sm">{item.id}</p>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-1 text-xs">Item Name</h3>
                <p className="text-gray-900 break-all text-xs sm:text-sm">{item.name}</p>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-1 text-xs">Quantity</h3>
                <p className="text-gray-900 text-xs sm:text-sm">{item.quantity}</p>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <h3 className="font-medium text-gray-500 mb-1 text-xs">Procurement ID</h3>
                <p className="text-gray-900 break-all text-xs sm:text-sm">{item.procurementId}</p>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg md:col-span-2">
                <h3 className="font-medium text-gray-500 mb-1 text-xs">Location</h3>
                <p className="text-gray-900 break-all text-xs sm:text-sm">{item.location}</p>
              </div>
            </div>
  
            <div className="border-t pt-3">
              <h3 className="font-medium text-base sm:text-lg mb-3">Procurement Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.supplier && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <h4 className="font-medium text-gray-500 mb-1 text-xs">Supplier</h4>
                    <p className="text-gray-900 break-all text-xs sm:text-sm">{item.supplier}</p>
                  </div>
                )}
                {item.orderDate && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <h4 className="font-medium text-gray-500 mb-1 text-xs">Order Date</h4>
                    <p className="text-gray-900 text-xs sm:text-sm">{item.orderDate}</p>
                  </div>
                )}
                {item.unitPrice && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <h4 className="font-medium text-gray-500 mb-1 text-xs">Unit Price</h4>
                    <p className="text-gray-900 text-xs sm:text-sm">{item.unitPrice}</p>
                  </div>
                )}
                {item.addedBy && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <h4 className="font-medium text-gray-500 mb-1 text-xs">Added By</h4>
                    <p className="text-gray-900 break-all text-xs sm:text-sm">{item.addedBy}</p>
                  </div>
                )}
              </div>
            </div>
  
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
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