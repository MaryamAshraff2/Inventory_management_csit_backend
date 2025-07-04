import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { itemsAPI } from '../services/api';
import PropTypes from "prop-types";

const DeadStock = () => {
  const [deadStockItems, setDeadStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeadStock = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await itemsAPI.getAll({ dead_stock: true });
        setDeadStockItems(data);
      } catch (err) {
        setError('Failed to load dead stock items.');
      } finally {
        setLoading(false);
      }
    };
    fetchDeadStock();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row w-full min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Navbar title="Dead Stock Items" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
            <div className="px-4 sm:px-6 py-4">
              <h3 className="text-lg font-semibold">Dead Stock Items</h3>
              <p className="text-gray-500 text-sm">Items that have not moved for their threshold period.</p>
            </div>
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : error ? (
              <div className="p-4 text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Store Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Movement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold (days)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deadStockItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.category?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.main_store_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.total_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.last_stock_movement || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.dead_stock_threshold_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deadStockItems.length === 0 && (
                  <div className="p-4 text-gray-500">No dead stock items found.</div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

DeadStock.propTypes = {};

export default DeadStock;
export { DeadStock }; 