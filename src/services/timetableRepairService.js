import { detectConflicts } from './conflictService.js';
import { timeToMinutes } from '../utils/timeUtils.js';

function cloneEntries(entries) {
  return (entries || []).map((entry) => ({ ...entry }));
}

function getTimeSlots(appData) {
  const base = Array.isArray(appData.timeSlots) && appData.timeSlots.length > 0 ? appData.timeSlots : [
    { day: 'Monday', startTime: '09:00', endTime: '09:55' },
    { day: 'Monday', startTime: '09:55', endTime: '10:50' },
    { day: 'Monday', startTime: '11:00', endTime: '11:55' },
    { day: 'Tuesday', startTime: '09:00', endTime: '09:55' },
    { day: 'Tuesday', startTime: '09:55', endTime: '10:50' },
    { day: 'Tuesday', startTime: '11:00', endTime: '11:55' }
  ];

  return base.map((slot) => ({
    ...slot,
    day: slot.day || 'Monday',
    startTime: slot.startTime || '09:00',
    endTime: slot.endTime || '09:55'
  }));
}

function getSubject(entry, appData) {
  return (appData.subjects || []).find((subject) => String(subject.id) === String(entry.subjectId));
}

function getFacultyById(appData, id) {
  return (appData.faculty || []).find((member) => String(member.id) === String(id));
}

function getRoomById(appData, id) {
  return (appData.rooms || []).find((room) => String(room.id) === String(id));
}

function getBreaks(appData) {
  const breaksFromData = Array.isArray(appData.breaks) ? appData.breaks : [];
  if (breaksFromData.length > 0) {
    return breaksFromData.filter((b) => b && (b.startTime || b.start) && (b.endTime || b.end)).map((b) => ({
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
  return getBreaks(appData).some((period) => {
    if (!period || !period.day || !period.startTime || !period.endTime) return false;
    return period.day === entry.day && entry.startMinutes < timeToMinutes(period.endTime) && timeToMinutes(period.startTime) < entry.endMinutes;
  });
}

function candidateBlocksForEntry(entry, appData) {
  const subject = getSubject(entry, appData);
  const duration = Number(subject?.duration || entry.duration || 1);
  const slots = getTimeSlots(appData);
  const blocks = [];

  const groupedSlots = slots.filter((slot) => slot.day === (entry.day || slot.day));
  for (let index = 0; index < groupedSlots.length; index += 1) {
    const slot = groupedSlots[index];
    if (duration <= 1) {
      blocks.push({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startMinutes: timeToMinutes(slot.startTime),
        endMinutes: timeToMinutes(slot.endTime),
        duration: 1
      });
      continue;
    }

    const consecutive = groupedSlots.slice(index, index + duration);
    if (consecutive.length < duration) continue;
    blocks.push({
      day: consecutive[0].day,
      startTime: consecutive[0].startTime,
      endTime: consecutive[consecutive.length - 1].endTime,
      startMinutes: timeToMinutes(consecutive[0].startTime),
      endMinutes: timeToMinutes(consecutive[consecutive.length - 1].endTime),
      duration
    });
  }

  return blocks;
}

function candidateFaculty(entry, appData) {
  const subject = getSubject(entry, appData);
  const facultyList = (appData.faculty || []).filter((member) => {
    if (String(member.id) === String(entry.facultyId)) return false;
    if (subject && Array.isArray(subject.facultyIds) && subject.facultyIds.length > 0 && !subject.facultyIds.includes(member.id)) {
      return false;
    }
    if (subject && typeof subject.faculty === 'string' && !member.name.toLowerCase().includes(subject.faculty.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (facultyList.length === 0) {
    return (appData.faculty || []).filter((member) => String(member.id) !== String(entry.facultyId));
  }

  return facultyList;
}

function candidateRooms(entry, appData) {
  const subject = getSubject(entry, appData);
  const roomList = (appData.rooms || []).filter((room) => {
    if (String(room.id) === String(entry.roomId)) return false;
    if (subject?.requiresLab && !(room.isLab || room.type === 'Lab')) return false;
    return true;
  });

  return roomList;
}

function scoreReplacement(original, candidate, appData) {
  const originalFaculty = getFacultyById(appData, original.facultyId);
  const originalRoom = getRoomById(appData, original.roomId);
  const candidateFaculty = getFacultyById(appData, candidate.facultyId);
  const candidateRoom = getRoomById(appData, candidate.roomId);

  let score = 0;
  if (candidate.day === original.day) score += 25;
  score += Math.max(0, 30 - Math.abs(timeToMinutes(candidate.startTime) - timeToMinutes(original.startTime)) / 5);
  if (candidateFaculty && originalFaculty && String(candidateFaculty.id) === String(originalFaculty.id)) score += 15;
  if (candidateRoom && originalRoom && String(candidateRoom.id) === String(originalRoom.id)) score += 10;
  if (candidate.roomId && candidate.roomId === original.roomId) score += 10;
  if (candidate.facultyId && candidate.facultyId === original.facultyId) score += 12;
  return score;
}

function findValidReplacement(entry, entries, appData) {
  const subject = getSubject(entry, appData);
  const duration = Number(subject?.duration || entry.duration || 1);
  const blocks = candidateBlocksForEntry(entry, appData);
  const facultyOptions = candidateFaculty(entry, appData);
  const roomOptions = candidateRooms(entry, appData);
  const validCandidates = [];

  for (const block of blocks) {
    for (const faculty of facultyOptions) {
      for (const room of roomOptions) {
        const candidate = {
          ...entry,
          day: block.day,
          startTime: block.startTime,
          endTime: block.endTime,
          startMinutes: block.startMinutes,
          endMinutes: block.endMinutes,
          duration,
          facultyId: faculty.id,
          faculty: faculty.name,
          roomId: room.id,
          room: room.name,
          subjectId: entry.subjectId,
          classId: entry.classId
        };

        if (isBreakBlocked(candidate, appData)) continue;

        const nextEntries = entries.map((item) => (String(item.id) === String(entry.id) ? candidate : item));
        const validation = detectConflicts(nextEntries, appData);
        if (validation.valid) {
          validCandidates.push({ candidate, score: scoreReplacement(entry, candidate, appData) });
        }
      }
    }
  }

  if (validCandidates.length === 0 && facultyOptions.length > 0) {
    for (const block of blocks) {
      for (const faculty of facultyOptions) {
        const candidate = { ...entry, day: block.day, startTime: block.startTime, endTime: block.endTime, startMinutes: block.startMinutes, endMinutes: block.endMinutes, duration, facultyId: faculty.id, faculty: faculty.name };
        if (isBreakBlocked(candidate, appData)) continue;
        const nextEntries = entries.map((item) => (String(item.id) === String(entry.id) ? candidate : item));
        const validation = detectConflicts(nextEntries, appData);
        if (validation.valid) {
          validCandidates.push({ candidate, score: scoreReplacement(entry, candidate, appData) });
        }
      }
    }
  }

  if (validCandidates.length === 0 && roomOptions.length > 0) {
    for (const block of blocks) {
      for (const room of roomOptions) {
        const candidate = { ...entry, day: block.day, startTime: block.startTime, endTime: block.endTime, startMinutes: block.startMinutes, endMinutes: block.endMinutes, duration, roomId: room.id, room: room.name };
        if (isBreakBlocked(candidate, appData)) continue;
        const nextEntries = entries.map((item) => (String(item.id) === String(entry.id) ? candidate : item));
        const validation = detectConflicts(nextEntries, appData);
        if (validation.valid) {
          validCandidates.push({ candidate, score: scoreReplacement(entry, candidate, appData) });
        }
      }
    }
  }

  if (validCandidates.length === 0) {
    return null;
  }

  validCandidates.sort((a, b) => b.score - a.score);
  return validCandidates[0].candidate;
}

export function repairTimetable(entries = [], appData = {}) {
  const originalEntries = cloneEntries(entries);
  const repairedEntries = cloneEntries(entries);
  const conflictsBefore = detectConflicts(originalEntries, appData);

  if (conflictsBefore.valid) {
    return {
      success: true,
      originalEntries,
      repairedEntries,
      changes: [],
      conflictsBefore: conflictsBefore.hardConflicts,
      conflictsAfter: [],
      score: 100
    };
  }

  const conflictEntryIds = [...new Set(conflictsBefore.hardConflicts.flatMap((conflict) => conflict.entryIds || []))];
  const changes = [];

  for (const entryId of conflictEntryIds) {
    const target = repairedEntries.find((entry) => String(entry.id) === String(entryId));
    if (!target) continue;

    const replacement = findValidReplacement(target, repairedEntries, appData);
    if (!replacement) continue;

    const index = repairedEntries.findIndex((entry) => String(entry.id) === String(target.id));
    repairedEntries[index] = replacement;
    changes.push({
      id: target.id,
      from: {
        day: target.day,
        startTime: target.startTime,
        endTime: target.endTime,
        facultyId: target.facultyId,
        roomId: target.roomId
      },
      to: {
        day: replacement.day,
        startTime: replacement.startTime,
        endTime: replacement.endTime,
        facultyId: replacement.facultyId,
        roomId: replacement.roomId
      },
      reason: 'Conflict resolution via timetable repair'
    });
  }

  const conflictsAfter = detectConflicts(repairedEntries, appData);

  return {
    success: conflictsAfter.valid,
    originalEntries,
    repairedEntries,
    changes,
    conflictsBefore: conflictsBefore.hardConflicts,
    conflictsAfter: conflictsAfter.hardConflicts,
    score: conflictsAfter.valid ? 94 : 40
  };
}

export default repairTimetable;
