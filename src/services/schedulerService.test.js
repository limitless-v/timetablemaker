import { describe, it, expect } from 'vitest';
import { detectConflicts } from './conflictService.js';
import { generateTimetable } from './schedulerService.js';
import { repairTimetable } from './timetableRepairService.js';

const baseData = {
  classes: [
    { id: 'A', name: 'Class A', studentCount: 30 },
    { id: 'B', name: 'Class B', studentCount: 35 }
  ],
  faculty: [
    { id: 'F1', name: 'Faculty A' },
    { id: 'F2', name: 'Faculty B' }
  ],
  rooms: [
    { id: 'R1', name: 'Room 101', capacity: 50, type: 'Classroom' },
    { id: 'R2', name: 'Room 102', capacity: 50, type: 'Classroom' },
    { id: 'LAB1', name: 'Lab 1', capacity: 80, type: 'Lab', isLab: true }
  ],
  subjects: [
    { id: 'S1', name: 'Subject A', facultyIds: ['F1'], duration: 1, requiresLab: false },
    { id: 'S2', name: 'Subject B', facultyIds: ['F2'], duration: 1, requiresLab: false },
    { id: 'LAB', name: 'Lab Subject', facultyIds: ['F1'], duration: 2, requiresLab: true }
  ],
  timeSlots: [
    { day: 'Monday', startTime: '09:00', endTime: '09:55' },
    { day: 'Monday', startTime: '09:55', endTime: '10:50' },
    { day: 'Monday', startTime: '11:00', endTime: '11:55' },
    { day: 'Tuesday', startTime: '09:00', endTime: '09:55' },
    { day: 'Tuesday', startTime: '09:55', endTime: '10:50' },
    { day: 'Tuesday', startTime: '11:00', endTime: '11:55' }
  ],
  breaks: [{ id: 'break-1', day: 'Monday', startTime: '10:50', endTime: '11:00' }]
};

describe('ClassMate scheduling and conflict validation', () => {
  it('detects faculty overlap', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F1', roomId: 'R2', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.hardConflicts.some((item) => item.type === 'FACULTY_OVERLAP')).toBe(true);
  });

  it('detects room overlap', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F2', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.hardConflicts.some((item) => item.type === 'ROOM_OVERLAP')).toBe(true);
  });

  it('detects class overlap', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'A', subjectId: 'S2', facultyId: 'F2', roomId: 'R2', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.hardConflicts.some((item) => item.type === 'CLASS_OVERLAP')).toBe(true);
  });

  it('detects room capacity conflict', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];
    const appData = {
      ...baseData,
      classes: [{ id: 'A', name: 'Class A', studentCount: 80 }],
      rooms: [{ id: 'R1', name: 'Room 101', capacity: 50, type: 'Classroom' }]
    };

    const validation = detectConflicts(entries, appData);
    expect(validation.hardConflicts.some((item) => item.type === 'ROOM_CAPACITY')).toBe(true);
  });

  it('requires a lab room for lab subject', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'LAB', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '10:50' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.hardConflicts.some((item) => item.type === 'ROOM_TYPE')).toBe(true);
  });

  it('detects break violation', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '10:50', endTime: '11:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.hardConflicts.some((item) => item.type === 'BREAK_VIOLATION')).toBe(true);
  });

  it('detects unavailable faculty', () => {
    const appData = {
      ...baseData,
      faculty: [{ id: 'F1', name: 'Faculty A', availability: ['Tuesday'] }]
    };

    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, appData);
    expect(validation.hardConflicts.some((item) => item.type === 'FACULTY_UNAVAILABLE')).toBe(true);
  });

  it('detects unavailable room', () => {
    const appData = {
      ...baseData,
      rooms: [{ id: 'R1', name: 'Room 101', capacity: 50, type: 'Classroom', availability: ['Tuesday'] }]
    };

    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, appData);
    expect(validation.hardConflicts.some((item) => item.type === 'ROOM_UNAVAILABLE')).toBe(true);
  });

  it('accepts a valid timetable without conflicts', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F2', roomId: 'R2', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.valid).toBe(true);
  });

  it('rejects impossible timetable with no valid assembly', () => {
    const impossibleData = {
      classes: [{ id: 'A', name: 'Class A', studentCount: 30 }, { id: 'B', name: 'Class B', studentCount: 30 }, { id: 'C', name: 'Class C', studentCount: 30 }],
      faculty: [{ id: 'F1', name: 'Faculty A' }],
      rooms: [{ id: 'R1', name: 'Room 101', capacity: 50, type: 'Classroom' }],
      subjects: [
        { id: 'S1', name: 'Subject 1', facultyIds: ['F1'], duration: 1 },
        { id: 'S2', name: 'Subject 2', facultyIds: ['F1'], duration: 1 },
        { id: 'S3', name: 'Subject 3', facultyIds: ['F1'], duration: 1 }
      ],
      timeSlots: [{ day: 'Monday', startTime: '09:00', endTime: '09:55' }],
      breaks: []
    };

    const result = generateTimetable(impossibleData, { className: 'Class A' });
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/impossible|Unable to generate/i);
  });

  it('repairs a conflict by moving one session to another valid slot', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const repairResult = repairTimetable(entries, baseData);
    expect(repairResult.success).toBe(true);
    expect(detectConflicts(repairResult.repairedEntries, baseData).hardConflicts.length).toBe(0);
  });

  it('allows simultaneous classes in different valid rooms', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F2', roomId: 'R2', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    expect(detectConflicts(entries, baseData).valid).toBe(true);
  });

  it('keeps lab sessions in consecutive periods in a valid lab room', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'LAB', facultyId: 'F1', roomId: 'LAB1', day: 'Monday', startTime: '09:00', endTime: '10:50' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F2', roomId: 'R2', day: 'Monday', startTime: '11:00', endTime: '11:55' }
    ];

    const validation = detectConflicts(entries, baseData);
    expect(validation.valid).toBe(true);
  });

  it('does not allow break overlap', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '10:50', endTime: '11:55' }
    ];

    expect(detectConflicts(entries, baseData).hardConflicts.some((item) => item.type === 'BREAK_VIOLATION')).toBe(true);
  });
});
