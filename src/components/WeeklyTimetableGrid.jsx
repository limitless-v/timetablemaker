import React, { useMemo } from 'react';
import { format12HourRange } from '../utils/timeUtils.js';
import { BookOpen, Laptop, User, MapPin, Coffee, Utensils, Sparkles } from 'lucide-react';

const DEFAULT_PERIODS = [
  { id: 1, label: 'Period 1', start: '09:00', end: '09:55' },
  { id: 2, label: 'Period 2', start: '09:55', end: '10:50' },
  { id: 'tea', label: 'Tea Break', start: '10:50', end: '11:00', isBreak: true, icon: 'tea' },
  { id: 3, label: 'Period 3', start: '11:00', end: '11:55' },
  { id: 4, label: 'Period 4', start: '11:55', end: '12:45' },
  { id: 'lunch', label: 'Lunch Break', start: '12:45', end: '13:30', isBreak: true, icon: 'lunch' },
  { id: 5, label: 'Period 5', start: '13:30', end: '14:20' },
  { id: 6, label: 'Period 6', start: '14:20', end: '15:10' },
  { id: 'break2', label: 'Break', start: '15:10', end: '15:20', isBreak: true, icon: 'tea' },
  { id: 7, label: 'Period 7', start: '15:20', end: '16:10' }
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to convert "HH:MM" to minutes for interval overlap matching
function toMin(timeStr = '') {
  const [h, m] = String(timeStr).trim().split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function WeeklyTimetableGrid({ sessions = [], className = '', onSessionClick }) {
  // Deduce days present in sessions (fallback to standard Mon-Fri)
  const days = useMemo(() => {
    const sessionDays = [...new Set(sessions.map((s) => s.day).filter(Boolean))];
    const ordered = WEEK_DAYS.filter((d) => sessionDays.includes(d));
    if (sessionDays.includes('Saturday') && !ordered.includes('Saturday')) {
      ordered.push('Saturday');
    }
    return ordered.length > 0 ? ordered : WEEK_DAYS;
  }, [sessions]);

  // Color mapping based on subject characteristics
  const getCardStyle = (subject = '', type = '') => {
    const subLower = subject.toLowerCase();
    const typeLower = (type || '').toLowerCase();

    if (subLower.includes('lab') || typeLower.includes('lab')) {
      return {
        bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '#0284c7',
        text: '#0369a1',
        badgeBg: '#0284c7',
        badgeText: '#ffffff',
        tag: 'LAB'
      };
    }
    if (subLower.includes('placement') || subLower.includes('project') || subLower.includes('mentor')) {
      return {
        bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '#16a34a',
        text: '#15803d',
        badgeBg: '#16a34a',
        badgeText: '#ffffff',
        tag: 'ACTIVITY'
      };
    }
    if (subLower.includes('(t)') || subLower.includes('tutorial')) {
      return {
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '#d97706',
        text: '#b45309',
        badgeBg: '#d97706',
        badgeText: '#ffffff',
        tag: 'TUTORIAL'
      };
    }
    if (subLower.includes('(r)') || subLower.includes('remedial')) {
      return {
        bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        border: '#db2777',
        text: '#be185d',
        badgeBg: '#db2777',
        badgeText: '#ffffff',
        tag: 'REMEDIAL'
      };
    }
    // Default Core Lecture
    return {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '#6366f1',
      text: '#4338ca',
      badgeBg: '#4f46e5',
      badgeText: '#ffffff',
      tag: 'CORE'
    };
  };

  return (
    <div className="weekly-grid-container table-responsive rounded-4 border bg-white shadow-sm p-3">
      <table className="table table-bordered align-middle mb-0 text-center" style={{ minWidth: 980 }}>
        <thead>
          <tr className="bg-light text-dark">
            <th style={{ width: 110, background: '#1e293b', color: '#fff' }} className="py-3 fw-bold align-middle">
              Day / Period
            </th>
            {DEFAULT_PERIODS.map((period) => (
              <th
                key={period.id}
                style={{
                  background: period.isBreak ? '#f8fafc' : '#f1f5f9',
                  color: period.isBreak ? '#64748b' : '#1e293b',
                  fontSize: '0.85rem',
                  minWidth: period.isBreak ? 55 : 120
                }}
                className="py-2 align-middle"
              >
                <div className="fw-bold">{period.label}</div>
                <div className="small text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                  {format12HourRange(period.start, period.end)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const daySessions = sessions.filter((s) => s.day === day);
            const renderedSlots = [];

            // We iterate over the periods and build cells
            for (let i = 0; i < DEFAULT_PERIODS.length; i++) {
              const period = DEFAULT_PERIODS[i];

              if (period.isBreak) {
                renderedSlots.push(
                  <td
                    key={`${day}-${period.id}`}
                    style={{
                      background: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px)',
                      color: '#94a3b8',
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '4px 2px'
                    }}
                    className="align-middle text-uppercase"
                  >
                    <div className="d-flex align-items-center justify-content-center gap-1 mx-auto">
                      {period.icon === 'lunch' ? <Utensils size={12} /> : <Coffee size={12} />}
                      <span>{period.label}</span>
                    </div>
                  </td>
                );
                continue;
              }

              const pStartMin = toMin(period.start);
              const pEndMin = toMin(period.end);

              // Find session that overlaps with this period
              const session = daySessions.find((s) => {
                const sStart = toMin(s.startTime || s.start);
                const sEnd = toMin(s.endTime || s.end);
                return sStart < pEndMin && sEnd > pStartMin;
              });

              if (!session) {
                // Free slot
                renderedSlots.push(
                  <td key={`${day}-${period.id}`} className="p-2 align-middle bg-light bg-opacity-25">
                    <div className="text-muted small opacity-50 fst-italic" style={{ fontSize: '0.75rem' }}>
                      — Free —
                    </div>
                  </td>
                );
                continue;
              }

              // Check if session started in an earlier period (to avoid rendering twice for multi-period slots)
              const sStart = toMin(session.startTime || session.start);
              if (sStart < pStartMin - 5) {
                // Already rendered with colSpan from earlier period, skip
                continue;
              }

              // Check if this session spans across to the next consecutive period
              const sEnd = toMin(session.endTime || session.end);
              let colSpan = 1;
              const nextPeriod = DEFAULT_PERIODS[i + 1];
              if (nextPeriod && !nextPeriod.isBreak && sEnd > toMin(nextPeriod.start) + 15) {
                colSpan = 2;
                i++; // advance loop to skip next period
              }

              const subjectName = session.subjectName || session.subject || 'Subject';
              const facultyName = session.facultyName || session.faculty || 'Faculty';
              const roomName = session.roomName || session.room || 'Room';
              const style = getCardStyle(subjectName, session.type);
              const isLab = style.tag === 'LAB';

              renderedSlots.push(
                <td
                  key={`${day}-${session.startTime}-${session.subject}`}
                  colSpan={colSpan}
                  className="p-1 align-middle"
                  style={{ verticalAlign: 'middle' }}
                >
                  <div
                    onClick={() => onSessionClick && onSessionClick(session)}
                    className="h-100 rounded-3 p-2 text-start transition-all cursor-pointer shadow-sm border"
                    style={{
                      background: style.bg,
                      borderColor: style.border,
                      borderLeftWidth: 4,
                      minHeight: 88,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span
                        className="badge px-1 py-0 fw-semibold"
                        style={{
                          background: style.badgeBg,
                          color: style.badgeText,
                          fontSize: '0.65rem'
                        }}
                      >
                        {colSpan > 1 ? `2-HOUR ${style.tag}` : style.tag}
                      </span>
                      <span className="badge bg-white text-dark border px-1 py-0 fw-normal" style={{ fontSize: '0.68rem' }}>
                        <MapPin size={10} className="me-1 text-secondary d-inline" />
                        {roomName}
                      </span>
                    </div>

                    <div
                      className="fw-bold text-truncate mb-1"
                      style={{ color: '#0f172a', fontSize: '0.84rem' }}
                      title={subjectName}
                    >
                      {isLab ? <Laptop size={13} className="me-1 text-primary d-inline" /> : <BookOpen size={13} className="me-1 text-indigo d-inline" />}
                      {subjectName}
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-1 border-top border-light border-opacity-75">
                      <span className="small text-truncate text-muted d-flex align-items-center" style={{ fontSize: '0.72rem', maxWidth: 120 }} title={facultyName}>
                        <User size={11} className="me-1 text-muted" />
                        {facultyName}
                      </span>
                      <span className="text-muted fw-semibold" style={{ fontSize: '0.68rem' }}>
                        {format12HourRange(session.startTime || period.start, session.endTime || period.end)}
                      </span>
                    </div>
                  </div>
                </td>
              );
            }

            return (
              <tr key={day}>
                <td style={{ background: '#0f172a', color: '#f8fafc' }} className="fw-bold align-middle py-3">
                  <div className="text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.85rem' }}>
                    {day}
                  </div>
                  <div className="small text-muted fw-normal" style={{ fontSize: '0.7rem' }}>
                    {daySessions.length} Classes
                  </div>
                </td>
                {renderedSlots}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default WeeklyTimetableGrid;
