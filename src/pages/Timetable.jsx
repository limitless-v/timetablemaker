import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Filter, CalendarDays, Printer, ChevronLeft, ChevronRight, Grid, Calendar, Clock, MapPin, User, Info } from 'lucide-react';
import ToastMessage from '../components/ToastMessage.jsx';
import WeeklyTimetableGrid from '../components/WeeklyTimetableGrid.jsx';
import { loadAppState } from '../services/storageService.js';
import { format12HourRange } from '../utils/timeUtils.js';

const dayIndexMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function Timetable() {
  const appState = loadAppState();
  const [department, setDepartment] = useState('All');
  const [className, setClassName] = useState('All');
  const [faculty, setFaculty] = useState('All');
  const [toast, setToast] = useState(null);
  const [calendarRef, setCalendarRef] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
  const [activeEventDetail, setActiveEventDetail] = useState(null);

  const departments = useMemo(() => ['All', ...new Set((appState.classes || []).map((item) => item.department).filter(Boolean))], [appState.classes]);
  const classOptions = useMemo(() => ['All', ...new Set((appState.classes || []).map((item) => item.name))], [appState.classes]);
  const facultyOptions = useMemo(() => ['All', ...new Set((appState.faculty || []).map((item) => item.name))], [appState.faculty]);

  // Filtered raw sessions
  const filteredSessions = useMemo(() => {
    return (appState.generatedTimetable || []).filter((session) => {
      const sessionClass = session.className || session.class || '';
      const sessionFaculty = session.facultyName || session.faculty || '';
      const sessionDept = session.department || (appState.classes || []).find((c) => c.name === sessionClass)?.department || '';

      const matchDept = department === 'All' || sessionDept === department;
      const matchClass = className === 'All' || sessionClass === className;
      const matchFaculty = faculty === 'All' || sessionFaculty === faculty;

      return matchDept && matchClass && matchFaculty;
    });
  }, [appState, department, className, faculty]);

  const timetableEvents = useMemo(() => filteredSessions.map((session, index) => {
    const subjectName = session.subjectName || session.subject || 'Session';
    const facultyName = session.facultyName || session.faculty || 'Faculty';
    const roomName = session.roomName || session.room || 'Room';
    const classNameValue = session.className || session.class || 'Class';
    const departmentName = session.department || (appState.classes || []).find((item) => item.name === classNameValue)?.department || 'Department';
    const dayIndex = dayIndexMap[session.day] ?? 1;
    const isLab = subjectName.toLowerCase().includes('lab');

    return {
      id: String(index + 1),
      title: subjectName,
      daysOfWeek: [dayIndex],
      startTime: (session.startTime || session.start || '09:00'),
      endTime: (session.endTime || session.end || '09:55'),
      extendedProps: {
        faculty: facultyName,
        room: roomName,
        className: classNameValue,
        department: departmentName,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        isLab
      }
    };
  }), [filteredSessions, appState]);

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
    const { faculty: facultyProp, room, isLab } = eventInfo.event.extendedProps || {};
    return (
      <div className="p-1 h-100 d-flex flex-column justify-content-between overflow-hidden" style={{ fontSize: '0.78rem', lineHeight: 1.25 }}>
        <div>
          <div className="fw-bold text-truncate" title={eventInfo.event.title}>
            {eventInfo.event.title}
          </div>
          {facultyProp && (
            <div className="text-truncate opacity-80 small" style={{ fontSize: '0.7rem' }}>
              👤 {facultyProp}
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
    firstDay: 1,
    hiddenDays: [0],
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
    events: timetableEvents,
    eventClick: handleEventClick,
    eventContent: renderEventContent,
    height: 700,
    eventDisplay: 'block',
    eventClassNames: (arg) => [arg.event.extendedProps?.isLab ? 'event-lab' : 'event-theory']
  };

  return (
    <div className="timetable-page">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          {/* Top Controls Toolbar - Hidden during print */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 no-print">
            <div>
              <h4 className="mb-1">Weekly Timetable</h4>
              <p className="text-muted mb-0">View and inspect the college master timetable.</p>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* View toggle */}
              <div className="btn-group" role="group" aria-label="Timetable view">
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
              </div>

              {viewMode === 'timeline' && (
                <>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef?.getApi().today()}>
                    <CalendarDays size={15} className="me-1" /> Today
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef?.getApi().prev()}>
                    <ChevronLeft size={15} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => calendarRef?.getApi().next()}>
                    <ChevronRight size={15} />
                  </button>
                </>
              )}

              <button
                className="btn btn-sm btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={15} className="me-1" /> Print Timetable
              </button>
            </div>
          </div>

          {/* Filter Dropdowns - Hidden during print */}
          <div className="row g-3 mb-4 no-print">
            <div className="col-md-4">
              <label className="form-label">Department</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Class</label>
              <select className="form-select" value={className} onChange={(e) => setClassName(e.target.value)}>
                {classOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Faculty</label>
              <select className="form-select" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
                {facultyOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

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

          {/* Printable Timetable Area wrapped in strict print wrapper */}
          <div className="printable-timetable-wrapper">
            {/* Print-Only Professional Header */}
            <div className="print-only-header">
              <h3 className="mb-0 fw-bold">ClassMate · College Academic Timetable</h3>
              <p className="mb-1 text-muted" style={{ fontSize: '11pt' }}>
                <strong>Department:</strong> {department === 'All' ? 'All Departments' : department} &nbsp;|&nbsp;
                <strong>Class:</strong> {className === 'All' ? 'All Classes' : className} &nbsp;|&nbsp;
                <strong>Faculty:</strong> {faculty === 'All' ? 'All Faculty' : faculty} &nbsp;|&nbsp;
                <strong>Academic Year:</strong> {appState.settings?.academicYear || '2026-2027'}
              </p>
              <div style={{ fontSize: '8pt', color: '#64748b' }}>
                Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="printable-timetable-area">
              {viewMode === 'grid' ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between text-muted small mb-2 no-print">
                    <span className="d-flex align-items-center gap-1">
                      <Info size={14} className="text-primary" /> Displaying {filteredSessions.length} sessions across periods. Click any card for details.
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
                    sessions={filteredSessions}
                    className={className}
                    onSessionClick={handleGridSessionClick}
                  />
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center gap-2 text-muted mb-3 small no-print">
                    <Filter size={15} className="text-primary" /> Interactive weekly timeline. Click an event for details.
                  </div>
                  <FullCalendar ref={(node) => setCalendarRef(node)} {...calendarOptions} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <ToastMessage message={toast} variant="info" onClose={() => setToast(null)} />}
    </div>
  );
}

export default Timetable;



