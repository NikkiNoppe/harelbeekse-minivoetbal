/**
 * Date and time utility functions for consistent Belgian timezone handling (CET/CEST)
 */

const BELGIAN_LOCALE = 'nl-BE';
const DATE_FORMAT = 'en-CA'; // YYYY-MM-DD
const TIME_FORMAT = 'en-GB'; // HH:MM

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

/** Formats a date for display in Belgian locale (long) */
export function formatDateForDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(BELGIAN_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return 'Ongeldige datum';
  }
}

/** Formats a time for display in Belgian locale */
export function formatTimeForDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(BELGIAN_LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
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

/** Formats a date for display in short Belgian format (DD-MM-YYYY) */
export function formatDateShort(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(BELGIAN_LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit' });
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