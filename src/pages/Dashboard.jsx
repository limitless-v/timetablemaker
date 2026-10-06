import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, Clock3, PlusCircle } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { getAllSourceTimetableSessions } from '../data/sourceTimetables.js';
import { loadAppState } from '../services/storageService.js';
import { format12HourRange } from '../utils/timeUtils.js';

const quickActions = [
  { label: 'Add Faculty', route: '/faculty' },
  { label: 'Add Subject', route: '/subjects' },
  { label: 'Add Room', route: '/rooms' },
  { label: 'Generate Timetable', route: '/generate-timetable' }
];

function Dashboard() {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const appState = loadAppState();

  const summary = useMemo(() => [
    { title: 'Total Faculties', value: appState.faculty?.length || 0, variant: 'primary', icon: <PlusCircle /> },
    { title: 'Total Subjects', value: appState.subjects?.length || 0, variant: 'info', icon: <BarChart3 /> },
    { title: 'Total Rooms', value: appState.rooms?.length || 0, variant: 'success', icon: <CalendarDays /> },
    { title: 'Total Classes', value: appState.classes?.length || 0, variant: 'warning', icon: <Clock3 /> }
  ], [appState]);

  const upcoming = useMemo(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return getAllSourceTimetableSessions()
      .filter((session) => session.dayIndex === todayIndex)
      .sort((first, second) => first.start.localeCompare(second.start))
      .slice(0, 3);
  }, []);

  const actionClicked = (item) => {
    navigate(item.route);
    setToast(`${item.label} opened.`);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="dashboard-page">
      <div className="row g-3 mb-4">
        {summary.map((item) => (
          <div className="col-12 col-md-6 col-xl-3" key={item.title}>
            <StatCard title={item.title} value={item.value} icon={item.icon} variant={item.variant} />
          </div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-xl-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1">Timetables Generated</h5>
                  <small className="text-muted">Last 7 days overview</small>
                </div>
                <span className="badge bg-primary">Updated</span>
              </div>
              <div className="chart-grid py-4">
                <div className="chart-bar" style={{ height: '68%' }}><span>19</span></div>
                <div className="chart-bar" style={{ height: '56%' }}><span>15</span></div>
                <div className="chart-bar" style={{ height: '72%' }}><span>22</span></div>
                <div className="chart-bar" style={{ height: '48%' }}><span>12</span></div>
                <div className="chart-bar" style={{ height: '62%' }}><span>18</span></div>
                <div className="chart-bar" style={{ height: '80%' }}><span>24</span></div>
                <div className="chart-bar" style={{ height: '54%' }}><span>16</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body">
              <h5 className="mb-3">Classes Today</h5>
              <ul className="list-unstyled mb-0">
                {upcoming.length === 0 ? (
                  <li className="py-3 border-bottom text-muted">No classes are scheduled today.</li>
                ) : upcoming.map((item) => (
                  <li key={`${item.className}-${item.start}-${item.subject}`} className="py-3 border-bottom">
                    <div className="fw-semibold text-primary">{format12HourRange(item.start, item.end)}</div>
                    <div className="text-dark small fw-medium">{item.className} - {item.subject}</div>
                    <div className="text-muted small">{item.faculty} • {item.room}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                {quickActions.map((item) => (
                  <button key={item.label} className="btn btn-outline-primary btn-sm" onClick={() => actionClicked(item)}>{item.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Dashboard;
