import { classList } from './classData.js';
import { facultyList } from './facultyData.js';
import { roomList } from './roomData.js';
import { subjectList } from './subjectData.js';
import { studentList } from './studentData.js';
import { slotList } from './timeSlotData.js';
import { constraintList } from './constraintData.js';

export const seedAppData = {
  faculty: facultyList,
  subjects: subjectList,
  rooms: roomList,
  classes: classList,
  students: studentList,
  timeSlots: slotList,
  constraints: constraintList,
  breaks: [],
  settings: {
    academicYear: '2026-2027',
    defaultSlots: '09:00 AM - 10:00 AM, 10:00 AM - 11:00 AM',
    notifications: true,
    theme: 'Light'
  },
  profile: {
    fullName: 'Admin User',
    email: 'admin@classmate.edu',
    department: 'Administration'
  },
  generatedTimetable: [],
  lastGeneratedClass: 'S1 MCA',
  versions: [],
  importedTimetables: []
};
