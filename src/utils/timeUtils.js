export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function normalizeTime(value) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const cleaned = trimmed
    .replace(/–/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm]))?$/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const period = (match[3] || '').toLowerCase();
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const rangeMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm]))?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm]))?$/);
  if (rangeMatch) {
    const start = normalizeTime(`${rangeMatch[1]}:${rangeMatch[2] || '00'} ${rangeMatch[3] || ''}`);
    const end = normalizeTime(`${rangeMatch[4]}:${rangeMatch[5] || '00'} ${rangeMatch[6] || ''}`);
    return `${start} - ${end}`;
  }

  return cleaned;
}

export function parseTime(value) {
  if (value === undefined || value === null) return null;

  const str = String(value).trim();
  if (!str) return null;

  const normalized = normalizeTime(str);
  if (!normalized || normalized.includes(' - ')) {
    const rangePart = normalized.split(' - ');
    if (rangePart.length === 2) {
      return {
        start: parseTime(rangePart[0]),
        end: parseTime(rangePart[1])
      };
    }
    return null;
  }

  const [hourString, minuteString = '00'] = normalized.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const totalMinutes = hour * 60 + minute;
  return { hours: hour, minutes: minute, totalMinutes };
}

export function timeToMinutes(value) {
  const parsed = parseTime(value);
  if (!parsed || typeof parsed === 'object' && !('totalMinutes' in parsed)) {
    return 0;
  }
  return parsed.totalMinutes;
}

export function minutesToTime(totalMinutes) {
  const safeMinutes = Number(totalMinutes || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isValidTime(value) {
  return parseTime(value) !== null;
}

export function doTimeRangesOverlap(startA, endA, startB, endB) {
  const firstStart = timeToMinutes(startA);
  const firstEnd = timeToMinutes(endA);
  const secondStart = timeToMinutes(startB);
  const secondEnd = timeToMinutes(endB);

  return firstStart < secondEnd && secondStart < firstEnd;
}

export function isDuringBreak(startTime, endTime, breaks = []) {
  return breaks.some((period) => {
    if (!period || !period.startTime || !period.endTime) {
      return false;
    }
    return doTimeRangesOverlap(startTime, endTime, period.startTime, period.endTime);
  });
}

export function overlaps(first, second) {
  return first.day === second.day && doTimeRangesOverlap(first.startTime, first.endTime, second.startTime, second.endTime);
}

export function format12Hour(timeStr) {
  if (!timeStr) return '';
  const parsed = parseTime(timeStr);
  if (!parsed || parsed.hours === undefined) {
    if (typeof timeStr === 'string' && /AM|PM/i.test(timeStr)) return timeStr;
    return String(timeStr);
  }
  const hours24 = parsed.hours;
  const minutes = String(parsed.minutes).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
}

export function format12HourRange(start, end) {
  if (!start && !end) return '';
  if (!end) return format12Hour(start);
  return `${format12Hour(start)} – ${format12Hour(end)}`;
}

export function formatTimeRange(start, end) {
  return format12HourRange(start, end);
}
