/**
 * Utility functions for determining match lock status based on time and date
 */

/**
 * Checks if a match should be automatically locked based on its start time
 * @param date - Match date in YYYY-MM-DD format
 * @param time - Match time in HH:MM format
 * @returns true if the match should be auto-locked
 */
export const shouldAutoLockMatch = (date: string, time: string): boolean => {
  const now = new Date();
  const matchDateTime = new Date(`${date}T${time}`);
  const fiveMinutesBeforeMatch = new Date(matchDateTime.getTime() - 5 * 60 * 1000);
  const isMatchInPast = now >= matchDateTime;
  const shouldAutoLock = now >= fiveMinutesBeforeMatch;
  
  return shouldAutoLock || isMatchInPast;
};

/**
 * Determines if a user can edit a match based on their role and match status
 * @param isManuallyLocked - Whether the match is manually locked
 * @param date - Match date in YYYY-MM-DD format  
 * @param time - Match time in HH:MM format
 * @param isAdmin - Whether the user is an admin
 * @param isReferee - Whether the user is a referee
 * @returns true if the user can edit the match
 */
export const canEditMatch = (
  isManuallyLocked: boolean,
  date: string,
  time: string,
  isAdmin: boolean,
  isReferee: boolean
): boolean => {
  // Admins and referees can always edit
  if (isAdmin || isReferee) {
    return true;
  }
  
  // For other users, check if match is locked (manually or auto-locked)
  const isAutoLocked = shouldAutoLockMatch(date, time);
  return !isManuallyLocked && !isAutoLocked;
};

/**
 * Determines if a team manager can edit their team's match
 * @param isManuallyLocked - Whether the match is manually locked
 * @param date - Match date in YYYY-MM-DD format
 * @param time - Match time in HH:MM format
 * @param homeTeamId - Home team ID
 * @param awayTeamId - Away team ID
 * @param userTeamId - User's team ID
 * @returns true if the team manager can edit their team
 */
export const canTeamManagerEdit = (
  isManuallyLocked: boolean,
  date: string,
  time: string,
  homeTeamId: number,
  awayTeamId: number,
  userTeamId: number
): boolean => {
  // Must be their team
  const isTheirTeam = homeTeamId === userTeamId || awayTeamId === userTeamId;
  if (!isTheirTeam) {
    return false;
  }
  
  // Check if match is locked (manually or auto-locked)
  const isAutoLocked = shouldAutoLockMatch(date, time);
  return !isManuallyLocked && !isAutoLocked;
};