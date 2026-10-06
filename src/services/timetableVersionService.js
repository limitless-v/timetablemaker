export function createVersionRecord({ name, entries = [], source = 'manual', parentVersionId = null, status = 'draft', conflictsBefore = [], conflictsAfter = [], changes = [], score = 0 }) {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    source,
    parentVersionId,
    status,
    entries: JSON.parse(JSON.stringify(entries)),
    conflictsBefore,
    conflictsAfter,
    changes,
    score
  };
}

export function saveVersion(version, versions = []) {
  return [...versions, version];
}

export function loadVersions() {
  try {
    const raw = window.localStorage.getItem('classmate-versions');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export function persistVersions(versions) {
  window.localStorage.setItem('classmate-versions', JSON.stringify(versions));
  return versions;
}

export function compareVersions(original, repaired) {
  return {
    original,
    repaired,
    changedEntries: repaired.filter((entry) => !original.some((originalEntry) => originalEntry.id === entry.id && originalEntry.startTime === entry.startTime && originalEntry.facultyId === entry.facultyId && originalEntry.roomId === entry.roomId))
  };
}

export default {
  createVersionRecord,
  saveVersion,
  loadVersions,
  persistVersions,
  compareVersions
};
