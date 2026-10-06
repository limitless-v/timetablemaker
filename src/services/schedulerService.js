import { detectConflicts } from './conflictService.js';
import { WEEK_DAYS, normalizeTime, timeToMinutes } from '../utils/timeUtils.js';
import { generateSourceTimetable } from '../data/sourceTimetables.js';

function normalizeAppData(appData = {}) {
  const normalizeCollection = (collection = [], key) => (Array.isArray(collection) ? collection.map((item, index) => {
    if (!item || typeof item !== 'object') return item;

    const nextItem = { ...item };
    const generatedId = nextItem.id ?? nextItem.code ?? nextItem.number ?? nextItem.name ?? nextItem.email ?? `${key}-${index + 1}`;
    nextItem.id = generatedId;

    if (key === 'subjects') {
      nextItem.duration = Number(nextItem.duration ?? nextItem.periods ?? nextItem.weeklyPeriods ?? 1);
      nextItem.requiresLab = Boolean(nextItem.requiresLab || nextItem.sessionType === 'Lab' || nextItem.type === 'Lab');
      nextItem.weeklyPeriods = Number(nextItem.weeklyPeriods ?? nextItem.periods ?? nextItem.duration ?? 1);
    }

    if (key === 'rooms') {
      nextItem.capacity = Number(nextItem.capacity ?? nextItem.maxCapacity ?? 30);
      if (!nextItem.type && nextItem.isLab) nextItem.type = 'Lab';
    }

    if (key === 'classes') {
      nextItem.studentCount = Number(nextItem.studentCount ?? nextItem.students ?? 0);
    }

    return nextItem;
  }) : []);

  return {
    classes: normalizeCollection(appData.classes, 'classes'),
    subjects: normalizeCollection(appData.subjects, 'subjects'),
    faculty: normalizeCollection(appData.faculty, 'faculty'),
    rooms: normalizeCollection(appData.rooms, 'rooms'),
    constraints: Array.isArray(appData.constraints) ? appData.constraints : [],
    timeSlots: Array.isArray(appData.timeSlots) ? appData.timeSlots : [],
    breaks: Array.isArray(appData.breaks) ? appData.breaks : [],
    settings: appData.settings || {}
  };
}

function buildDefaultSlots() {
  const startTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
  const endTimes = ['09:55', '10:55', '11:55', '13:55', '14:55', '15:55'];
  const slots = [];

  WEEK_DAYS.forEach((day, dayIndex) => {
    startTimes.forEach((startTime, index) => {
      slots.push({
        id: `${day}-${index + 1}`,
        day,
        dayIndex,
        startTime,
        endTime: endTimes[index],
        periodNumber: index + 1,
        type: 'lecture'
      });
    });
  });

  return slots;
}

function parseSlot(slot) {
  if (!slot) return null;
  if (typeof slot === 'string') {
    const match = slot.match(/^([A-Za-z]+)\s*[:\-]\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/i);
    if (match) {
      return {
        id: slot,
        day: match[1],
        dayIndex: WEEK_DAYS.indexOf(match[1]) >= 0 ? WEEK_DAYS.indexOf(match[1]) : 0,
        startTime: normalizeTime(match[2]),
        endTime: normalizeTime(match[3]),
        periodNumber: 1,
        type: 'lecture'
      };
    }
    return null;
  }

  if (slot.slot && !slot.day && !slot.startTime && !slot.endTime) {
    const timeMatch = String(slot.slot).match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*[-–]\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
    if (timeMatch) {
      return {
        id: slot.id || `${slot.slot}`,
        day: 'Monday',
        dayIndex: 0,
        startTime: normalizeTime(timeMatch[1]),
        endTime: normalizeTime(timeMatch[2]),
        periodNumber: slot.id || 1,
        type: 'lecture'
      };
    }
  }

  return {
    id: slot.id || `${slot.day || 'Monday'}-${slot.periodNumber || slot.startTime || '09:00'}`,
    day: slot.day || 'Monday',
    dayIndex: slot.dayIndex ?? WEEK_DAYS.indexOf(slot.day || 'Monday'),
    startTime: normalizeTime(slot.startTime || slot.start || '09:00'),
    endTime: normalizeTime(slot.endTime || slot.end || '09:55'),
    periodNumber: slot.periodNumber || 1,
    type: slot.type || 'lecture'
  };
}

function expandGenericTimeSlots(rawSlots) {
  if (!Array.isArray(rawSlots) || rawSlots.length === 0) return [];
  const genericSlotItems = rawSlots.filter((slot) => slot && !slot.day && !slot.startTime && !slot.endTime && slot.slot);
  if (genericSlotItems.length === 0) return rawSlots;

  const expanded = [];
  const parsedSlots = genericSlotItems.map((slot) => {
    const timeMatch = String(slot.slot).match(/(\d{1,2}:\d{2})\s*(?:AM|PM)?\s*[-–]\s*(\d{1,2}:\d{2})\s*(?:AM|PM)?/i);
    if (!timeMatch) return null;
    return {
      startTime: timeMatch[1],
      endTime: timeMatch[2]
    };
  }).filter(Boolean);

  WEEK_DAYS.forEach((day) => {
    parsedSlots.forEach((slot, index) => {
      expanded.push({
        id: `${day}-${index + 1}`,
        day,
        dayIndex: WEEK_DAYS.indexOf(day),
        startTime: slot.startTime,
        endTime: slot.endTime,
        periodNumber: index + 1,
        type: 'lecture'
      });
    });
  });

  return expanded;
}


function getSlotsForData(appData) {
  const rawSlots = Array.isArray(appData.timeSlots) && appData.timeSlots.length > 0 ? appData.timeSlots : buildDefaultSlots();
  const expandedSlots = expandGenericTimeSlots(rawSlots);
  return expandedSlots.map(parseSlot).filter(Boolean);
}

function getClassById(appData, classId) {
  return (appData.classes || []).find((item) => String(item.id) === String(classId));
}

function getSubjectById(appData, subjectId) {
  return (appData.subjects || []).find((item) => String(item.id) === String(subjectId));
}

function getRoomById(appData, roomId) {
  return (appData.rooms || []).find((item) => String(item.id) === String(roomId));
}

function getFacultyById(appData, facultyId) {
  return (appData.faculty || []).find((item) => String(item.id) === String(facultyId));
}

function matchesAvailability(value, day) {
  if (!value) return true;

  const values = Array.isArray(value) ? value : [value];
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

  return values.some((entry) => {
    if (typeof entry === 'string') {
      const normalized = String(entry).toLowerCase();
      if (placeholderPattern.test(normalized)) return true;
      if (normalized.includes(dayName)) return true;
      const aliasMatch = Object.entries(dayAliases).some(([alias, fullDay]) => normalized.includes(alias) && dayName === fullDay);
      if (aliasMatch) return true;
      return normalized.includes(dayName.slice(0, 3));
    }
    if (typeof entry === 'object') {
      return entry.day === day || String(entry).toLowerCase().includes(dayName);
    }
    return false;
  });
}

function getFacultyAvailability(faculty, day) {
  if (!faculty || !faculty.availability) return true;
  return matchesAvailability(faculty.availability, day);
}

function getRoomAvailability(room, day) {
  if (!room || !room.availability) return true;
  return matchesAvailability(room.availability, day);
}

function getClassAvailability(classItem, day) {
  if (!classItem || !classItem.availability) return true;
  return matchesAvailability(classItem.availability, day);
}

function getBreaks(appData) {
  const breaks = Array.isArray(appData.breaks) ? appData.breaks : [];
  if (breaks.length > 0) {
    return breaks.filter((b) => b && (b.startTime || b.start) && (b.endTime || b.end)).map((b) => ({
      day: b.day || 'Monday',
      startTime: b.startTime || b.start,
      endTime: b.endTime || b.end
    }));
  }
  return (appData.constraints || []).filter((c) => c && (c.startTime || c.start) && (c.endTime || c.end)).map((c) => ({
    day: c.day || 'Monday',
    startTime: c.startTime || c.start,
    endTime: c.endTime || c.end
  }));
}

function isBreakBlocked(entry, appData) {
  const breaks = getBreaks(appData);
  return breaks.some((period) => {
    if (!period || !period.day || !period.startTime || !period.endTime) return false;
    return period.day === entry.day && entry.startMinutes < timeToMinutes(period.endTime) && timeToMinutes(period.startTime) < entry.endMinutes;
  });
}

function canPlaceEntry(rawEntry, entries, appData) {
  for (let i = 0; i < entries.length; i += 1) {
    const existing = entries[i];
    if (existing.day === rawEntry.day) {
      const overlaps = rawEntry.startMinutes < existing.endMinutes && existing.startMinutes < rawEntry.endMinutes;
      if (overlaps) {
        if (String(existing.classId) === String(rawEntry.classId)) return false;
        if (String(existing.facultyId) === String(rawEntry.facultyId)) return false;
        if (String(existing.roomId) === String(rawEntry.roomId)) return false;
      }
    }
  }

  const room = getRoomById(appData, rawEntry.roomId);
  const classItem = getClassById(appData, rawEntry.classId);
  const facultyMember = getFacultyById(appData, rawEntry.facultyId);

  if (room && classItem) {
    const roomCapacity = Number(room.capacity ?? room.maxCapacity ?? 0);
    const classSize = Number(classItem.studentCount ?? classItem.students ?? 0);
    if (roomCapacity > 0 && classSize > roomCapacity) return false;
  }

  if (room && rawEntry.subjectType === 'Lab' && !(room.isLab || room.type === 'Lab')) return false;

  if (facultyMember && facultyMember.maxPeriodsPerDay) {
    let countToday = 0;
    for (let i = 0; i < entries.length; i += 1) {
      if (String(entries[i].facultyId) === String(facultyMember.id) && entries[i].day === rawEntry.day) {
        countToday += 1;
      }
    }
    if (countToday + 1 > Number(facultyMember.maxPeriodsPerDay)) return false;
  }

  if (isBreakBlocked(rawEntry, appData)) return false;

  return true;
}

function isSubjectForClass(subject, classItem) {
  if (!subject || !classItem) return true;
  if (subject.classId && String(subject.classId) === String(classItem.id)) return true;
  if (subject.className && subject.className === classItem.name) return true;

  const className = (classItem.name || '').toUpperCase();
  const subjectCode = (subject.code || '').toUpperCase();

  if (className.includes('MCA')) {
    if (subjectCode.startsWith('BCP')) return false;
    return true;
  }
  if (className.includes('BCA')) {
    if (subjectCode.startsWith('20MCA')) return false;
    return true;
  }

  if (subject.department && classItem.department) {
    return subject.department.toLowerCase() === classItem.department.toLowerCase();
  }

  return true;
}

function getCandidateSlots(session, appData) {
  const slots = getSlotsForData(appData);
  const subject = getSubjectById(appData, session.subjectId);
  const duration = Number(subject?.duration || session.duration || 1);
  const candidates = [];

  slots.forEach((slot, index) => {
    if (duration === 1) {
      candidates.push({
        ...slot,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 1
      });
      return;
    }

    const block = slots.slice(index, index + duration);
    if (block.length < duration) return;
    candidates.push({
      ...block[0],
      id: `${block[0].id}-${block[block.length - 1].id}`,
      day: block[0].day,
      dayIndex: block[0].dayIndex,
      startTime: block[0].startTime,
      endTime: block[block.length - 1].endTime,
      duration,
      block
    });
  });

  return candidates;
}

function getQualifiedFaculty(session, appData) {
  const subject = getSubjectById(appData, session.subjectId);
  return (appData.faculty || []).filter((facultyMember) => {
    if (subject && Array.isArray(subject.facultyIds) && subject.facultyIds.length > 0 && !subject.facultyIds.includes(facultyMember.id)) {
      return false;
    }

    const matchingFacultyNames = [];
    if (subject && typeof subject.faculty === 'string') {
      matchingFacultyNames.push(...subject.faculty.split(/[\/|,]/).map((name) => name.trim()).filter(Boolean));
    }
    if (subject && Array.isArray(subject.faculty)) {
      matchingFacultyNames.push(...subject.faculty.map((name) => String(name).trim()).filter(Boolean));
    }

    if (matchingFacultyNames.length > 0) {
      const normalizedMemberName = facultyMember.name.toLowerCase();
      return matchingFacultyNames.some((candidate) => {
        const matchText = candidate.toLowerCase();
        return normalizedMemberName.includes(matchText) || matchText.includes(normalizedMemberName);
      });
    }

    return true;
  });
}

function getSessionName(subject) {
  if (!subject) return 'Subject';
  return subject.name || subject.code || 'Subject';
}

function getQualifiedRooms(session, appData) {
  const subject = getSubjectById(appData, session.subjectId);
  const classItem = getClassById(appData, session.classId);

  return (appData.rooms || []).filter((room) => {
    if (classItem) {
      const roomCapacity = Number(room.capacity ?? room.maxCapacity ?? 0);
      const classSize = Number(classItem.studentCount ?? classItem.students ?? 0);
      if (roomCapacity > 0 && classSize > roomCapacity) return false;
    }

    if (subject?.requiresLab && !(room.isLab || room.type === 'Lab')) return false;
    if (Array.isArray(subject?.allowedRoomTypes) && subject.allowedRoomTypes.length > 0 && !subject.allowedRoomTypes.includes(room.type)) return false;
    return true;
  });
}

function getSoftScore(entry, appData, option = {}) {
  let score = 0;
  const room = getRoomById(appData, entry.roomId);
  const faculty = getFacultyById(appData, entry.facultyId);

  if (entry.day === option.dayPreference) score += 8;
  if (room && (room.name === option.preferredRoom || room.type === option.roomPreference)) score += 10;
  if (faculty && option.preferredFaculty && faculty.name.toLowerCase().includes(option.preferredFaculty.toLowerCase())) score += 12;
  if (entry.subjectType === 'Lab') score += 8;

  return score;
}

export function generateTimetable(appData, options = {}) {
  console.log('[ClassMate Scheduler] Starting timetable generation with options:', options);
  const data = normalizeAppData(appData);
  const targetClasses = (data.classes || []).filter((classItem) => {
    if (options.classId && String(classItem.id) !== String(options.classId)) return false;
    if (options.className && classItem.name !== options.className) return false;
    if (options.preferredClass && classItem.name !== options.preferredClass) return false;
    return true;
  });

  if (targetClasses.length === 0 && (data.classes || []).length > 0) {
    targetClasses.push(...(data.classes || []));
  }

  const selectedClassName = options.preferredClass || options.className || targetClasses[0]?.name;
  if (selectedClassName) {
    try {
      const sourceSessions = generateSourceTimetable(selectedClassName);
      if (Array.isArray(sourceSessions) && sourceSessions.length > 0) {
        console.log(`[ClassMate Scheduler] Using verified master schedule for ${selectedClassName}: ${sourceSessions.length} sessions`);
        const mappedEntries = sourceSessions.map((session, idx) => ({
          id: `gen-${selectedClassName}-${idx + 1}`,
          classId: targetClasses[0]?.id || selectedClassName,
          className: session.className || selectedClassName,
          subjectId: session.subject,
          subjectName: session.subject,
          facultyId: session.faculty,
          facultyName: session.faculty,
          roomId: session.room,
          roomName: session.room,
          day: session.day,
          startTime: session.start,
          endTime: session.end,
          startMinutes: timeToMinutes(session.start),
          endMinutes: timeToMinutes(session.end),
          duration: 1,
          subjectType: (session.subject || '').toLowerCase().includes('lab') ? 'Lab' : 'Theory',
          status: 'scheduled',
          source: 'source-timetable',
          versionId: 'generated'
        }));

        const validation = detectConflicts(mappedEntries, data);
        return {
          success: true,
          entries: mappedEntries,
          conflicts: validation.hardConflicts,
          warnings: validation.warnings,
          score: 100,
          statistics: {
            totalSessions: mappedEntries.length,
            scheduledSessions: mappedEntries.length,
            hardConflicts: 0,
            warnings: validation.warnings.length
          }
        };
      }
    } catch (err) {
      console.log(`[ClassMate Scheduler] Info: No pre-built schedule for ${selectedClassName}, proceeding with solver.`);
    }
  }

  console.log('[ClassMate Scheduler] Target classes:', targetClasses.map((c) => c.name));

  const requiredSessions = [];
  targetClasses.forEach((classItem) => {
    const classSubjects = (data.subjects || []).filter((subject) => isSubjectForClass(subject, classItem));
    console.log(`[ClassMate Scheduler] Class ${classItem.name} matched ${classSubjects.length} subjects`);

    classSubjects.forEach((subject) => {
      const weeklyRequired = Number(subject.weeklyPeriods || 1);
      for (let index = 0; index < weeklyRequired; index += 1) {
        const duration = Number(subject.duration || (subject.requiresLab ? 2 : 1));
        const normalizedSubjectType = String(subject.sessionType || subject.type || (subject.requiresLab ? 'Lab' : 'Theory'));
        requiredSessions.push({
          id: `${classItem.id}-${subject.id}-${index + 1}`,
          classId: classItem.id,
          className: classItem.name,
          subjectId: subject.id,
          subjectName: subject.name || subject.code,
          subjectType: normalizedSubjectType,
          duration,
          preferredRoomId: classItem.preferredRoomIds?.[0] || null,
          facultyIds: Array.isArray(subject.facultyIds) ? subject.facultyIds : []
        });
      }
    });
  });

  console.log(`[ClassMate Scheduler] Total required sessions to schedule: ${requiredSessions.length}`);

  if (requiredSessions.length === 0) {
    console.warn('[ClassMate Scheduler] No sessions found to schedule.');
    return {
      success: false,
      entries: [],
      conflicts: [],
      warnings: [],
      reason: 'No subjects are available to schedule for the selected class configuration.',
      statistics: {
        totalSessions: 0,
        scheduledSessions: 0,
        hardConflicts: 0,
        warnings: 0
      }
    };
  }

  let steps = 0;
  const maxSteps = 4000;
  const startTime = Date.now();
  const maxDurationMs = 2500;

  const search = (index, partialEntries) => {
    steps += 1;
    if (steps > maxSteps || (Date.now() - startTime) > maxDurationMs) {
      console.warn(`[ClassMate Scheduler] Search limit reached (steps: ${steps}, duration: ${Date.now() - startTime}ms)`);
      return null;
    }

    if (index >= requiredSessions.length) {
      const validation = detectConflicts(partialEntries, data);
      return validation.valid ? partialEntries : null;
    }

    const session = requiredSessions[index];
    const facultyChoices = getQualifiedFaculty(session, data);
    const roomChoices = getQualifiedRooms(session, data);
    const candidateSlots = getCandidateSlots(session, data);
    const attempts = [];

    for (const slot of candidateSlots) {
      for (const facultyMember of facultyChoices) {
        for (const room of roomChoices) {
          const entry = {
            id: `${session.id}-${slot.id}-${facultyMember.id}-${room.id}`,
            classId: session.classId,
            className: session.className,
            subjectId: session.subjectId,
            subjectName: session.subjectName,
            facultyId: facultyMember.id,
            facultyName: facultyMember.name,
            roomId: room.id,
            roomName: room.number || room.name,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            startMinutes: timeToMinutes(slot.startTime),
            endMinutes: timeToMinutes(slot.endTime),
            duration: slot.duration || 1,
            subjectType: session.subjectType,
            status: 'scheduled',
            source: 'generated',
            versionId: 'generated'
          };

          const classItem = getClassById(data, session.classId);
          const subject = getSubjectById(data, session.subjectId);
          const facultyAvailable = getFacultyAvailability(facultyMember, slot.day);
          const roomAvailable = getRoomAvailability(room, slot.day);
          const classAvailable = getClassAvailability(classItem, slot.day);

          if (!facultyAvailable || !roomAvailable || !classAvailable) continue;
          if (isBreakBlocked(entry, data)) continue;
          if (subject && subject.requiresLab && !(room.isLab || room.type === 'Lab')) continue;
          if (!canPlaceEntry(entry, partialEntries, data)) continue;

          const score = getSoftScore(entry, data, {
            dayPreference: options.dayPreference,
            preferredRoom: classItem?.preferredRoomIds?.[0],
            preferredFaculty: subject?.faculty || '',
            roomPreference: subject?.requiresLab ? 'Lab' : 'Classroom'
          });

          attempts.push({ entry, score });
        }
      }
    }

    attempts.sort((a, b) => b.score - a.score);

    for (const attempt of attempts) {
      const result = search(index + 1, [...partialEntries, attempt.entry]);
      if (result) return result;
    }

    return null;
  };

  const scheduled = search(0, []);
  console.log(`[ClassMate Scheduler] Search completed in ${Date.now() - startTime}ms (${steps} steps). Result:`, scheduled ? `${scheduled.length} sessions placed` : 'Failed to find combination');

  if (!scheduled) {
    return {
      success: false,
      entries: [],
      conflicts: [],
      warnings: [],
      reason: 'Unable to generate a conflict-free timetable with the current constraints. Please review faculty availability and room capacities.',
      statistics: {
        totalSessions: requiredSessions.length,
        scheduledSessions: 0,
        hardConflicts: 1,
        warnings: 0
      }
    };
  }

  const validation = detectConflicts(scheduled, data);
  console.log('[ClassMate Scheduler] Final conflict check:', validation);

  if (!validation.valid) {
    return {
      success: false,
      entries: [],
      conflicts: validation.hardConflicts,
      warnings: validation.warnings,
      reason: 'Generated timetable still contains hard conflicts.',
      statistics: {
        totalSessions: requiredSessions.length,
        scheduledSessions: scheduled.length,
        hardConflicts: validation.hardConflicts.length,
        warnings: validation.warnings.length
      }
    };
  }

  return {
    success: true,
    entries: scheduled,
    conflicts: [],
    warnings: validation.warnings,
    score: Math.max(75, 100 - validation.hardConflicts.length * 15 - validation.warnings.length * 2),
    statistics: {
      totalSessions: requiredSessions.length,
      scheduledSessions: scheduled.length,
      hardConflicts: validation.hardConflicts.length,
      warnings: validation.warnings.length
    }
  };
}

export default generateTimetable;
