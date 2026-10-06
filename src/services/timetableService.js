import { loadAppState, saveAppState } from './storageService.js';
import { generateTimetable as buildTimetable } from './schedulerService.js';
import { generateAITimetable as buildAITimetable } from './aiSchedulerService.js';
import { detectConflicts } from './conflictService.js';

export { buildAITimetable as generateAITimetable };

export function generateTimetableForClass(className, options = {}) {
  const current = loadAppState();
  const selectedClass = (current.classes || []).find((item) => item.name === className || String(item.id) === String(className));
  if (!selectedClass) {
    throw new Error(`Class ${className} does not exist in the app data.`);
  }

  const result = buildTimetable(current, { ...options, classId: selectedClass.id, className: selectedClass.name });
  const nextState = {
    ...current,
    generatedTimetable: result.entries,
    lastGeneratedClass: selectedClass.name,
    lastGeneration: {
      generatedAt: new Date().toISOString(),
      success: result.success,
      score: result.score,
      stats: result.statistics
    }
  };

  saveAppState(nextState);
  return result;
}

export function generateTimetable(appData, options = {}) {
  const result = buildTimetable(appData, options);
  const current = loadAppState();
  if (result.success) {
    saveAppState({ ...current, generatedTimetable: result.entries, lastGeneratedClass: options.preferredClass || options.className || current.lastGeneratedClass });
  }
  return result;
}

export function getStoredTimetable() {
  const state = loadAppState();
  return state.generatedTimetable || [];
}

export function updateTimetable(entries) {
  const current = loadAppState();
  const nextState = { ...current, generatedTimetable: entries };
  saveAppState(nextState);
  return entries;
}

export function validateTimetable(entries, appData = loadAppState()) {
  return detectConflicts(entries, appData);
}
