import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const UserDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    window.location.href = '/loginpage';
  };

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="User Dashboard" onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-800">Hello User</h1>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserDashboard;
