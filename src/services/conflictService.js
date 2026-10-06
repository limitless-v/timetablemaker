import { timeToMinutes } from '../utils/timeUtils.js';

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function normalizeEntry(entry, index, appData) {
  const classes = appData.classes || [];
  const faculty = appData.faculty || [];
  const rooms = appData.rooms || [];
  const subjects = appData.subjects || [];

  const classItem = classes.find((item) => String(item.id) === String(entry.classId ?? entry.class_id ?? entry.classNameId ?? '')) || classes.find((item) => item.name === entry.className || item.name === entry.class);
  const facultyItem = faculty.find((item) => String(item.id) === String(entry.facultyId ?? entry.faculty_id ?? '')) || faculty.find((item) => item.name === entry.faculty || item.name === entry.facultyName);
  const roomItem = rooms.find((item) => String(item.id) === String(entry.roomId ?? entry.room_id ?? '')) || rooms.find((item) => item.name === entry.room || item.name === entry.roomName || item.number === entry.room || item.number === entry.roomNumber);
  const subjectItem = subjects.find((item) => String(item.id) === String(entry.subjectId ?? entry.subject_id ?? entry.subjectCode ?? '')) || subjects.find((item) => item.code === entry.subjectCode || item.name === entry.subject || item.name === entry.subjectName);

  const startTime = entry.startTime || entry.start || '09:00';
  const endTime = entry.endTime || entry.end || '09:55';

  return {
    ...entry,
    id: entry.id || `entry-${index + 1}`,
    classId: classItem ? classItem.id : entry.classId ?? entry.class_id ?? null,
    facultyId: facultyItem ? facultyItem.id : entry.facultyId ?? entry.faculty_id ?? null,
    roomId: roomItem ? roomItem.id : entry.roomId ?? entry.room_id ?? null,
    subjectId: subjectItem ? subjectItem.id : entry.subjectId ?? entry.subject_id ?? entry.subjectCode ?? null,
    day: entry.day || 'Monday',
    startTime,
    endTime,
    startMinutes: timeToMinutes(startTime),
    endMinutes: timeToMinutes(endTime)
  };
}

function resolveClassName(entry, appData) {
  const classItem = (appData.classes || []).find((item) => String(item.id) === String(entry.classId));
  return classItem ? classItem.name : entry.className || entry.class || entry.classId || 'Unknown class';
}

function resolveFacultyName(entry, appData) {
  const facultyItem = (appData.faculty || []).find((item) => String(item.id) === String(entry.facultyId));
  return facultyItem ? facultyItem.name : entry.faculty || entry.facultyName || entry.facultyId || 'Unassigned';
}

function resolveRoomName(entry, appData) {
  const roomItem = (appData.rooms || []).find((item) => String(item.id) === String(entry.roomId));
  return roomItem ? roomItem.name : entry.room || entry.roomName || entry.roomId || 'Unassigned';
}

function addConflict(conflicts, type, severity, message, entryIds, day, startTime, endTime, classId, facultyId, roomId) {
  conflicts.push({
    id: `${type}-${entryIds.join('-')}-${day}-${startTime}`,
    type,
    severity,
    message,
    entryIds,
    day,
    startTime,
    endTime,
    classId,
    facultyId,
    roomId,
    resolvable: true
  });
}

function hasDayMatch(availability, day) {
  if (!availability) return true;

  const values = toArray(availability);
  const dayName = String(day).toLowerCase();
  const placeholderPattern = /(see source timetable|not provided|n\/a|all days|every day|daily|weekday|weekdays)/i;
  const dayAliases = {
    mon: 'monday',
    tue: 'tuesday',
    wed: 'wednesday',
    thu: 'thursday',
    fri: 'friday',
    sat: 'saturday',
    sun: 'sunday'
  };

  return values.some((value) => {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (placeholderPattern.test(normalized)) return true;

      if (normalized.includes(dayName)) return true;
      const aliasMatch = Object.entries(dayAliases).some(([alias, fullDay]) => normalized.includes(alias) && dayName === fullDay);
      if (aliasMatch) return true;
      return normalized.includes(`${dayName.slice(0, 3)}`);
    }

    if (typeof value === 'object') {
      return value.day === day || String(value).toLowerCase().includes(String(day).toLowerCase());
    }
    return false;
  });
}

function collectBreaks(appData) {
  const breaksFromData = Array.isArray(appData.breaks) ? appData.breaks : [];
  if (breaksFromData.length > 0) {
    return breaksFromData.filter((b) => b && (b.startTime || b.start) && (b.endTime || b.end)).map((b) => ({
      day: b.day || 'Monday',
      startTime: b.startTime || b.start,
      endTime: b.endTime || b.end
    }));
  }
  const constraints = Array.isArray(appData.constraints) ? appData.constraints : [];
  return constraints.filter((c) => c && (c.startTime || c.start) && (c.endTime || c.end)).map((c) => ({
    day: c.day || 'Monday',
    startTime: c.startTime || c.start,
    endTime: c.endTime || c.end
  }));
}

export function detectConflicts(entries = [], appData = {}) {
  const normalizedEntries = (entries || []).map((entry, index) => normalizeEntry(entry, index, appData));
  const hardConflicts = [];
  const warnings = [];

  for (let index = 0; index < normalizedEntries.length; index += 1) {
    const first = normalizedEntries[index];
    if (!first || !first.day) continue;

    for (let nextIndex = index + 1; nextIndex < normalizedEntries.length; nextIndex += 1) {
      const second = normalizedEntries[nextIndex];
      if (!second || !second.day) continue;
      if (first.day !== second.day) continue;

      const overlaps = first.startMinutes < second.endMinutes && second.startMinutes < first.endMinutes;
      if (!overlaps) continue;

      if (first.classId && second.classId && String(first.classId) === String(second.classId)) {
        addConflict(
          hardConflicts,
          'CLASS_OVERLAP',
          'high',
          `${resolveClassName(first, appData)} has overlapping sessions at ${first.startTime}-${first.endTime}.`,
          [first.id, second.id],
          first.day,
          first.startTime,
          first.endTime,
          first.classId,
          first.facultyId,
          first.roomId
        );
      }

      if (first.facultyId && second.facultyId && String(first.facultyId) === String(second.facultyId)) {
        addConflict(
          hardConflicts,
          'FACULTY_OVERLAP',
          'high',
          `${resolveFacultyName(first, appData)} is assigned to overlapping sessions.`,
          [first.id, second.id],
          first.day,
          first.startTime,
          first.endTime,
          first.classId,
          first.facultyId,
          first.roomId
        );
      }

      if (first.roomId && second.roomId && String(first.roomId) === String(second.roomId)) {
        addConflict(
          hardConflicts,
          'ROOM_OVERLAP',
          'high',
          `${resolveRoomName(first, appData)} is occupied by overlapping sessions.`,
          [first.id, second.id],
          first.day,
          first.startTime,
          first.endTime,
          first.classId,
          first.facultyId,
          first.roomId
        );
      }
    }
  }

  const classes = appData.classes || [];
  const rooms = appData.rooms || [];
  const faculty = appData.faculty || [];
  const subjects = appData.subjects || [];
  const breaks = collectBreaks(appData);

  normalizedEntries.forEach((entry) => {
    const room = rooms.find((item) => String(item.id) === String(entry.roomId));
    const classItem = classes.find((item) => String(item.id) === String(entry.classId));
    const facultyItem = faculty.find((item) => String(item.id) === String(entry.facultyId));
    const subjectItem = subjects.find((item) => String(item.id) === String(entry.subjectId));

    if (room && classItem) {
      const roomCapacity = Number(room.capacity ?? room.maxCapacity ?? 0);
      const classSize = Number(classItem.studentCount ?? classItem.students ?? 0);
      if (roomCapacity > 0 && classSize > roomCapacity) {
        addConflict(
          hardConflicts,
          'ROOM_CAPACITY',
          'high',
          `Room ${room.name} has capacity ${roomCapacity}, but ${classItem.name} has ${classSize} students.`,
          [entry.id],
          entry.day,
          entry.startTime,
          entry.endTime,
          entry.classId,
          entry.facultyId,
          entry.roomId
        );
      }
    }

    if (subjectItem && subjectItem.requiresLab && room && !(room.isLab || room.type === 'Lab')) {
      addConflict(
        hardConflicts,
        'ROOM_TYPE',
        'high',
        `Subject ${subjectItem.name} requires a lab room but ${room.name} is not a lab.`,
        [entry.id],
        entry.day,
        entry.startTime,
        entry.endTime,
        entry.classId,
        entry.facultyId,
        entry.roomId
      );
    }

    if (facultyItem && facultyItem.availability) {
      if (!hasDayMatch(facultyItem.availability, entry.day)) {
        addConflict(
          hardConflicts,
          'FACULTY_UNAVAILABLE',
          'high',
          `${facultyItem.name} is unavailable on ${entry.day}.`,
          [entry.id],
          entry.day,
          entry.startTime,
          entry.endTime,
          entry.classId,
          entry.facultyId,
          entry.roomId
        );
      }
    }

    if (room && room.availability) {
      if (!hasDayMatch(room.availability, entry.day)) {
        addConflict(
          hardConflicts,
          'ROOM_UNAVAILABLE',
          'high',
          `${room.name} is unavailable on ${entry.day}.`,
          [entry.id],
          entry.day,
          entry.startTime,
          entry.endTime,
          entry.classId,
          entry.facultyId,
          entry.roomId
        );
      }
    }

    if (classItem && classItem.availability) {
      if (!hasDayMatch(classItem.availability, entry.day)) {
        addConflict(
          hardConflicts,
          'CLASS_UNAVAILABLE',
          'high',
          `${classItem.name} is unavailable on ${entry.day}.`,
          [entry.id],
          entry.day,
          entry.startTime,
          entry.endTime,
          entry.classId,
          entry.facultyId,
          entry.roomId
        );
      }
    }

    if (breaks.some((period) => {
      if (!period || !period.day || !period.startTime || !period.endTime) return false;
      return period.day === entry.day && entry.startMinutes < timeToMinutes(period.endTime) && timeToMinutes(period.startTime) < entry.endMinutes;
    })) {
      addConflict(
        hardConflicts,
        'BREAK_VIOLATION',
        'high',
        `Session overlaps a break period on ${entry.day}.`,
        [entry.id],
        entry.day,
        entry.startTime,
        entry.endTime,
        entry.classId,
        entry.facultyId,
        entry.roomId
      );
    }
  });

  const dedupedHardConflicts = [];
  const seenKeys = new Set();
  hardConflicts.forEach((conflict) => {
    const key = `${conflict.type}:${(conflict.entryIds || []).join('|')}:${conflict.day}:${conflict.startTime}:${conflict.endTime}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      dedupedHardConflicts.push(conflict);
    }
  });

  const byFaculty = new Map();
  normalizedEntries.forEach((entry) => {
    if (entry.facultyId) {
      const key = `${entry.facultyId}-${entry.day}`;
      byFaculty.set(key, [...(byFaculty.get(key) || []), entry]);
    }
  });

  byFaculty.forEach((entriesForDay) => {
    const facultyItem = (appData.faculty || []).find((item) => String(item.id) === String(entriesForDay[0].facultyId));
    const dailyLimit = Number(facultyItem?.maxPeriodsPerDay || 0);
    if (dailyLimit > 0 && entriesForDay.length > dailyLimit) {
      warnings.push({
        type: 'FACULTY_DAILY_LIMIT',
        severity: 'medium',
        message: `${facultyItem.name} exceeds the daily limit of ${dailyLimit}.`,
        entryIds: entriesForDay.map((entry) => entry.id)
      });
    }
  });

  return {
    hardConflicts: dedupedHardConflicts,
    warnings,
    summary: {
      totalEntries: normalizedEntries.length,
      hardConflictCount: dedupedHardConflicts.length,
      warningCount: warnings.length
    },
    valid: dedupedHardConflicts.length === 0
  };
}

export function detectTimetableConflicts(entries = [], appData = {}) {
  return detectConflicts(entries, appData);
}

export default detectConflicts;
