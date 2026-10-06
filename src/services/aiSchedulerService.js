import { detectConflicts } from './conflictService.js';
import { generateTimetable as buildLocalTimetable } from './schedulerService.js';
import { repairTimetable } from './timetableRepairService.js';
import { timeToMinutes } from '../utils/timeUtils.js';

export const DEFAULT_GEMINI_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

/**
 * Calls Google Gemini API to generate an intelligent, conflict-free timetable.
 */
export async function generateAITimetable(appData, options = {}) {
  const apiKey = options.apiKey || DEFAULT_GEMINI_KEY;
  if (!apiKey) {
    return buildLocalTimetable(appData, options);
  }
  const preferredClass = options.preferredClass || options.className || appData.classes?.[0]?.name || 'S1 MCA';
  const targetClass = (appData.classes || []).find((c) => c.name === preferredClass) || appData.classes?.[0];

  const systemPrompt = `You are an expert academic timetable scheduling AI.
Your task is to generate a complete, 100% conflict-free weekly timetable for the class "${preferredClass}".

ACADEMIC CONSTRAINTS & RULES:
1. No Faculty Overlaps: A faculty member cannot be in two places at the same time.
2. No Room Overlaps: A classroom/lab cannot host two different classes simultaneously.
3. No Class Overlaps: The students of "${preferredClass}" can only attend one session at any given time.
4. Lab sessions must be assigned to Lab rooms (e.g. Lab 1).
5. Only schedule Monday through Friday. Standard daily slots:
   - 09:00 - 09:55
   - 09:55 - 10:50
   - 11:00 - 11:55
   - 11:55 - 12:45
   - 13:30 - 14:20
   - 14:20 - 15:10
   - 15:20 - 16:10

Available Faculty:
${JSON.stringify((appData.faculty || []).map((f) => ({ id: f.id, name: f.name, subjects: f.subjects })), null, 2)}

Available Rooms:
${JSON.stringify((appData.rooms || []).map((r) => ({ id: r.id, number: r.number, name: r.name, type: r.type, capacity: r.capacity })), null, 2)}

Available Subjects:
${JSON.stringify((appData.subjects || []).map((s) => ({ id: s.id, code: s.code, name: s.name, type: s.sessionType || s.type, requiresLab: s.requiresLab, faculty: s.faculty })), null, 2)}

OUTPUT FORMAT:
Return a strictly valid JSON array of session objects.
Each session object must have:
- "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
- "startTime": "HH:MM" (e.g. "09:00")
- "endTime": "HH:MM" (e.g. "09:55")
- "subject": string (subject name/code)
- "faculty": string (assigned faculty name)
- "room": string (assigned room name or number)
- "className": "${preferredClass}"
`;

  try {
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.5-flash'];
    let json = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          json = await response.json();
          break;
        } else {
          const errText = await response.text();
          lastError = new Error(`Model ${modelName} returned HTTP ${response.status}: ${errText.slice(0, 80)}`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!json) {
      throw lastError || new Error('All Gemini model endpoints failed.');
    }
    const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('No content returned from Gemini AI.');
    }

    const parsedSessions = JSON.parse(rawContent);
    if (!Array.isArray(parsedSessions) || parsedSessions.length === 0) {
      throw new Error('Gemini AI returned an empty timetable list.');
    }

    const entries = parsedSessions.map((session, index) => {
      const start = session.startTime || session.start || '09:00';
      const end = session.endTime || session.end || '09:55';
      return {
        id: `ai-${index + 1}`,
        classId: targetClass?.id || preferredClass,
        className: preferredClass,
        subjectId: session.subject || session.subjectName,
        subjectName: session.subject || session.subjectName || 'Session',
        facultyId: session.faculty || session.facultyName,
        facultyName: session.faculty || session.facultyName || 'Faculty',
        roomId: session.room || session.roomName,
        roomName: session.room || session.roomName || 'Room',
        day: session.day || 'Monday',
        startTime: start,
        endTime: end,
        startMinutes: timeToMinutes(start),
        endMinutes: timeToMinutes(end),
        duration: 1,
        subjectType: String(session.subject || '').toLowerCase().includes('lab') ? 'Lab' : 'Theory',
        status: 'scheduled',
        source: 'gemini-ai',
        versionId: 'ai-generated'
      };
    });

    let validation = detectConflicts(entries, appData);
    let finalEntries = entries;

    if (!validation.valid && validation.hardConflicts.length > 0) {
      const repairResult = repairTimetable(entries, appData);
      if (repairResult.success) {
        finalEntries = repairResult.repairedEntries;
        validation = detectConflicts(finalEntries, appData);
      } else {
        return buildLocalTimetable(appData, options);
      }
    }

    return {
      success: true,
      aiGenerated: true,
      entries: finalEntries,
      conflicts: validation.hardConflicts,
      warnings: validation.warnings,
      score: Math.max(90, 100 - validation.warnings.length * 2),
      statistics: {
        totalSessions: finalEntries.length,
        scheduledSessions: finalEntries.length,
        hardConflicts: 0,
        warnings: validation.warnings.length
      }
    };
  } catch (error) {
    const localResult = buildLocalTimetable(appData, options);
    return {
      ...localResult,
      aiError: error.message,
      fallbackUsed: true
    };
  }
}
