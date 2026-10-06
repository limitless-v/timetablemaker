import { describe, it, expect } from 'vitest';
import { detectConflicts } from './conflictService.js';
import { repairTimetable } from './timetableRepairService.js';

const appData = {
  classes: [
    { id: 'A', name: 'Class A', studentCount: 30 },
    { id: 'B', name: 'Class B', studentCount: 30 }
  ],
  faculty: [
    { id: 'F1', name: 'Faculty A' },
    { id: 'F2', name: 'Faculty B' }
  ],
  rooms: [
    { id: 'R1', name: 'Room 101', capacity: 50, type: 'Classroom' },
    { id: 'R2', name: 'Room 102', capacity: 50, type: 'Classroom' }
  ],
  subjects: [
    { id: 'S1', name: 'Subject A', facultyIds: ['F1'], duration: 1 },
    { id: 'S2', name: 'Subject B', facultyIds: ['F1'], duration: 1 }
  ],
  timeSlots: [
    { day: 'Monday', startTime: '09:00', endTime: '09:55' },
    { day: 'Monday', startTime: '09:55', endTime: '10:50' },
    { day: 'Monday', startTime: '11:00', endTime: '11:55' }
  ],
  breaks: []
};

describe('repair workflow validation', () => {
  it('independently proves repaired entries have zero hard conflicts', () => {
    const entries = [
      { id: 'e1', classId: 'A', subjectId: 'S1', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' },
      { id: 'e2', classId: 'B', subjectId: 'S2', facultyId: 'F1', roomId: 'R1', day: 'Monday', startTime: '09:00', endTime: '09:55' }
    ];

    const repairResult = repairTimetable(entries, appData);
    const validation = detectConflicts(repairResult.repairedEntries, appData);

    expect(repairResult.success).toBe(true);
    expect(validation.hardConflicts.length).toBe(0);
  });
});
