import { facultyList } from './facultyData.js';

const periods = [
  { start: '09:00', end: '09:55' },
  { start: '09:55', end: '10:50' },
  { start: '11:00', end: '11:55' },
  { start: '11:55', end: '12:45' },
  { start: '13:30', end: '14:20' },
  { start: '14:20', end: '15:10' },
  { start: '15:20', end: '16:10' }
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const facultyByCourse = {
  'S1 MCA': {
    DFCA: ['Mr. Eldhose K Paul', 'Ms. Ashwani Vijayachandran'],
    'DS LAB': ['Ms. Ashwani Vijayachandran', 'Mr. Ajesh Avirah'],
    'WP LAB': ['Mr. Eldhose K Paul', 'Mr. Ajesh Avirah'],
    ASE: ['Ms. Athira R Kurup', 'Ms. Divya S B'],
    MATHS: ['Ms. Viji V'],
    'EP&IT': ['Mr. Ajesh Avirah'],
    'PG LAB': ['Ms. Sahira Salih', 'Mr. Ajesh Avirah'],
    ADS: ['Ms. Ashwani Vijayachandran', 'Mr. Eldhose K Paul'],
    PLACEMENT: ['Ms. Athira R Kurup']
  },
  'S5 BCA': {
    'AI&ML': ['Ms. Ambily Sajeev', 'Ms. Minnu VB'],
    SPM: ['Ms. Minnu VB', 'Ms. Ambily Sajeev'],
    OR: ['Ms. Rekha PR'],
    MADL: ['Ms. Minnu VB', 'Ms. Ambily Sajeev'],
    'ML LAB': ['Ms. Ambily Sajeev', 'Ms. Minnu VB'],
    'MINI PROJECT': ['Ms. Ambily Sajeev'],
    PLACEMENT: ['Ms. Anjaly Sajeev']
  }
};

const classes = [
  {
    name: 'S1 MCA',
    department: 'Computer Applications',
    semester: 'ODD',
    room: 'N 208',
    entries: [
      [0, 1, 1, 'DFCA(T)', 'DFCA'],
      [0, 2, 2, 'DS LAB(T)', 'DS LAB'],
      [0, 3, 3, 'WP LAB(T)', 'WP LAB'],
      [0, 4, 4, 'ASE(R)', 'ASE'],
      [0, 5, 5, 'MATHS', 'MATHS'],
      [0, 6, 6, 'EP&IT', 'EP&IT'],
      [0, 7, 7, 'PG LAB(T)', 'PG LAB'],

      [1, 1, 2, 'DS LAB / MENTORING', 'DS LAB'],
      [1, 4, 4, 'ASE(T)', 'ASE'],
      [1, 5, 5, 'ADS', 'ADS'],
      [1, 6, 6, 'DFCA(R)', 'DFCA'],
      [1, 7, 7, 'MATHS', 'MATHS'],

      [2, 1, 2, 'PG LAB / MENTORING', 'PG LAB'],
      [2, 3, 3, 'ASE', 'ASE'],
      [2, 5, 5, 'MATHS(T)', 'MATHS'],
      [2, 6, 6, 'ADS', 'ADS'],
      [2, 7, 7, 'DFCA', 'DFCA'],

      [3, 1, 2, 'WP LAB / MENTORING', 'WP LAB'],
      [3, 3, 3, 'PLACEMENT', 'PLACEMENT'],
      [3, 5, 5, 'ASE', 'ASE'],
      [3, 6, 6, 'ADS(R)', 'ADS'],
      [3, 7, 7, 'DFCA', 'DFCA'],

      [4, 1, 1, 'ADS(T)', 'ADS'],
      [4, 2, 2, 'DFCA', 'DFCA'],
      [4, 3, 3, 'MATHS', 'MATHS'],
      [4, 4, 4, 'ADS', 'ADS'],
      [4, 5, 5, 'ASE', 'ASE'],
      [4, 6, 6, 'MATHS(R)', 'MATHS'],
      [4, 7, 7, 'ASE', 'ASE']
    ]
  },
  {
    name: 'S5 BCA',
    department: 'Computer Applications',
    semester: 'ODD',
    room: 'N 308',
    entries: [
      [0, 1, 1, 'AI&ML(T)', 'AI&ML'],
      [0, 2, 2, 'SPM', 'SPM'],
      [0, 3, 3, 'OR', 'OR'],
      [0, 4, 4, 'SPM(R)', 'SPM'],
      [0, 5, 6, 'MINI PROJECT / MENTORING', 'MINI PROJECT'],
      [0, 7, 7, 'MINI PROJECT / MENTORING', 'MINI PROJECT'],

      [1, 1, 1, 'OR(T)', 'OR'],
      [1, 2, 2, 'SPM', 'SPM'],
      [1, 3, 3, 'PLACEMENT / LIBRARY', 'PLACEMENT'],
      [1, 4, 4, 'AI&ML', 'AI&ML'],
      [1, 5, 6, 'MOBILE APP LAB / PROJECT', 'MADL'],
      [1, 7, 7, 'AI&ML(R)', 'AI&ML'],

      [2, 1, 1, 'MADL', 'MADL'],
      [2, 2, 2, 'AI&ML', 'AI&ML'],
      [2, 4, 4, 'SPM', 'SPM'],
      [2, 5, 5, 'PLACEMENT / MOOC', 'PLACEMENT'],
      [2, 6, 6, 'MADL', 'MADL'],
      [2, 7, 7, 'PLACEMENT', 'PLACEMENT'],

      [3, 1, 2, 'ML LAB / MENTORING', 'ML LAB'],
      [3, 3, 4, 'ML LAB / MENTORING', 'ML LAB'],
      [3, 5, 5, 'MADL(R)', 'MADL'],
      [3, 6, 6, 'OR', 'OR'],
      [3, 7, 7, 'AI&ML', 'AI&ML'],

      [4, 1, 1, 'SPM(T)', 'SPM'],
      [4, 2, 2, 'AI&ML', 'AI&ML'],
      [4, 3, 3, 'MADL', 'MADL'],
      [4, 4, 4, 'OR(R)', 'OR'],
      [4, 5, 6, 'MINI PROJECT / MENTORING', 'MINI PROJECT'],
      [4, 7, 7, 'MINI PROJECT / MENTORING', 'MINI PROJECT']
    ]
  }
];

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function overlaps(first, second) {
  return first.dayIndex === second.dayIndex
    && first.startMinutes < second.endMinutes
    && second.startMinutes < first.endMinutes;
}

function hasResourceConflict(first, second) {
  return first.className === second.className
    || first.room === second.room
    || first.faculty === second.faculty;
}

function makeSessions() {
  const facultyNames = new Set(facultyList.map((faculty) => faculty.name));
  const missingFaculty = [...new Set(Object.values(facultyByCourse).flatMap((courses) => (
    Object.values(courses).flat()
  )))].filter((name) => !facultyNames.has(name));

  if (missingFaculty.length > 0) {
    throw new Error(`Faculty missing from Faculty Management: ${missingFaculty.join(', ')}.`);
  }

  const sessions = classes.flatMap((classData) => classData.entries.map(
    ([dayIndex, firstPeriod, lastPeriod, subject, course]) => {
      const start = periods[firstPeriod - 1].start;
      const end = periods[lastPeriod - 1].end;
      const facultyOptions = facultyByCourse[classData.name][course];

      if (!facultyOptions) {
        throw new Error(`No faculty mapping was provided for ${course} in ${classData.name}.`);
      }

      const isLab = String(subject || '').toLowerCase().includes('lab') || String(course || '').toLowerCase().includes('lab') || String(course || '').toLowerCase().includes('madl');
      const assignedRoom = isLab ? (classData.name === 'S1 MCA' ? 'Lab 1' : 'Lab 2') : classData.room;

      return {
        className: classData.name,
        department: classData.department,
        semester: classData.semester,
        room: assignedRoom,
        dayIndex,
        day: days[dayIndex],
        start,
        end,
        startMinutes: toMinutes(start),
        endMinutes: toMinutes(end),
        subject,
        facultyOptions
      };
    }
  ));

  sessions.sort((first, second) => (
    first.dayIndex - second.dayIndex
    || first.startMinutes - second.startMinutes
    || first.className.localeCompare(second.className)
  ));

  for (const session of sessions) {
    const availableFaculty = session.facultyOptions.find((faculty) => (
      !sessions.some((other) => (
        other.faculty === faculty
        && overlaps(session, other)
      ))
    ));

    if (!availableFaculty) {
      throw new Error(
        `No conflict-free faculty is available for ${session.className} ${session.subject} on ${session.day} at ${session.start}.`
      );
    }

    session.faculty = availableFaculty;
  }

  return sessions;
}

export function getSourceTimetableConflicts() {
  const sessions = makeSessions();
  const conflicts = [];

  for (let index = 0; index < sessions.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < sessions.length; nextIndex += 1) {
      const first = sessions[index];
      const second = sessions[nextIndex];
      if (overlaps(first, second) && hasResourceConflict(first, second)) {
        const type = first.className === second.className
          ? 'Class Conflict'
          : first.room === second.room
            ? 'Room Conflict'
            : 'Faculty Conflict';
        conflicts.push({
          id: `${first.className}-${second.className}-${first.day}-${first.start}`,
          type,
          detail: type === 'Class Conflict' ? first.className : type === 'Room Conflict' ? first.room : first.faculty,
          time: `${first.day} ${first.start}–${first.end}`,
          classes: `${first.className} / ${second.className}`,
          status: 'Conflict'
        });
      }
    }
  }

  return conflicts;
}

export const sourceTimetableClasses = classes.map(({ name, department, semester, room }) => ({
  name,
  department,
  semester,
  room
}));

export const sourceTimetableNotes = [
  'Saturday remedial, SDP, department activities and MOOC course are shown without a time in the source, so they are not assigned a timed slot.',
  'The S5 BCA Tuesday afternoon grid has overlapping/unclear labels in the photo. Only the legible MOBILE APP LAB / PROJECT and AI&ML(R) periods are scheduled; verify this row against the original timetable.'
];

export function generateSourceTimetable(className) {
  const classData = sourceTimetableClasses.find((item) => item.name === className);
  if (!classData) {
    throw new Error(`No timetable input was found for ${className}.`);
  }

  return makeSessions()
    .filter((session) => session.className === className)
    .map(({ facultyOptions, startMinutes, endMinutes, dayIndex, ...session }) => session);
}

export function validateSourceTimetables() {
  const conflicts = getSourceTimetableConflicts();
  if (conflicts.length > 0) {
    throw new Error(`Schedule conflicts were found: ${conflicts.map((item) => item.time).join(', ')}.`);
  }
  return true;
}

export function getAllSourceTimetableSessions() {
  return makeSessions().map(({ facultyOptions, startMinutes, endMinutes, ...session }) => session);
}
