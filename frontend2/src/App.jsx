import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Users from "./pages/Users";
import Categories from './pages/categories';
import Items from './pages/Items';
import Locations from "./pages/Locations";
import Procurements from "./pages/procurements";
import DiscardedItems from "./pages/discardeditems";
import Loginpage from "./pages/loginpage";
import Inventory from "./pages/Inventory";

function App() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/" 
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/loginpage" />} 
          />
          <Route path="/loginpage" element={<Loginpage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/users" element={<Users />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/items" element={<Items />} />
          <Route path="/procurements" element={<Procurements />} />
          <Route path="/discardeditems" element={<DiscardedItems />} />
          <Route path="/inventory" element={<Inventory/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;