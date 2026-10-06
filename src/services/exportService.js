export function exportTimetableCsv(entries, filename = 'timetable.csv') {
  const header = ['Day', 'Start', 'End', 'Subject', 'Faculty', 'Room', 'Class'];
  const rows = entries.map((entry) => [
    entry.day,
    entry.start,
    entry.end,
    entry.subject,
    entry.faculty,
    entry.room,
    entry.className
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
