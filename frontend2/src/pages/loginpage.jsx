// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import nedLogo from "/src/assets/ned.png";

// const LoginPage = () => {
//   const [userType, setUserType] = useState('admin');
//   const [portalID, setPortalID] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const predefinedCreds = {
//     admin: {
//       username: 'admin',
//       password: 'admin123'
//     },
//     user: {
//       username: 'user',
//       password: 'user123'
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const { username, password: correctPassword } = predefinedCreds[userType];
  
//     if (portalID === username && password === correctPassword) {
//       localStorage.setItem('isLoggedIn', 'true');
//       localStorage.setItem('userType', userType);
//       setError('');
//       navigate('/dashboard');
//     } else {
//       setError('Invalid credentials');
//     }
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
//       <div className="w-full max-w-md mx-auto">
//         {/* Logo and University Name */}
//         <div className="flex flex-col items-center mb-8">
//           <img src={nedLogo} alt="NED Logo" className="w-20 mb-4" />
//           <h1 className="text-2xl font-bold text-gray-800">NED UNIVERSITY</h1>
//           <h2 className="text-sm text-gray-600">OF ENGINEERING & TECHNOLOGY</h2>
//         </div>

//         {/* Login Card */}
//         <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="bg-gray-700 text-white text-center py-3 text-xl">
//             NED lab inventory Login
//           </div>
          
//           <div className="p-6">
//             <div className="flex border-b mb-6">
//               <button
//                 className={`flex-1 py-2 font-medium ${userType === 'admin' ? 'text-gray-800 border-b-2 border-gray-700' : 'text-gray-500'}`}
//                 onClick={() => setUserType('admin')}
//               >
//                 Admin
//               </button>
//               <button
//                 className={`flex-1 py-2 font-medium ${userType === 'user' ? 'text-gray-800 border-b-2 border-gray-700' : 'text-gray-500'}`}
//                 onClick={() => setUserType('user')}
//               >
//                 User
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Portal ID</label>
//                 <input
//                   type="text"
//                   placeholder="Enter Portal ID"
//                   value={portalID}
//                   onChange={(e) => setPortalID(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">Use "{predefinedCreds[userType].username}" for testing</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                   >
//                     <img 
//                       src="https://cdn-icons-png.flaticon.com/512/159/159604.png" 
//                       alt="Toggle password visibility" 
//                       className="w-5 h-5"
//                     />
//                   </button>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">Password is case sensitive — Use "{predefinedCreds[userType].password}" for testing</p>
//               </div>

//               {error && (
//                 <p className="text-red-500 text-sm text-center">{error}</p>
//               )}

//               <button
//                 type="submit"
//                 className="w-full py-2 px-4 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
//               >
//                 Login
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nedLogo from "/src/assets/ned.png";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure Font Awesome is available

const LoginPage = () => {
  const [userType, setUserType] = useState('admin');
  const [portalID, setPortalID] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const predefinedCreds = {
    admin: {
      username: 'admin',
      password: 'admin123'
    },
    user: {
      username: 'user',
      password: 'user123'
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, password: correctPassword } = predefinedCreds[userType];

    if (portalID === username && password === correctPassword) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userType', userType);
      setError('');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
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
                className={`flex-1 py-2 font-medium text-center z-10 ${userType === 'admin' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => setUserType('admin')}
              >
                Admin
              </button>
              <button
                className={`flex-1 py-2 font-medium text-center z-10 ${userType === 'user' ? 'text-gray-800' : 'text-gray-500'}`}
                onClick={() => setUserType('user')}
              >
                User
              </button>
              <span
                className="absolute bottom-0 left-0 w-1/2 h-[2px] bg-gray-700 transition-transform duration-300 ease-in-out"
                style={{
                  transform: userType === 'admin' ? 'translateX(0%)' : 'translateX(100%)',
                }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal ID</label>
                <input
                  type="text"
                  placeholder="Enter Portal ID"
                  value={portalID}
                  onChange={(e) => setPortalID(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Use "{predefinedCreds[userType].username}" for testing</p>
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
                <p className="text-xs text-gray-500 mt-1">Password is case sensitive — Use "{predefinedCreds[userType].password}" for testing</p>
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

