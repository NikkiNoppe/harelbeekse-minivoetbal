import { Team } from "@/services/core/teamService";

export interface TeamPreferencesNormalized {
  days?: Set<number>;
  timeslots?: Set<string>;
  venues?: Set<number>;
  prefCount: number;
}

export interface TeamSeasonalFairness {
  teamId: number;
  teamName: string;
  totalMatches: number;
  cumulativeScore: number;
  averageScore: number;
  expectedMinimumScore: number;
  fairnessDeficit: number;
  lastUpdateDate: string;
}

export interface SeasonalFairnessMetrics {
  overallAverage: number;
  standardDeviation: number;
  minScore: number;
  maxScore: number;
  fairnessScore: number; // 0-100, higher is better
  teamsNeedingBoost: number[];
  recommendations: string[];
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
    let daysSet = Array.isArray(prefs?.days)
      ? new Set<number>((prefs.days as any[])
          .map(d => normalizeDayEntry(d))
          .filter((n): n is number => typeof n === 'number'))
      : undefined;
    let timesSet = Array.isArray(prefs?.timeslots)
      ? new Set<string>((prefs.timeslots as string[]).map(normalize))
      : undefined;
    let venuesSet = Array.isArray(prefs?.venues)
      ? new Set<number>((prefs.venues as number[]).filter((v) => typeof v === 'number'))
      : undefined;

    // Treat empty arrays as no preference
    if (daysSet && daysSet.size === 0) daysSet = undefined;
    if (timesSet && timesSet.size === 0) timesSet = undefined;
    if (venuesSet && venuesSet.size === 0) venuesSet = undefined;

    const prefCount = (daysSet ? 1 : 0) + (timesSet ? 1 : 0) + (venuesSet ? 1 : 0);
    if (prefCount > 0) {
      map.set(t.team_id, { days: daysSet, timeslots: timesSet, venues: venuesSet, prefCount });
    }
  }
  return map;
}

// Helper function to normalize venue names
function normalizeVenueName(venueName: string): string {
  return venueName
    .toLowerCase()
    .replace(/^sporthal\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to parse time and support fuzzy matching (±30 min)
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function timeMinutesFromMidnight(timeStr: string): number {
  const parsed = parseTime(timeStr);
  return parsed ? parsed.hours * 60 + parsed.minutes : -1;
}

function isTimeWithinRange(targetTime: string, preferredTime: string, toleranceMinutes: number = 30): boolean {
  const targetMinutes = timeMinutesFromMidnight(targetTime);
  const preferredMinutes = timeMinutesFromMidnight(preferredTime);
  
  if (targetMinutes === -1 || preferredMinutes === -1) return false;
  
  const diff = Math.abs(targetMinutes - preferredMinutes);
  return diff <= toleranceMinutes;
}

export function scoreTeamForDetails(
  prefs: TeamPreferencesNormalized | undefined,
  timeslot: any,
  venueName: string | undefined,
  venues: any[]
): { score: number; matched: number; provided: number } {
  // Bij geen voorkeuren: altijd 3 punten
  if (!prefs || prefs.prefCount === 0) return { score: 3, matched: 0, provided: 0 };

  // Normalize venue name for better matching
  const normalizedVenueName = venueName ? normalizeVenueName(venueName) : '';
  
  // Determine venue id from name using provided venues list (best-effort)
  let venueId: number | undefined = undefined;
  if (venues && venueName) {
    const v = venues.find((vv: any) => {
      const vName1 = normalizeVenueName(vv.name || '');
      const vName2 = normalizeVenueName(vv.venue_name || '');
      return vName1 === normalizedVenueName || vName2 === normalizedVenueName;
    });
    venueId = v?.venue_id ?? v?.id;
  }

  let matched = 0;
  // Day match (timeslot.day_of_week is number 1-7)
  if (prefs.days && typeof timeslot?.day_of_week === 'number' && prefs.days.has(timeslot.day_of_week)) {
    matched += 1;
  }
  
  // Enhanced timeslot match with fuzzy matching
  if (prefs.timeslots && timeslot?.start_time) {
    let timeMatched = false;
    
    // Exact matches first
    const label = timeslot?.start_time && timeslot?.end_time
      ? `${timeslot.start_time}-${timeslot.end_time}`
      : (timeslot?.start_time || '');
    const has = (s: string) => !!s && prefs.timeslots!.has(normalize(s));
    
    if (has(label) || has(timeslot?.start_time || '')) {
      timeMatched = true;
    } else {
      // Fuzzy time matching (±30 minutes)
      for (const prefTime of prefs.timeslots) {
        if (isTimeWithinRange(timeslot.start_time, prefTime, 30)) {
          timeMatched = true;
          break;
        }
      }
    }
    
    if (timeMatched) {
      matched += 1;
    }
  }
  
  // Venue match by id
  if (prefs.venues && typeof venueId === 'number' && prefs.venues.has(venueId)) {
    matched += 1;
  }

  const N = prefs.prefCount;
  const M = matched;
  
  // Scoringsregels met adaptive fallback:
  let score = 0;
  if (N === 1) {
    score = M === 1 ? 3 : 0;
  } else if (N === 2) {
    score = M === 2 ? 3 : (M === 1 ? 1.5 : 0);
  } else {
    score = M >= 3 ? 3 : (M === 2 ? 2 : (M === 1 ? 1 : 0));
  }
  
  return { score, matched: M, provided: N };
}

// New function to apply adaptive fallback in score matrix calculation
export function applyAdaptiveFallback(
  teamId: number,
  allSlotScores: number[],
  teamPreferences: Map<number, TeamPreferencesNormalized>
): number[] {
  const hasZeroScores = allSlotScores.every(score => score === 0);
  
  if (hasZeroScores) {
    // Team gets 0 for all slots - treat as "no preference" temporarily
    console.log(`⚠️ Team ${teamId} has 0 scores for all slots - applying adaptive fallback (treating as no preference)`);
    return allSlotScores.map(() => 3); // Give 3 points (no preference score) for all slots
  }
  
  return allSlotScores; // Return original scores if not all zero
}

export async function getSeasonalFairness(teams: any[]): Promise<{ 
  fairnessMetrics: SeasonalFairnessMetrics; 
  teamFairness: TeamSeasonalFairness[] 
}> {
  const { supabase } = await import("@/integrations/supabase/client");
  
  // Get all competition matches to calculate seasonal scores
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      match_id,
      home_team_id,
      away_team_id,
      match_date,
      location,
      home_score,
      away_score,
      is_submitted,
      is_cup_match,
      is_playoff_match
    `)
    .eq('is_cup_match', false)
    .eq('is_playoff_match', false)
    .order('match_date');

  if (!matches || matches.length === 0) {
    // No matches yet, return baseline fairness
    const teamFairness: TeamSeasonalFairness[] = teams.map(team => ({
      teamId: team.team_id,
      teamName: team.team_name,
      totalMatches: 0,
      cumulativeScore: 0,
      averageScore: 0,
      expectedMinimumScore: 1.5, // Minimum expected average
      fairnessDeficit: 0,
      lastUpdateDate: new Date().toISOString()
    }));

    return {
      fairnessMetrics: {
        overallAverage: 0,
        standardDeviation: 0,
        minScore: 0,
        maxScore: 0,
        fairnessScore: 100, // Perfect fairness with no matches
        teamsNeedingBoost: [],
        recommendations: ["Geen wedstrijden gespeeld - alle teams starten gelijk"]
      },
      teamFairness
    };
  }

  // Get season data for scoring
  const { seasonService } = await import("@/services/seasonService");
  const seasonData = await seasonService.getSeasonData();
  const venues = seasonData.venues || [];
  
  // Normalize team preferences
  const teamPreferences = normalizeTeamsPreferences(teams);
  
  // Calculate cumulative scores for each team
  const teamStats = new Map<number, { totalScore: number; matchCount: number }>();
  
  for (const match of matches) {
    if (!match.home_team_id || !match.away_team_id) continue;
    
    // Parse match timing and location to determine preference scores  
    const matchDate = new Date(match.match_date);
    const timeslot = {
      day_of_week: matchDate.getDay() || 7, // Convert Sunday (0) to 7
      start_time: '20:00', // Default time since match_time column doesn't exist
      end_time: '21:00'
    };
    
    // Score both teams for this match
    const homePrefs = teamPreferences.get(match.home_team_id);
    const awayPrefs = teamPreferences.get(match.away_team_id);
    
    const homeResult = scoreTeamForDetails(homePrefs, timeslot, match.location || '', venues);
    const awayResult = scoreTeamForDetails(awayPrefs, timeslot, match.location || '', venues);
    
    // Update team statistics
    const updateTeamStats = (teamId: number, score: number) => {
      const current = teamStats.get(teamId) || { totalScore: 0, matchCount: 0 };
      teamStats.set(teamId, {
        totalScore: current.totalScore + score,
        matchCount: current.matchCount + 1
      });
    };
    
    updateTeamStats(match.home_team_id, homeResult.score);
    updateTeamStats(match.away_team_id, awayResult.score);
  }
  
  // Calculate fairness metrics
  const teamFairness: TeamSeasonalFairness[] = teams.map(team => {
    const stats = teamStats.get(team.team_id) || { totalScore: 0, matchCount: 0 };
    const averageScore = stats.matchCount > 0 ? stats.totalScore / stats.matchCount : 0;
    const expectedMinimumScore = 1.5; // Target minimum average score
    const fairnessDeficit = Math.max(0, expectedMinimumScore - averageScore);
    
    return {
      teamId: team.team_id,
      teamName: team.team_name,
      totalMatches: stats.matchCount,
      cumulativeScore: stats.totalScore,
      averageScore,
      expectedMinimumScore,
      fairnessDeficit,
      lastUpdateDate: new Date().toISOString()
    };
  });
  
  // Calculate overall metrics
  const averages = teamFairness.map(tf => tf.averageScore).filter(avg => avg > 0);
  const overallAverage = averages.length > 0 ? averages.reduce((sum, avg) => sum + avg, 0) / averages.length : 0;
  const variance = averages.length > 0 ? 
    averages.reduce((sum, avg) => sum + Math.pow(avg - overallAverage, 2), 0) / averages.length : 0;
  const standardDeviation = Math.sqrt(variance);
  const minScore = Math.min(...averages);
  const maxScore = Math.max(...averages);
  
  // Fairness score: 100 - (spread penalty + deficit penalty)
  const spreadPenalty = Math.min(50, (maxScore - minScore) * 10); // Penalize large spreads
  const totalDeficit = teamFairness.reduce((sum, tf) => sum + tf.fairnessDeficit, 0);
  const deficitPenalty = Math.min(50, totalDeficit * 5); // Penalize teams below minimum
  const fairnessScore = Math.max(0, 100 - spreadPenalty - deficitPenalty);
  
  // Teams needing boost (below average or with deficit)
  const teamsNeedingBoost = teamFairness
    .filter(tf => tf.averageScore < overallAverage || tf.fairnessDeficit > 0)
    .map(tf => tf.teamId);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (standardDeviation > 0.5) {
    recommendations.push(`Hoge spreiding (σ=${standardDeviation.toFixed(2)}) - meer balans nodig`);
  }
  if (totalDeficit > 0) {
    const deficitTeams = teamFairness.filter(tf => tf.fairnessDeficit > 0).length;
    recommendations.push(`${deficitTeams} teams onder minimum (1.5) - prioriteit bij volgende planning`);
  }
  if (teamsNeedingBoost.length > teams.length / 2) {
    recommendations.push("Meer dan helft teams heeft boost nodig - heroverweeg voorkeuren");
  }
  if (recommendations.length === 0) {
    recommendations.push("Goede fairness balans - geen actie vereist");
  }
  
  const fairnessMetrics: SeasonalFairnessMetrics = {
    overallAverage,
    standardDeviation,
    minScore: averages.length > 0 ? minScore : 0,
    maxScore: averages.length > 0 ? maxScore : 0,
    fairnessScore,
    teamsNeedingBoost,
    recommendations
  };
  
  return { fairnessMetrics, teamFairness };
}

export function calculateFairnessBoost(
  teamId: number,
  seasonalFairness: TeamSeasonalFairness[]
): number {
  const teamData = seasonalFairness.find(tf => tf.teamId === teamId);
  if (!teamData) return 0;
  
  // Calculate boost multiplier based on deficit
  // Teams with higher deficit get bigger boost (up to 2x)
  const baseBoost = Math.min(2.0, 1.0 + teamData.fairnessDeficit);
  
  // Additional boost if significantly below average
  const overallAverage = seasonalFairness.reduce((sum, tf) => sum + tf.averageScore, 0) / seasonalFairness.length;
  const belowAverageBoost = teamData.averageScore < overallAverage * 0.8 ? 0.5 : 0;
  
  return baseBoost + belowAverageBoost;
}


