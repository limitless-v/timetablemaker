import { Bell, ChevronDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationList } from '../data/notificationData.js';

function Navbar({ title, onToggleSidebar }) {
  return (
    <header className="navbar-area shadow-sm bg-white px-3 py-2 d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-outline-primary d-md-none" onClick={onToggleSidebar}>
          ☰
        </button>
        <div>
          <h1 className="h5 mb-0 text-dark">{title}</h1>
          <small className="text-muted">Manage academic schedules and allocations</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <div className="search-input input-group d-none d-md-flex">
          <span className="input-group-text bg-white border-end-0"><Search size={16} /></span>
          <input className="form-control border-start-0" type="search" placeholder="Search..." />
        </div>
        <div className="dropdown">
          <button className="btn btn-light position-relative" data-bs-toggle="dropdown">
            <Bell size={20} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{notificationList.length}</span>
          </button>
          <div className="dropdown-menu dropdown-menu-end p-3 shadow-sm notifications-dropdown">
            <h6 className="dropdown-header">Notifications</h6>
            {notificationList.map((item) => (
              <div key={item.id} className="dropdown-item py-2">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold">{item.title}</span>
                  <small className="text-muted">{item.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dropdown">
          <button className="btn btn-light d-flex align-items-center gap-2" data-bs-toggle="dropdown">
            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>A</div>
            <span>Admin</span>
            <ChevronDown size={16} />
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow-sm">
            <Link className="dropdown-item" to="/settings">Profile</Link>
            <Link className="dropdown-item" to="/settings">Settings</Link>
            <Link className="dropdown-item text-danger" to="/login">Logout</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
