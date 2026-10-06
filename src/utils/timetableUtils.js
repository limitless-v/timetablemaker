export function buildSummary(entries = []) {
  return {
    totalSessions: entries.length,
    uniqueClasses: new Set(entries.map((entry) => entry.className)).size,
    uniqueRooms: new Set(entries.map((entry) => entry.room)).size,
    uniqueFaculty: new Set(entries.map((entry) => entry.faculty)).size
  };
}
