import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = location.pathname.replace('/', '').split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Dashboard';

  return (
    <div className="admin-layout d-flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main-content flex-grow-1 d-flex flex-column min-vh-100">
        <Navbar title={pageTitle} onToggleSidebar={() => setCollapsed(false)} />
        <main className="p-4 flex-grow-1 bg-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
