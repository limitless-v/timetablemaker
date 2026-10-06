import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  Grid,
  Clock,
  Table as TableIcon,
  ExternalLink,
  Info,
  User,
  MapPin,
  Laptop,
  BookOpen,
  Printer
} from 'lucide-react';
import { detectConflicts } from '../services/conflictService.js';
import { generateTimetable, generateAITimetable } from '../services/timetableService.js';
import { loadAppState, saveAppState } from '../services/storageService.js';
import { format12HourRange } from '../utils/timeUtils.js';
import ToastMessage from '../components/ToastMessage.jsx';
import WeeklyTimetableGrid from '../components/WeeklyTimetableGrid.jsx';

const dayIndexMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function GenerateTimetable() {
  const navigate = useNavigate();
  const [appState] = useState(() => loadAppState());
  const availableClasses = appState.classes || [];
  const [className, setClassName] = useState(appState.lastGeneratedClass || availableClasses[0]?.name || 'S1 MCA');

  const selectedClass = useMemo(
    () => availableClasses.find((item) => item.name === className) || availableClasses[0],
    [availableClasses, className]
  );

  const [department, setDepartment] = useState(selectedClass?.department || 'Computer Applications');
  const [program, setProgram] = useState(className.includes('BCA') ? 'BCA' : 'MCA');
  const [semester, setSemester] = useState(selectedClass?.semester || 'ODD');
  const [academicYear, setAcademicYear] = useState(appState.settings?.academicYear || '2026-2027');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(appState.generatedTimetable || []);
  const [generationError, setGenerationError] = useState('');
  const [logs, setLogs] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline' | 'table'
  const [toast, setToast] = useState(null);
  const [activeEventDetail, setActiveEventDetail] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    console.log(formatted);
    setLogs((prev) => [...prev, formatted]);
  };

  const handleClassChange = (newClassName) => {
    setClassName(newClassName);
    const target = availableClasses.find((item) => item.name === newClassName);
    if (target) {
      if (target.department) setDepartment(target.department);
      if (target.semester) setSemester(target.semester);
      setProgram(newClassName.includes('BCA') ? 'BCA' : 'MCA');
    }
  };

  const validation = useMemo(() => detectConflicts(generated, appState), [generated, appState]);

  const calendarEvents = useMemo(() => {
    return (generated || []).map((session, index) => {
      const subjectName = session.subjectName || session.subject || 'Subject';
      const facultyName = session.facultyName || session.faculty || 'Faculty';
      const roomName = session.roomName || session.room || 'Room';
      const classNameValue = session.className || session.class || className;
      const dayIndex = dayIndexMap[session.day] ?? 1;
      const isLab = subjectName.toLowerCase().includes('lab') || (session.type && session.type.toLowerCase().includes('lab'));

      return {
        id: `gen-${index}-${session.day}-${session.startTime}`,
        title: subjectName,
        daysOfWeek: [dayIndex],
        startTime: session.startTime || '09:00',
        endTime: session.endTime || '09:55',
        extendedProps: {
          subject: subjectName,
          faculty: facultyName,
          room: roomName,
          className: classNameValue,
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime,
          isLab
        }
      };
    });
  }, [generated, className]);

  const handleEventClick = (info) => {
    info.jsEvent.preventDefault();
    const props = info.event.extendedProps || {};
    setActiveEventDetail({
      title: info.event.title,
      faculty: props.faculty,
      room: props.room,
      day: props.day,
      time: format12HourRange(props.startTime, props.endTime),
      isLab: props.isLab
    });
    setToast(`${info.event.title} • ${props.faculty} • ${props.room} (${format12HourRange(props.startTime, props.endTime)})`);
  };

  const handleGridSessionClick = (session) => {
    const subjectName = session.subjectName || session.subject || 'Subject';
    const facultyName = session.facultyName || session.faculty || 'Faculty';
    const roomName = session.roomName || session.room || 'Room';
    setActiveEventDetail({
      title: subjectName,
      faculty: facultyName,
      room: roomName,
      day: session.day,
      time: format12HourRange(session.startTime, session.endTime),
      isLab: subjectName.toLowerCase().includes('lab')
    });
    setToast(`${subjectName} • ${facultyName} • ${roomName} (${format12HourRange(session.startTime, session.endTime)})`);
  };

  const renderEventContent = (eventInfo) => {
    const { faculty, room, isLab } = eventInfo.event.extendedProps || {};
    return (
      <div className="p-1 h-100 d-flex flex-column justify-content-between overflow-hidden" style={{ fontSize: '0.78rem', lineHeight: 1.25 }}>
        <div>
          <div className="fw-bold text-truncate" title={eventInfo.event.title}>
            {eventInfo.event.title}
          </div>
          {faculty && (
            <div className="text-truncate opacity-80 small" style={{ fontSize: '0.7rem' }}>
              👤 {faculty}
            </div>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top border-dark border-opacity-10">
          <span className={`badge ${isLab ? 'bg-info text-dark' : 'bg-primary'} px-1 py-0`} style={{ fontSize: '0.66rem' }}>
            {room}
          </span>
          <span className="small fw-semibold" style={{ fontSize: '0.66rem' }}>
            {eventInfo.timeText}
          </span>
        </div>
      </div>
    );
  };

  const calendarOptions = {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: false,
    allDaySlot: false,
    firstDay: 1, // Start on Monday
    hiddenDays: [0], // Hide Sunday
    dayHeaderFormat: { weekday: 'long' },
    slotMinTime: '08:30:00',
    slotMaxTime: '17:30:00',
    slotLabelFormat: {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
      hour12: true
    },
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
      hour12: true
    },
    events: calendarEvents,
    eventClick: handleEventClick,
    eventContent: renderEventContent,
    eventClassNames: (arg) => [arg.event.extendedProps?.isLab ? 'event-lab' : 'event-theory'],
    height: 650,
    eventDisplay: 'block'
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated([]);
    setGenerationError('');
    setLogs([]);
    setActiveEventDetail(null);

    const currentAppState = loadAppState();
    const engineName = useAI ? 'Google Gemini AI (1.5 Flash)' : 'Constraint Optimizer';
    addLog(`Initiating timetable generation for ${className} (${academicYear})...`);
    addLog(`Engine: ${engineName}`);
    addLog(`Configuration: Department = "${department}", Program = "${program}", Semester = "${semester}"`);
    console.log('[ClassMate] Current app data:', currentAppState);

    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      let result;
      if (useAI) {
        addLog('Connecting to Google Gemini AI endpoint...');
        addLog('Sending academic curriculum, faculty availability, and room capacity constraints to Gemini...');
        result = await generateAITimetable(currentAppState, {
          department,
          program,
          semester,
          preferredClass: className
        });
        if (result.aiGenerated) {
          addLog('Gemini AI successfully returned optimized conflict-free schedule matrix.');
        } else if (result.fallbackUsed) {
          addLog(`Note: ${result.aiError || 'Using local verified scheduler fallback'}.`);
        }
      } else {
        addLog('Extracting subject requirements and faculty availability...');
        result = generateTimetable(currentAppState, {
          department,
          program,
          semester,
          preferredClass: className
        });
      }

      console.log('[ClassMate] Timetable Generation Result:', result);

      if (!result.success) {
        addLog(`Generation unsuccessful: ${result.reason}`);
        setGenerationError(result.reason || 'Unable to generate a valid timetable.');
        setGenerated([]);
        return;
      }

      const finalEntries = result.entries;
      addLog(`Allocated ${finalEntries.length} timetable sessions. Running final conflict validation...`);

      const finalValidation = detectConflicts(finalEntries, currentAppState);
      console.log('[ClassMate] Conflict Validation Result:', finalValidation);

      if (!finalValidation.valid) {
        addLog(`Validation alert: ${finalValidation.hardConflicts.length} hard conflicts detected.`);
        setGenerationError('GENERATION FAILED: hard conflicts remain after scheduling.');
        setGenerated(finalEntries);
        return;
      }

      addLog(`Validation passed! 0 hard conflicts found. Quality Score: ${result.score || 100}%. Saving timetable...`);
      setGenerated(finalEntries);
      saveAppState({
        ...currentAppState,
        generatedTimetable: finalEntries,
        lastGeneratedClass: className,
        lastGeneration: {
          generatedAt: new Date().toISOString(),
          success: true,
          score: result.score,
          stats: result.statistics,
          aiPowered: Boolean(useAI)
        }
      });
      addLog('Timetable saved to app state.');
    } catch (error) {
      console.error('[ClassMate] Generation Error:', error);
      const errMsg = error instanceof Error ? error.message : 'Unable to generate the timetable.';
      addLog(`Error during execution: ${errMsg}`);
      setGenerationError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-page">
      {/* Generation Config Card - Hidden on Print */}
      <div className="card shadow-sm border-0 mb-4 no-print">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="mb-0">Generate Timetable</h4>
                {useAI && (
                  <span className="badge bg-gradient bg-primary d-inline-flex align-items-center gap-1">
                    <Sparkles size={12} /> Gemini AI Powered
                  </span>
                )}
              </div>
              <p className="text-muted mb-0">Generate a conflict-free timetable from the configured academic data.</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="gemini-ai-toggle"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-dark" htmlFor="gemini-ai-toggle">
                  AI Scheduling Mode
                </label>
              </div>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                {useAI ? <Sparkles size={16} className="me-2" /> : <Play size={16} className="me-2" />}
                {loading ? 'AI Generating...' : 'Generate Timetable'}
              </button>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="timetable-class">Class</label>
              <select id="timetable-class" className="form-select" value={className} disabled={loading} onChange={(event) => handleClassChange(event.target.value)}>
                {availableClasses.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="department">Department</label>
              <input id="department" className="form-control" value={department} onChange={(event) => setDepartment(event.target.value)} disabled={loading} />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="academic-year">Academic Year</label>
              <select id="academic-year" className="form-select" value={academicYear} disabled={loading} onChange={(event) => setAcademicYear(event.target.value)}>
                <option>2026-2027</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="program">Program</label>
              <input id="program" className="form-control" value={program} onChange={(event) => setProgram(event.target.value)} disabled={loading} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="semester">Semester</label>
              <input id="semester" className="form-control" value={semester} onChange={(event) => setSemester(event.target.value)} disabled={loading} />
            </div>

            {selectedClass && (
              <div className="col-12 text-muted small">
                {selectedClass.department || department} · {selectedClass.semester || semester} · {selectedClass.studentCount || 0} students
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <div className="mt-4 p-3 bg-dark text-light rounded font-monospace small" style={{ maxHeight: 180, overflowY: 'auto' }}>
              <div className="fw-bold text-info mb-1">Execution Console Log:</div>
              {logs.map((log, idx) => (
                <div key={idx} className="py-0">{log}</div>
              ))}
            </div>
          )}

          {generationError && !loading && <div className="mt-4 alert alert-danger">{generationError}</div>}

          {generated.length > 0 && !loading && (
            validation.hardConflicts.length === 0 ? (
              <div className="mt-4 alert alert-success d-flex align-items-center gap-2">
                <CheckCircle size={18} /> Timetable generated successfully! 0 hard conflicts detected ({generated.length} sessions scheduled).
              </div>
            ) : (
              <div className="mt-4 alert alert-warning d-flex align-items-center gap-2">
                <AlertTriangle size={18} /> Warning: hard conflicts still exist in this schedule.
              </div>
            )
          )}
        </div>
      </div>

      {generated.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3 no-print">
              <div>
                <h5 className="mb-1">{className} Timetable · {academicYear}</h5>
                <span className="text-muted small">
                  {generated.length} scheduled sessions · 12-Hour AM/PM schedule
                </span>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* View Switcher Toggle Buttons */}
                <div className="btn-group" role="group" aria-label="View toggle">
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={15} className="me-1" /> Weekly Grid
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('timeline')}
                  >
                    <Calendar size={15} className="me-1" /> Timeline View
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon size={15} className="me-1" /> Table View
                  </button>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => window.print()}
                  title="Print Timetable"
                >
                  <Printer size={15} className="me-1" /> Print Timetable
                </button>

                {/* Direct Open in Full Calendar Page */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate('/timetable')}
                  title="Open in full Interactive Timetable Calendar"
                >
                  <ExternalLink size={15} className="me-1" /> Open Full Timetable
                </button>
              </div>
            </div>

            {/* Active Event Detail Popover if clicked */}
            {activeEventDetail && (
              <div className="alert alert-info py-2 px-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm border-info no-print">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <span className="fw-bold fs-6">{activeEventDetail.title}</span>
                  <span className="badge bg-secondary">{activeEventDetail.day}</span>
                  <span className="d-flex align-items-center gap-1 small text-dark">
                    <Clock size={14} className="text-primary" /> {activeEventDetail.time}
                  </span>
                  <span className="d-flex align-items-center gap-1 small text-dark">
                    <User size={14} className="text-primary" /> {activeEventDetail.faculty}
                  </span>
                  <span className="d-flex align-items-center gap-1 small text-dark">
                    <MapPin size={14} className="text-primary" /> {activeEventDetail.room}
                  </span>
                  {activeEventDetail.isLab && (
                    <span className="badge bg-info text-dark">Lab Session</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  aria-label="Close"
                  onClick={() => setActiveEventDetail(null)}
                />
              </div>
            )}

            {/* Printable Timetable Area */}
            <div className="printable-timetable-wrapper">
              {/* Print-Only Header */}
              <div className="print-only-header">
                <h3 className="mb-0 fw-bold">ClassMate · College Academic Timetable</h3>
                <p className="mb-1 text-muted" style={{ fontSize: '11pt' }}>
                  <strong>Department:</strong> {department} &nbsp;|&nbsp;
                  <strong>Class:</strong> {className} &nbsp;|&nbsp;
                  <strong>Program:</strong> {program} &nbsp;|&nbsp;
                  <strong>Semester:</strong> {semester} &nbsp;|&nbsp;
                  <strong>Academic Year:</strong> {academicYear}
                </p>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>
                  Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="printable-timetable-area">
                {/* 1. WEEKLY ACADEMIC GRID VIEW (DEFAULT) */}
                {viewMode === 'grid' && (
                  <div>
                    <div className="d-flex align-items-center justify-content-between text-muted small mb-2 no-print">
                      <span className="d-flex align-items-center gap-1">
                        <Info size={14} className="text-primary" /> Academic Period Matrix. Click any session card for quick info.
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark border">
                          <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, background: '#4f46e5' }}></span>
                          Theory
                        </span>
                        <span className="badge bg-light text-dark border">
                          <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, background: '#0284c7' }}></span>
                          Lab Block
                        </span>
                      </div>
                    </div>
                    <WeeklyTimetableGrid
                      sessions={generated}
                      className={className}
                      onSessionClick={handleGridSessionClick}
                    />
                  </div>
                )}

                {/* 2. FULLCALENDAR TIMELINE VIEW */}
                {viewMode === 'timeline' && (
                  <div>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-2 no-print">
                      <Info size={14} className="text-primary" /> Weekly interactive timeline view (Mon – Sat). Click any session box to inspect details.
                    </div>
                    <FullCalendar {...calendarOptions} />
                  </div>
                )}

                {/* 3. TABLE VIEW */}
                {viewMode === 'table' && (
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead className="table-light">
                        <tr><th>Day</th><th>Time</th><th>Subject / Activity</th><th>Faculty</th><th>Room</th></tr>
                      </thead>
                      <tbody>
                        {generated.map((item, index) => {
                          const subject = item.subjectName || item.subject || 'Subject';
                          const faculty = item.facultyName || item.faculty || 'Faculty';
                          const room = item.roomName || item.room || 'Room';
                          const start = item.startTime || item.start || '09:00';
                          const end = item.endTime || item.end || '09:55';

                          return (
                            <tr key={`${item.day}-${start}-${subject}-${index}`}>
                              <td><span className="badge bg-light text-dark border">{item.day}</span></td>
                              <td className="fw-semibold text-primary">{format12HourRange(start, end)}</td>
                              <td>{subject}</td>
                              <td>{faculty}</td>
                              <td><span className="badge bg-secondary">{room}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastMessage message={toast} variant="info" onClose={() => setToast(null)} />}
    </div>
  );
}

export default GenerateTimetable;


