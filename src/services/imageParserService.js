export function parseTimetableImage(imageData, fallbackText = '') {
  const text = typeof imageData === 'string' ? imageData : fallbackText || '';
  if (!text || !text.trim()) {
    return [];
  }

  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\s*(.+)/i);
      const timeMatch = line.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);

      return {
        id: `parsed-${index + 1}`,
        day: match?.[1] || 'Monday',
        time: timeMatch ? `${timeMatch[1]} - ${timeMatch[2]}` : '09:00 - 09:55',
        subject: (match?.[4] || line).replace(/\s{2,}/g, ' ').trim() || 'Subject',
        faculty: 'Review required',
        room: 'Review required'
      };
    });

  return rows.filter((row) => row.subject && row.subject.length > 2);
}
