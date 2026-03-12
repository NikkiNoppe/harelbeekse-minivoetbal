/**
 * Utility functions for determining match lock status based on time and date
 */

/**
 * Checks if a match should be automatically locked based on its start time
 * @param date - Match date in YYYY-MM-DD format
 * @param time - Match time in HH:MM format
 * @returns true if the match should be auto-locked
 */
export const shouldAutoLockMatch = (date: string, time: string, lockMinutesBefore: number = 5): boolean => {
  const now = new Date();
  const matchDateTime = new Date(`${date}T${time}`);
  const lockThreshold = new Date(matchDateTime.getTime() - lockMinutesBefore * 60 * 1000);
  
  return now >= lockThreshold;
};

/**
 * Checks if a match is past the lock deadline but late submission is allowed
 */
export const isLateSubmissionWindow = (
  date: string,
  time: string,
  lockMinutesBefore: number = 5,
  allowLateSubmission: boolean = false
): boolean => {
  if (!allowLateSubmission) return false;
  const now = new Date();
  const matchDateTime = new Date(`${date}T${time}`);
  const lockThreshold = new Date(matchDateTime.getTime() - lockMinutesBefore * 60 * 1000);
  // Past lock threshold but match hasn't started yet (or just started)
  return now >= lockThreshold;
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
  isReferee: boolean,
  lockMinutesBefore: number = 5,
  allowLateSubmission: boolean = false
): boolean => {
  // Admins and referees can always edit
  if (isAdmin || isReferee) {
    return true;
  }
  
  // For other users, check if match is locked (manually or auto-locked)
  const isAutoLocked = shouldAutoLockMatch(date, time, lockMinutesBefore);
  
  if (isManuallyLocked) return false;
  if (!isAutoLocked) return true;
  
  // If auto-locked but late submission allowed, still permit editing
  return allowLateSubmission;
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
  userTeamId: number,
  lockMinutesBefore: number = 5,
  allowLateSubmission: boolean = false
): boolean => {
  // Must be their team
  const isTheirTeam = homeTeamId === userTeamId || awayTeamId === userTeamId;
  if (!isTheirTeam) {
    return false;
  }
  
  if (isManuallyLocked) return false;
  
  const isAutoLocked = shouldAutoLockMatch(date, time, lockMinutesBefore);
  if (!isAutoLocked) return true;
  
  return allowLateSubmission;
};