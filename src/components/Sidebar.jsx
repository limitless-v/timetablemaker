import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, LayoutGrid, Clock3, Layers, CalendarDays, BarChart3, FileText, Settings2, UploadCloud } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/faculty', label: 'Faculty', icon: Users },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/rooms', label: 'Rooms', icon: LayoutGrid },
  { to: '/classes', label: 'Classes', icon: Clock3 },
  { to: '/time-slots', label: 'Time Slots', icon: Layers },
  { to: '/constraints', label: 'Constraints', icon: CalendarDays },
  { to: '/generate-timetable', label: 'Timetable', icon: BarChart3 },
  { to: '/import-timetable', label: 'Import Timetable', icon: UploadCloud },
  { to: '/conflicts', label: 'Conflict Detection', icon: FileText },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings2 }
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar bg-white border-end shadow-sm ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand d-flex align-items-center justify-content-between p-3 border-bottom">
        <div>
          <div className="fs-4 fw-bold text-primary">ClassMate</div>
          <div className="text-muted small">Timetable Generator</div>
        </div>
        <button className="btn btn-sm btn-outline-secondary d-md-none" onClick={onToggle}>
          ✕
        </button>
      </div>
      <nav className="nav flex-column p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="nav-link rounded mb-1 text-dark">
              <Icon className="me-2" size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
