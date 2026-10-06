import { useMemo, useState } from 'react';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import ToastMessage from '../components/ToastMessage.jsx';
import { detectTimetableConflicts } from '../services/conflictService.js';
import { loadAppState } from '../services/storageService.js';
import { format12HourRange } from '../utils/timeUtils.js';

function Conflicts() {
  const [appState] = useState(() => loadAppState());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const handleCheck = () => {
    setLoading(true);
    setResults(null);
    setError('');

    try {
      const current = loadAppState();
      const validation = detectTimetableConflicts(current.generatedTimetable || [], current);
      setResults(validation.hardConflicts);
      setToast(validation.valid ? 'No schedule conflicts found' : `${validation.hardConflicts.length} hard conflict(s) found`);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'Unable to check timetable conflicts.');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2600);
    }
  };

  const counts = useMemo(() => ({
    total: results?.length ?? 0,
    faculty: results?.filter((item) => item.type === 'FACULTY_OVERLAP').length ?? 0,
    room: results?.filter((item) => item.type === 'ROOM_OVERLAP').length ?? 0,
    class: results?.filter((item) => item.type === 'CLASS_OVERLAP').length ?? 0
  }), [results]);

  return (
    <div className="conflicts-page">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h4>Conflict Detection</h4>
              <p className="text-muted mb-0">Validate the current timetable using detectConflicts(entries, appData).</p>
            </div>
            <button className="btn btn-primary" onClick={handleCheck} disabled={loading}>Check Conflicts</button>
          </div>
          <div className="row g-3">
            <div className="col-sm-6 col-lg-3">
              <div className="card bg-primary text-white p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div><h5 className="mb-1">{counts.total}</h5><small>Total Conflicts</small></div>
                  <AlertTriangle size={24} />
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3"><div className="card p-3 shadow-sm"><h5>{counts.faculty}</h5><small>Faculty Conflicts</small></div></div>
            <div className="col-sm-6 col-lg-3"><div className="card p-3 shadow-sm"><h5>{counts.room}</h5><small>Room Conflicts</small></div></div>
            <div className="col-sm-6 col-lg-3"><div className="card p-3 shadow-sm"><h5>{counts.class}</h5><small>Class Conflicts</small></div></div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div><h5 className="mb-0">Conflict Results</h5><small className="text-muted">Latest detected issues</small></div>
            <div className="input-group w-100 w-md-50">
              <span className="input-group-text bg-white"><Search size={18} /></span>
              <input className="form-control" placeholder="Search conflicts..." disabled />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-5 text-muted">Checking stored timetable...</div>
          ) : error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : results === null ? (
            <div className="text-center py-5 text-muted">No validation run yet.</div>
          ) : results.length === 0 ? (
            <div className="text-center py-5 text-success"><CheckCircle size={20} className="me-2" />No hard conflicts found in the current timetable.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light"><tr><th>Type</th><th>Detail</th><th>Time</th><th>Classes</th><th>Status</th></tr></thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.id}><td>{item.type}</td><td>{item.message}</td><td>{item.day} • {format12HourRange(item.startTime, item.endTime)}</td><td>{item.classId || 'N/A'}</td><td><span className="badge bg-danger">Hard conflict</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Conflicts;
