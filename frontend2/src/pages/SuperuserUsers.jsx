import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API_BASE = 'http://localhost:8000/inventory';

const SuperuserUsers = () => {
  const [superuser, setSuperuser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuperuser();
  }, []);

  const fetchSuperuser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users/`);
      if (res.ok) {
        const users = await res.json();
        const superuserData = users.find(user => user.role === 'superuser');
        setSuperuser(superuserData);
      } else {
        console.error('Failed to fetch superuser');
      }
    } catch (error) {
      console.error('Error fetching superuser:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Superuser Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Superuser Account
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                System administrator account with full access
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading superuser data...</div>
            ) : superuser ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-blue-800 mb-4">Superuser Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Username:</label>
                        <p className="text-lg font-semibold text-gray-900">{superuser.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email:</label>
                        <p className="text-gray-900">{superuser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Role:</label>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {superuser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-blue-800 mb-4">System Access</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">Full system access</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">Department management</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">User management</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-700">System configuration</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Important Notice
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          This is the system administrator account with full privileges. 
                          Only one superuser account exists in the system and it has complete control 
                          over all departments, users, and system settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No superuser account found
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default SuperuserUsers; 