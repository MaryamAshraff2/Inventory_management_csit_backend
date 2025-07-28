import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nedLogo from "/src/assets/ned.png";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure Font Awesome is available

const LoginPage = () => {
  const [userType, setUserType] = useState('superuser');
  const [username, setUsername] = useState('superuser');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();



  const handleUserTypeChange = (newUserType) => {
    setUserType(newUserType);
    if (newUserType === 'superuser') {
      setUsername('superuser');
      setPassword('');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/inventory/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: userType === 'superuser' ? '' : password
        }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userType', data.user.role);
        sessionStorage.setItem('username', data.user.username);
        sessionStorage.setItem('userId', data.user.id);
        sessionStorage.setItem('userName', data.user.name);
        sessionStorage.setItem('userDepartment', data.user.department);
        
        // Navigate based on user role returned from backend
        switch (data.user.role) {
          case 'superuser':
            navigate('/superuser-dashboard');
            break;
          case 'chairman':
            navigate('/chairman-dashboard');
            break;
          case 'main_inventory_manager':
            navigate('/main-inventory-dashboard');
            break;
          case 'inventory_manager':
            navigate('/inventory-manager-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo and University Name */}
        <div className="flex flex-col items-center mb-8">
          <img src={nedLogo} alt="NED Logo" className="w-20 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">NED UNIVERSITY</h1>
          <h2 className="text-sm text-gray-600">OF ENGINEERING & TECHNOLOGY</h2>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-700 text-white text-center py-3 text-xl">
            NED lab inventory Login
          </div>

          <div className="p-6">
            {/* Tabs with Smooth Slide */}
            <div className="relative flex border-b mb-6">
              <button
                className={`flex-1 py-2 font-medium text-center z-10 text-xs ${userType === 'superuser' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => handleUserTypeChange('superuser')}
              >
                Superuser
              </button>
              <button
                className={`flex-1 py-2 font-medium text-center z-10 text-xs ${userType === 'chairman' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => handleUserTypeChange('chairman')}
              >
                Chairman
              </button>
              <button
                className={`flex-1 py-2 font-medium text-center z-10 text-xs ${userType === 'main_inventory_manager' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => handleUserTypeChange('main_inventory_manager')}
              >
                Main Inventory Manager
              </button>
              <button
                className={`flex-1 py-2 font-medium text-center z-10 text-xs ${userType === 'inventory_manager' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => handleUserTypeChange('inventory_manager')}
              >
                Inventory Manager
              </button>
              <span
                className="absolute bottom-0 left-0 w-1/4 h-[2px] bg-gray-700 transition-transform duration-300 ease-in-out"
                style={{
                  transform: userType === 'superuser' ? 'translateX(0%)' : 
                             userType === 'chairman' ? 'translateX(100%)' : 
                             userType === 'main_inventory_manager' ? 'translateX(200%)' : 'translateX(300%)',
                }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                {userType === 'superuser' && (
                  <p className="text-xs text-gray-500 mt-1">Use "superuser" for superuser</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {userType === 'superuser' && (
                  <p className="text-xs text-gray-500 mt-1">No password required for superuser</p>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

