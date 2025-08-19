import { Team } from "@/services/core/teamService";

export interface TeamPreferencesNormalized {
  days?: Set<number>;
  timeslots?: Set<string>;
  venues?: Set<number>;
  prefCount: number;
}

const normalize = (s: string) => s.toLowerCase().trim();

function normalizeDayEntry(day: string | number): number | null {
  if (typeof day === 'number') {
    return day >= 1 && day <= 7 ? day : null;
  }
  const dn = day.toLowerCase();
  const map: Record<string, number> = {
    'ma': 1, 'maandag': 1, 'monday': 1,
    'di': 2, 'dinsdag': 2, 'tuesday': 2,
    'wo': 3, 'woensdag': 3, 'wednesday': 3,
    'do': 4, 'donderdag': 4, 'thursday': 4,
    'vr': 5, 'vrijdag': 5, 'friday': 5,
    'za': 6, 'zaterdag': 6, 'saturday': 6,
    'zo': 7, 'zondag': 7, 'sunday': 7,
  };
  return map[dn] ?? null;
}

export function normalizeTeamsPreferences(teams: Team[]): Map<number, TeamPreferencesNormalized> {
  const map = new Map<number, TeamPreferencesNormalized>();
  for (const t of teams) {
    const prefs: any = (t as any).preferred_play_moments;
    const daysSet = Array.isArray(prefs?.days)
      ? new Set<number>((prefs.days as any[]) 
          .map(d => normalizeDayEntry(d))
          .filter((n): n is number => typeof n === 'number'))
      : undefined;
    const timesSet = Array.isArray(prefs?.timeslots)
      ? new Set<string>((prefs.timeslots as string[]).map(normalize))
      : undefined;
    const venuesSet = Array.isArray(prefs?.venues)
      ? new Set<number>((prefs.venues as number[]).filter((v) => typeof v === 'number'))
      : undefined;
    const prefCount = (daysSet ? 1 : 0) + (timesSet ? 1 : 0) + (venuesSet ? 1 : 0);
    if (prefCount > 0) {
      map.set(t.team_id, { days: daysSet, timeslots: timesSet, venues: venuesSet, prefCount });
    }
  }
  return map;
}

export function scoreTeamForDetails(
  prefs: TeamPreferencesNormalized | undefined,
  timeslot: any,
  venueName: string | undefined,
  venues: any[]
): { score: number; matched: number; provided: number } {
  if (!prefs || prefs.prefCount === 0) return { score: 0, matched: 0, provided: 0 };

  // Determine venue id from name using provided venues list (best-effort)
  let venueId: number | undefined = undefined;
  if (venues && venueName) {
    const v = venues.find((vv: any) => (vv.name === venueName || vv.venue_name === venueName));
    venueId = v?.venue_id ?? v?.id;
  }

  let matched = 0;
  // Day match (timeslot.day_of_week is number 1-7)
  if (prefs.days && typeof timeslot?.day_of_week === 'number' && prefs.days.has(timeslot.day_of_week)) {
    matched += 1;
  }
  // Timeslot match: match by id or by label strings
  if (prefs.timeslots && timeslot) {
    const label = timeslot?.start_time && timeslot?.end_time
      ? `${timeslot.start_time}-${timeslot.end_time}`
      : (timeslot?.start_time || '');
    const slotIdStr = timeslot?.timeslot_id ? String(timeslot.timeslot_id) : '';
    const has = (s: string) => !!s && prefs.timeslots!.has(normalize(s));
    if (has(label) || has(timeslot?.start_time || '') || (slotIdStr && prefs.timeslots.has(slotIdStr))) {
      matched += 1;
    }
  }
  // Venue match by id
  if (prefs.venues && typeof venueId === 'number' && prefs.venues.has(venueId)) {
    matched += 1;
  }

  const N = prefs.prefCount;
  const M = matched;
  let score = 0;
  if (N === 1) {
    score = M === 1 ? 3 : 0;
  } else if (N === 2) {
    score = M === 2 ? 3 : (M === 1 ? 1 : 0);
  } else if (N >= 3) {
    score = M === 3 ? 3 : (M === 2 ? 2 : (M === 1 ? 1 : 0));
  }
  return { score, matched: M, provided: N };
}


