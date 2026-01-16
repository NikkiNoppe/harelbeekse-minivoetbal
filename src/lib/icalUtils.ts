/**
 * iCal (.ics) file generation utilities
 * For exporting match schedules to calendar applications
 */

export interface ICalEvent {
  id: string | number;
  title: string;
  date: string;           // ISO date string or YYYY-MM-DD
  time: string;           // HH:MM format
  location: string;
  description?: string;
  duration?: number;      // Duration in minutes (default: 90)
}

/**
 * Format date for iCal (YYYYMMDD)
 */
const formatICalDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Format time for iCal (HHMMSS)
 */
const formatICalTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`;
};

/**
 * Format datetime for iCal (YYYYMMDDTHHMMSS)
 */
const formatICalDateTime = (dateStr: string, timeStr: string): string => {
  return `${formatICalDate(dateStr)}T${formatICalTime(timeStr)}`;
};

/**
 * Calculate end time based on start time and duration
 */
const calculateEndTime = (timeStr: string, durationMinutes: number): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Get current timestamp in iCal format
 */
const getICalTimestamp = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Escape special characters for iCal text fields
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate a single iCal event
 */
const generateICalEvent = (event: ICalEvent, domain: string = 'harelbeekse-minivoetbal.be'): string => {
  const duration = event.duration || 90;
  const endTime = calculateEndTime(event.time, duration);
  const timestamp = getICalTimestamp();
  
  // Extract date part if it's a full ISO string
  const dateOnly = event.date.split('T')[0];
  
  const lines = [
    'BEGIN:VEVENT',
    `UID:match-${event.id}@${domain}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatICalDateTime(dateOnly, event.time)}`,
    `DTEND:${formatICalDateTime(dateOnly, endTime)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
    `LOCATION:${escapeICalText(event.location || 'Harelbekese Minivoetbal')}`,
  ];
  
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }
  
  lines.push('END:VEVENT');
  
  return lines.join('\r\n');
};

/**
 * Generate a complete iCal file from multiple events
 */
export const generateICalFile = (
  events: ICalEvent[], 
  calendarName: string = 'Speelschema'
): string => {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Harelbeekse Minivoetbal//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
  ].join('\r\n');
  
  const footer = 'END:VCALENDAR';
  
  const eventStrings = events.map(event => generateICalEvent(event));
  
  return `${header}\r\n${eventStrings.join('\r\n')}\r\n${footer}`;
};

/**
 * Download an iCal file to the user's device
 */
export const downloadICalFile = (
  events: ICalEvent[], 
  filename: string = 'speelschema',
  calendarName?: string
): void => {
  const icalContent = generateICalFile(events, calendarName || filename);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Share iCal file using Web Share API (mobile) or fallback to download
 */
export const shareICalFile = async (
  events: ICalEvent[], 
  filename: string = 'speelschema',
  calendarName?: string
): Promise<boolean> => {
  const icalContent = generateICalFile(events, calendarName || filename);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const file = new File([blob], `${filename}.ics`, { type: 'text/calendar' });
  
  // Check if Web Share API is available and supports files
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: calendarName || 'Speelschema',
        text: 'Speelschema voor je agenda',
      });
      return true;
    } catch (error) {
      // User cancelled or share failed, fall back to download
      if ((error as Error).name !== 'AbortError') {
        downloadICalFile(events, filename, calendarName);
      }
      return false;
    }
  }
  
  // Fallback to download
  downloadICalFile(events, filename, calendarName);
  return true;
};
