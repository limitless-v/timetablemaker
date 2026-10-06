import { seedAppData } from '../data/seedData.js';

const STORAGE_KEY = 'classmate-app-state-v1';

let memoryCache = null;
let lastRawString = null;

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function normalizeList(items, collectionKey) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    if (!item || typeof item !== 'object') return item;

    const nextItem = { ...item };
    const generatedId = nextItem.id ?? nextItem.code ?? nextItem.number ?? nextItem.name ?? nextItem.email ?? `${collectionKey}-${index + 1}`;
    nextItem.id = generatedId;

    if (collectionKey === 'subjects') {
      nextItem.duration = Number(nextItem.duration ?? nextItem.periods ?? nextItem.weeklyPeriods ?? 1);
      nextItem.requiresLab = Boolean(nextItem.requiresLab || nextItem.sessionType === 'Lab' || nextItem.type === 'Lab');
      nextItem.weeklyPeriods = Number(nextItem.weeklyPeriods ?? nextItem.periods ?? nextItem.duration ?? 1);
    }

    if (collectionKey === 'rooms') {
      nextItem.capacity = Number(nextItem.capacity ?? nextItem.maxCapacity ?? 60);
      if (nextItem.id === 'room-lab-1' && nextItem.capacity < 60) nextItem.capacity = 60;
      if (!nextItem.type && nextItem.isLab) nextItem.type = 'Lab';
    }

    if (collectionKey === 'classes') {
      nextItem.studentCount = Number(nextItem.studentCount ?? nextItem.students ?? 0);
    }

    return nextItem;
  });
}

function normalizeState(state) {
  const base = seedAppData;
  return {
    ...base,
    ...state,
    profile: { ...base.profile, ...(state?.profile || {}) },
    settings: { ...base.settings, ...(state?.settings || {}) },
    faculty: normalizeList(state?.faculty ?? base.faculty, 'faculty'),
    subjects: normalizeList(state?.subjects ?? base.subjects, 'subjects'),
    rooms: normalizeList(state?.rooms ?? base.rooms, 'rooms'),
    classes: normalizeList(state?.classes ?? base.classes, 'classes'),
    students: Array.isArray(state?.students) ? state.students : base.students,
    timeSlots: Array.isArray(state?.timeSlots) ? state.timeSlots : base.timeSlots,
    constraints: Array.isArray(state?.constraints) ? state.constraints : base.constraints,
    breaks: Array.isArray(state?.breaks) ? state.breaks : base.breaks,
    generatedTimetable: Array.isArray(state?.generatedTimetable) ? state.generatedTimetable : base.generatedTimetable,
    lastGeneratedClass: state?.lastGeneratedClass || base.lastGeneratedClass,
    versions: Array.isArray(state?.versions) ? state.versions : base.versions,
    importedTimetables: Array.isArray(state?.importedTimetables) ? state.importedTimetables : base.importedTimetables
  };
}

export function loadAppState() {
  if (typeof window === 'undefined') {
    return normalizeState(seedAppData);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (memoryCache && raw === lastRawString) {
    return memoryCache;
  }

  const stored = safeParse(raw);
  if (!stored) {
    const seeded = normalizeState(seedAppData);
    lastRawString = JSON.stringify(seeded);
    memoryCache = seeded;
    window.localStorage.setItem(STORAGE_KEY, lastRawString);
    return memoryCache;
  }

  memoryCache = normalizeState(stored);
  lastRawString = raw;
  return memoryCache;
}

export function saveAppState(nextState) {
  if (typeof window === 'undefined') {
    return nextState;
  }

  const persisted = normalizeState(nextState);
  lastRawString = JSON.stringify(persisted);
  memoryCache = persisted;
  window.localStorage.setItem(STORAGE_KEY, lastRawString);
  return persisted;
}

export function persistCollection(key, items) {
  const current = loadAppState();
  const next = { ...current, [key]: items };
  return saveAppState(next);
}

export function resetAppState() {
  if (typeof window === 'undefined') {
    return normalizeState(seedAppData);
  }

  window.localStorage.removeItem(STORAGE_KEY);
  const restored = normalizeState(seedAppData);
  lastRawString = JSON.stringify(restored);
  memoryCache = restored;
  window.localStorage.setItem(STORAGE_KEY, lastRawString);
  return restored;
}
