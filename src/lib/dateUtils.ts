/**
 * Date and time utility functions for consistent Belgian timezone handling (CET/CEST)
 */

const BELGIAN_LOCALE = 'nl-BE';
const DATE_FORMAT = 'en-CA'; // YYYY-MM-DD
const TIME_FORMAT = 'en-GB'; // HH:MM

/** Helper function to parse date strings to UTC Date - handles both ISO and YYYY-MM-DD formats */
function parseToUTCDate(dateString: string): Date {
  if (dateString.includes('T')) {
    // Full ISO string: 2026-01-19T19:00:00.000Z
    return new Date(dateString);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // YYYY-MM-DD format: parse as UTC to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  // Fallback: try to parse as is
  return new Date(dateString);
}

/** Converts local date and time strings to ISO string for DB storage with fixed timezone */
export function localDateTimeToISO(dateStr: string, timeStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!year || !month || !day || hours === undefined || minutes === undefined) throw new Error('Invalid date or time format');
    
    // Maak een UTC datum/tijd om timezone shifts te vermijden
    // Dit zorgt ervoor dat 18:30 altijd 18:30 blijft, ongeacht winteruur/zomertijd
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    if (isNaN(date.getTime())) throw new Error('Invalid date/time combination');
    return date.toISOString();
  } catch (error) {
    console.error('Error converting local datetime to ISO:', error);
    throw new Error(`Failed to convert datetime: ${dateStr} ${timeStr}`);
  }
}

/** Converts ISO string from DB to local date and time strings with fixed timezone */
export function isoToLocalDateTime(isoString: string): { date: string; time: string } {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) throw new Error('Invalid ISO string');
    
    // Gebruik UTC om consistente tijden te behouden
    const dateStr = date.getUTCFullYear() + '-' + 
                   String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getUTCDate()).padStart(2, '0');
    const timeStr = String(date.getUTCHours()).padStart(2, '0') + ':' + 
                   String(date.getUTCMinutes()).padStart(2, '0');
    
    return { date: dateStr, time: timeStr };
  } catch (error) {
    console.error('Error converting ISO to local datetime:', error);
    throw new Error(`Failed to convert ISO datetime: ${isoString}`);
  }
}

/** Formats a date for display in Belgian locale (long) - uses UTC for consistency */
export function formatDateForDisplay(isoString: string): string {
  try {
    if (!isoString) return 'Ongeldige datum';
    const date = parseToUTCDate(isoString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return 'Ongeldige datum';
  }
}

/** Formats a time for display - uses UTC for consistent fixed times (no daylight saving shifts) */
export function formatTimeForDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    // Gebruik UTC om vaste tijden te behouden (19:00 = altijd 19:00, 18:30 = altijd 18:30)
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return 'Ongeldige tijd';
  }
}

/** Gets current date in YYYY-MM-DD format for Belgian timezone */
export function getCurrentDate(): string {
  return new Date().toLocaleDateString(DATE_FORMAT);
}

/** Gets current date and time in ISO format for Belgian timezone */
export function getCurrentISO(): string {
  return new Date().toISOString();
}

/** Formats a date for display in short Belgian format (DD-MM-YYYY) - uses UTC for consistency */
export function formatDateShort(isoString: string): string {
  try {
    if (!isoString) return 'Ongeldige datum';
    const date = parseToUTCDate(isoString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Ongeldige datum';
  }
}

/** Validates if a date and time combination is valid */
export function isValidDateTime(dateStr: string, timeStr: string): boolean {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!year || !month || !day || hours === undefined || minutes === undefined) return false;
    const date = new Date(year, month - 1, day, hours, minutes);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/** Sorts dates in descending order (newest first) */
export function sortDatesDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/** Sorts dates in ascending order (oldest first) */
export function sortDatesAsc(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

/** Formats date with Dutch day abbreviation (e.g., "MA 01-09-2025") - uses UTC for consistency */
export function formatDateWithDay(isoString: string): string {
  try {
    if (!isoString) return 'Ongeldige datum';
    const date = parseToUTCDate(isoString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    const dayNames = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];
    const dayAbbr = dayNames[date.getUTCDay()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${dayAbbr} ${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date with day:', error);
    return 'Ongeldige datum';
  }
}