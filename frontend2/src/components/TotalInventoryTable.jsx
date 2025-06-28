import { useEffect, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { itemsAPI } from '../services/api';
import InventoryDetails from './InventoryDetails';

const TotalInventoryTable = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await itemsAPI.getTotalInventory();
        setRows(data);
      } catch (err) {
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available Qty</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Number</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No inventory in stock.</td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-2">{row.id}</td>
                  <td className="px-4 py-2">{row.item_name}</td>
                  <td className="px-4 py-2">{row.available_qty}</td>
                  <td className="px-4 py-2">{row.order_number}</td>
                  <td className="px-4 py-2">{row.location}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                      onClick={() => { setSelectedRow(row); setShowModal(true); }}
                      title="View Details"
                    >
                      <FiEye className="inline-block mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {showModal && selectedRow && (
        <InventoryDetails
          item={{
            id: selectedRow.id,
            name: selectedRow.item_name,
            quantity: selectedRow.available_qty,
            procurementId: selectedRow.order_number,
            location: selectedRow.location,
            supplier: selectedRow.supplier,
            orderDate: selectedRow.order_date,
            unitPrice: selectedRow.unit_price,
            // You can add more details here as needed
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TotalInventoryTable; 