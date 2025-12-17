import { supabase } from "@/integrations/supabase/client";
// import { localDateTimeToISO } from "@/lib/dateUtils"; // already imported at top of file
import { seasonService } from "@/services/seasonService";
import { priorityOrderService } from "@/services/priorityOrderService";
import { teamService } from "@/services/core/teamService";
import { normalizeTeamsPreferences, scoreTeamForDetails, TeamPreferencesNormalized, TeamSeasonalFairness } from "@/services/core/teamPreferencesService";
import { playoffService } from "@/services/match/playoffService";
import { bekerService as cupService } from "./cupService";
import { localDateTimeToISO } from "@/lib/dateUtils";
import { normalizeVenueName } from "@/lib/utils";

export interface CompetitionMatch {
  match_id: number;
  unique_number?: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_name?: string;
  away_team_name?: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  location: string;
  speeldag: string;
  is_playoff_match: boolean;
  playoff_round?: string;
  playoff_position?: string;
  is_submitted: boolean;
  is_locked: boolean;
  referee?: string;
  referee_notes?: string;
}

export interface CompetitionFormat {
  id: number;
  name: string;
  description: string;
  has_playoffs: boolean;
  regular_rounds: number;
  playoff_teams?: number;
}

export interface CompetitionConfig {
  format: CompetitionFormat;
  start_date: string;
  end_date: string;
  teams: number[];
}

export const competitionService = {
  // Herbruikbare functies van cupService
  addDaysToDate: cupService.addDaysToDate,
  convertToPlayingWeeks: cupService.convertToPlayingWeeks,

  // Helper functions voor validatie
  validateCompetitionInput(config: CompetitionConfig): { isValid: boolean; message?: string } {
    if (config.teams.length < 4) {
      return { isValid: false, message: "Er zijn minimaal 4 teams nodig voor een competitie" };
    }

    if (!config.format) {
      return { isValid: false, message: "Er moet een competitieformat geselecteerd zijn" };
    }

    if (!config.start_date || !config.end_date) {
      return { isValid: false, message: "Start en einddatum zijn verplicht" };
    }

    return { isValid: true };
  },

  async checkExistingCompetition(): Promise<{ exists: boolean; message?: string }> {
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('match_id')
      .eq('is_cup_match', false)
      .not('is_playoff_match', 'is', true);

    if (existingMatches && existingMatches.length > 0) {
      return { exists: true, message: "Er bestaat al een reguliere competitie. Verwijder het eerst." };
    }

    return { exists: false };
  },

  async checkExistingCupMatches(): Promise<{ exists: boolean; message?: string; cupDates?: string[] }> {
    const { data: existingCupMatches } = await supabase
      .from('matches')
      .select('match_id, match_date')
      .eq('is_cup_match', true);

    if (existingCupMatches && existingCupMatches.length > 0) {
      // Extraheer unieke datums van bekerwedstrijden
      const cupDates = [...new Set(existingCupMatches.map(match => match.match_date.split('T')[0]))];
      return { exists: true, message: "Er bestaat al een bekertoernooi.", cupDates };
    }

    return { exists: false };
  },

  async validateSeasonData(): Promise<{ isValid: boolean; message?: string; data?: any }> {
    const seasonData = await seasonService.getSeasonData();
    
    const venues = seasonData.venues || [];
    const timeslots = seasonData.venue_timeslots || [];
    const vacations = seasonData.vacation_periods || [];
    const formats = seasonData.competition_formats || [];
    const day_names = seasonData.day_names || [];
    
    if (venues.length === 0) {
      return { isValid: false, message: "Geen venues beschikbaar in de database. Configureer eerst de competitiedata." };
    }
    
    if (timeslots.length === 0) {
      return { isValid: false, message: "Geen tijdslots beschikbaar in de database. Configureer eerst de competitiedata." };
    }

    if (formats.length === 0) {
      return { isValid: false, message: "Geen competitieformaten beschikbaar in de database. Configureer eerst de competitiedata." };
    }

    return { isValid: true, data: { venues, timeslots, vacations, formats, day_names } };
  },

  // Genereer automatisch speelweken gebaseerd op seizoen data
  async generatePlayingWeeks(config: CompetitionConfig): Promise<{ weeks: string[]; message: string }> {
    try {
      const seasonData = await seasonService.getSeasonData();
      const vacations = seasonData.vacation_periods || [];
      
      // Haal bekerwedstrijd datums op
      const { cupDates } = await this.checkExistingCupMatches();

      // Haal ALLE bestaande matches op (competitie, playoffs, beker) om conflicten te vermijden
      const { data: existingMatchesAll } = await supabase
        .from('matches')
        .select('match_date')
        .order('match_date');
      const existingMondays = new Set<string>();
      (existingMatchesAll || []).forEach((m: any) => {
        if (!m?.match_date) return;
        const d = new Date(m.match_date);
        const monday = new Date(d);
        const dow = monday.getDay();
        const delta = dow === 0 ? -6 : 1 - dow;
        monday.setDate(monday.getDate() + delta);
        existingMondays.add(monday.toISOString().split('T')[0]);
      });
      
      // Bereken hoeveel weken we nodig hebben voor de competitie
      const totalTeams = config.teams.length;
      const regularMatches = this.calculateRegularMatches(config.teams, config.format.regular_rounds);
      const playoffMatches = 0; // Playoffs worden later apart gegenereerd
      const totalMatches = regularMatches + playoffMatches;
      const weeksNeeded = this.calculateWeeksNeeded(totalMatches, 7);
      
      console.log(`📊 Competitie planning: ${totalTeams} teams, ${regularMatches} reguliere wedstrijden, ${playoffMatches} playoff wedstrijden, ${weeksNeeded} weken nodig`);
      
      // Genereer alle mogelijke speelweken tussen start en eind datum
      const startDate = new Date(config.start_date);
      const endDate = new Date(config.end_date);
      const allWeeks: string[] = [];
      
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start op maandag
      
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekDateStr = weekStart.toISOString().split('T')[0];
        
        // Check of deze week niet in vakantie valt
        const isVacation = vacations.some((vacation: any) => {
          if (!vacation.is_active) return false;
          const vacStart = new Date(vacation.start_date);
          const vacEnd = new Date(vacation.end_date);
          return weekStart >= vacStart && weekStart <= vacEnd;
        });
        
        // Check conflicts met beker/alle bestaande matches
        const hasCupConflict = cupDates?.some(cupDate => {
          const cupWeekStart = new Date(cupDate);
          cupWeekStart.setDate(cupWeekStart.getDate() - cupWeekStart.getDay() + 1);
          return cupWeekStart.getTime() === weekStart.getTime();
        });
        const mondayStr = weekStart.toISOString().split('T')[0];
        const hasAnyConflict = existingMondays.has(mondayStr);
        
        if (!isVacation && !hasCupConflict && !hasAnyConflict) {
          allWeeks.push(weekDateStr);
        }
        
        // Ga naar volgende week
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      // Als we niet genoeg weken hebben, probeer meer weken te vinden door de einddatum uit te breiden
      if (allWeeks.length < weeksNeeded) {
        console.log(`⚠️ Niet genoeg weken gevonden (${allWeeks.length}/${weeksNeeded}). Probeer meer weken te vinden...`);
        
        // Breid uit tot 2x het aantal benodigde weken
        const extendedEndDate = new Date(endDate);
        extendedEndDate.setDate(extendedEndDate.getDate() + (weeksNeeded - allWeeks.length) * 7);
        
        while (currentDate <= extendedEndDate && allWeeks.length < weeksNeeded * 2) {
          const weekStart = new Date(currentDate);
          const weekDateStr = weekStart.toISOString().split('T')[0];
          
          // Check of deze week niet in vakantie valt
          const isVacation = vacations.some((vacation: any) => {
            if (!vacation.is_active) return false;
            const vacStart = new Date(vacation.start_date);
            const vacEnd = new Date(vacation.end_date);
            return weekStart >= vacStart && weekStart <= vacEnd;
          });
          
          // Check of deze week niet conflicteert met bekerwedstrijden
          const hasCupConflict = cupDates?.some(cupDate => {
            const cupWeekStart = new Date(cupDate);
            cupWeekStart.setDate(cupWeekStart.getDate() - cupWeekStart.getDay() + 1);
            return cupWeekStart.getTime() === weekStart.getTime();
          });
          
          if (!isVacation && !hasCupConflict) {
            allWeeks.push(weekDateStr);
          }
          
          // Ga naar volgende week
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
      
      const message = allWeeks.length >= weeksNeeded 
        ? `${allWeeks.length} speelweken gevonden (${weeksNeeded} nodig) tussen ${config.start_date} en ${config.end_date}`
        : `⚠️ Slechts ${allWeeks.length} speelweken gevonden (${weeksNeeded} nodig). Competitie kan niet worden gegenereerd.`;
      
      return { 
        weeks: allWeeks, 
        message 
      };
    } catch (error) {
      console.error('Error generating playing weeks:', error);
      return { weeks: [], message: `Fout bij genereren speelweken: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  },

  // Bereken aantal wedstrijden voor reguliere competitie
  calculateRegularMatches(teams: number[], rounds: number): number {
    const n = teams.length;
    return (n * (n - 1) / 2) * rounds;
  },

  // Bereken aantal playoff wedstrijden
  calculatePlayoffMatches(playoffTeams: number): number {
    // Top 8 speelt 2x tegen elkaar: 8 * 7 / 2 * 2 = 56 wedstrijden
    // Bottom 8 speelt 2x tegen elkaar: 8 * 7 / 2 * 2 = 56 wedstrijden
    // Totaal: 112 playoff wedstrijden
    return (playoffTeams * (playoffTeams - 1) / 2) * 2;
  },

  // Bereken aantal speelweken nodig
  calculateWeeksNeeded(totalMatches: number, matchesPerWeek: number): number {
    return Math.ceil(totalMatches / matchesPerWeek);
  },

  // Genereer alle wedstrijden voor reguliere competitie met round-robin algoritme
  generateRegularSeasonMatches(teams: number[], rounds: number): Array<{ home: number; away: number; round: number }> {
    const matches: Array<{ home: number; away: number; round: number; matchday?: number }> = [];
    const n = teams.length;
    const matchdaysPerRound = (n % 2 === 0) ? (n - 1) : n; // bij oneven teams is er per ronde n speeldagen (1 bye)

    // Voor een correct round-robin schema met 16 teams = 15 speeldagen
    // Gebruik round-robin algoritme waarbij elke speeldag elk team exact 1x speelt
    for (let round = 1; round <= rounds; round++) {
      const roundMatches = this.generateRoundRobinMatches(teams);
      const base = (round - 1) * matchdaysPerRound;
      roundMatches.forEach(match => {
        matches.push({ ...match, round, matchday: base + match.matchday });
      });
    }
    
    return matches as Array<{ home: number; away: number; round: number }>;
  },

  // Round-robin algoritme: Circle Method (ondersteunt even en oneven aantal teams via BYE)
  generateRoundRobinMatches(teams: number[]): Array<{ home: number; away: number; matchday: number }> {
    const matches: Array<{ home: number; away: number; matchday: number }> = [];
    const originalTeams = [...teams];
    const originalCount = originalTeams.length;
    const isOdd = originalCount % 2 !== 0;
    const BYE_TEAM_ID = -1;

    // Werkset voor algoritme (voeg BYE toe bij oneven aantal)
    const arr = isOdd ? [...originalTeams, BYE_TEAM_ID] : [...originalTeams];
    const n = arr.length; // even

    console.log(`🏆 Genereer round-robin voor ${originalCount} teams${isOdd ? ' (met BYE)' : ''}: [${originalTeams.join(', ')}]`);

    const numMatchdays = n - 1;
    for (let matchday = 1; matchday <= numMatchdays; matchday++) {
      const matchdayMatches: Array<{ home: number; away: number; matchday: number }> = [];

      for (let i = 0; i < n / 2; i++) {
        const home = arr[i];
        const away = arr[n - 1 - i];
        if (home === BYE_TEAM_ID || away === BYE_TEAM_ID) continue;
        matchdayMatches.push({ home, away, matchday });
      }

      // Validatie: bij even aantal teams spelen alle teams; bij oneven 1 bye
      const teamsInMatchday = new Set<number>();
      matchdayMatches.forEach(m => { teamsInMatchday.add(m.home); teamsInMatchday.add(m.away); });
      const expectedTeams = isOdd ? originalCount - 1 : originalCount;
      if (teamsInMatchday.size !== expectedTeams) {
        const missing = originalTeams.filter(t => !teamsInMatchday.has(t));
        if (!isOdd) {
          throw new Error(`Speeldag ${matchday} validatie gefaald: ${teamsInMatchday.size}/${expectedTeams}. Ontbrekend: ${missing.join(', ')}`);
        } else {
          console.warn(`⚠️ Speeldag ${matchday}: ${teamsInMatchday.size}/${expectedTeams} (bye aanwezig). Ontbrekend: ${missing.join(', ')}`);
        }
      }

      matches.push(...matchdayMatches);

      // Rotate (houd index 0 vast)
      const last = arr.pop() as number;
      arr.splice(1, 0, last);
    }

    return matches;
  },

  // Verbeterde distributie met seasonal fairness tracking
  async distributeMatchesOverWeeks(
    matches: Array<{ home: number; away: number; round: number; matchday?: number }>,
    playingWeeks: string[],
    options?: {
      teamPreferences?: Map<number, TeamPreferencesNormalized>;
      venues?: any[];
      dayNames?: string[];
      seasonalFairness?: TeamSeasonalFairness[]; // New: seasonal fairness data
    }
  ): Promise<Array<{ match: { home: number; away: number; round: number }; week: number; slot: number }>> {
    const distributedMatches: Array<{ match: { home: number; away: number; round: number }; week: number; slot: number }> = [];
    const matchesPerWeek = 7; // 7 speelmomenten per week
    const totalMatches = matches.length;
    
    console.log(`📊 Distributie info: ${totalMatches} wedstrijden, ${playingWeeks.length} weken beschikbaar`);
    
    // Bepaal totaal aantal unieke teams en afgeleide wedstrijden per speeldag (helft van teams, afgerond naar beneden)
    const allTeamsSet = new Set<number>();
    matches.forEach((m) => { allTeamsSet.add(m.home); allTeamsSet.add(m.away); });
    const totalTeamsCount = allTeamsSet.size;
    const matchesPerMatchday = Math.max(1, Math.floor(totalTeamsCount / 2));
    
    // Track teams per week om conflicten te voorkomen
    const teamsPerWeek: Map<number, Set<number>> = new Map();
    const slotsPerWeek: Map<number, number> = new Map();
    
    // Initialiseer tracking
    for (let week = 0; week < playingWeeks.length; week++) {
      teamsPerWeek.set(week, new Set());
      slotsPerWeek.set(week, 0);
    }
    
    // Groepeer wedstrijden per speeldag (van round-robin algoritme)
    const matchesByMatchday = new Map<number, Array<{ home: number; away: number; round: number }>>();
    
    matches.forEach((match, index) => {
      // Gebruik de matchday van het round-robin algoritme, of bereken het dynamisch
      const matchday = match.matchday || Math.floor(index / matchesPerMatchday) + 1;
      if (!matchesByMatchday.has(matchday)) {
        matchesByMatchday.set(matchday, []);
      }
      matchesByMatchday.get(matchday)!.push(match);
    });
    
    console.log(`🏆 Competitie structuur: ${matchesByMatchday.size} speeldagen`);
    
    // Helper: score volgens opgegeven regels per team
    const scoreTeamForSlot = async (
      teamId: number,
      slotIndex: number
    ): Promise<{ score: number; matched: number; provided: number }> => {
      const prefs = options?.teamPreferences?.get(teamId);
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, 7);
      return scoreTeamForDetails(prefs, timeslot, venue, options?.venues || []);
    };

    // Verdeel elke speeldag over beschikbare weken, respecting team conflicts
    let currentWeek = 0;
    
    // Sort matchdays to process them in order
    const sortedMatchdays = Array.from(matchesByMatchday.keys()).sort((a, b) => a - b);
    
    for (const matchday of sortedMatchdays) {
      const matchdayMatches = matchesByMatchday.get(matchday)!;
      console.log(`📅 Speeldag ${matchday}: ${matchdayMatches.length} wedstrijden`);
      
      // Valideer dat elk team exact 1x voorkomt op deze speeldag
      const teamsInMatchday = new Set<number>();
      matchdayMatches.forEach(match => {
        teamsInMatchday.add(match.home);
        teamsInMatchday.add(match.away);
      });
      
      // Verwacht: bij even aantal teams spelen alle teams; bij oneven aantal teams is er 1 bye (dus -1)
      const expectedTeamsThisMatchday = totalTeamsCount % 2 === 0 ? totalTeamsCount : totalTeamsCount - 1;
      if (teamsInMatchday.size !== expectedTeamsThisMatchday) {
        const teamsList = Array.from(teamsInMatchday).sort((a, b) => a - b);
        const missingTeams = Array.from(allTeamsSet).filter(t => !teamsInMatchday.has(t)).sort((a, b) => a - b);
        if (totalTeamsCount % 2 === 1) {
          // Oneven: 1 bye toegestaan → enkel waarschuwing
          console.warn(`⚠️ VALIDATIE WAARSCHUWING - Speeldag ${matchday}: ${teamsInMatchday.size}/${expectedTeamsThisMatchday} teams (bye toegestaan).`);
          console.warn(`Teams in speeldag:`, teamsList);
          if (missingTeams.length > 0) console.warn(`Ontbrekende teams (bye):`, missingTeams);
        } else {
          // Even: dit hoort exact te kloppen → error
          console.error(`❌ VALIDATIE FOUT - Speeldag ${matchday}: ${teamsInMatchday.size}/${expectedTeamsThisMatchday} teams.`);
          console.error(`Teams in speeldag:`, teamsList);
          console.error(`Ontbrekende teams:`, missingTeams);
          throw new Error(`Speeldag ${matchday} validatie gefaald: ${teamsInMatchday.size}/${expectedTeamsThisMatchday} teams. Ontbrekende teams: ${missingTeams.join(', ')}`);
        }
      }
      
      // Probeer alle wedstrijden van deze speeldag te plaatsen
      const placedMatches: Array<{ match: any; week: number; slot: number }> = [];
      
      for (const match of matchdayMatches) {
        let placed = false;
        
        // Kies de beste week op basis van voorkeur-score voor het eerstvolgende slot in die week
        let bestWeek: number | null = null;
        let bestSlotForWeek: number = 0;
        let bestScore = -1;

        for (let weekIndex = currentWeek; weekIndex < playingWeeks.length; weekIndex++) {
          const weekTeams = teamsPerWeek.get(weekIndex)!;
          const slotsUsed = slotsPerWeek.get(weekIndex)!;
          if (slotsUsed >= matchesPerWeek) continue;
          if (weekTeams.has(match.home) || weekTeams.has(match.away)) continue;

          const slotIndex = slotsUsed; // behoud sequentiële slotvulling
          // Bereken combined score voor deze week/slot
          let combined = 0;
          if (options?.teamPreferences) {
            const homeRes = await scoreTeamForSlot(match.home, slotIndex);
            const awayRes = await scoreTeamForSlot(match.away, slotIndex);
            combined = homeRes.score + awayRes.score;
          }

          if (combined > bestScore) {
            bestScore = combined;
            bestWeek = weekIndex;
            bestSlotForWeek = slotIndex;
          }
          // Bij gelijke score houden we de eerste (vroegste) week aan -> geen extra code nodig
        }

        if (bestWeek !== null) {
          const weekTeams = teamsPerWeek.get(bestWeek)!;
          weekTeams.add(match.home);
          weekTeams.add(match.away);
          teamsPerWeek.set(bestWeek, weekTeams);
          slotsPerWeek.set(bestWeek, bestSlotForWeek + 1);
          placedMatches.push({ match, week: bestWeek, slot: bestSlotForWeek });
          placed = true;
          console.log(`  ✅ Geplaatst: Week ${bestWeek + 1}, Slot ${bestSlotForWeek + 1}: Team ${match.home} vs Team ${match.away} (score ${bestScore})`);
        }
        
        if (!placed) {
          const weekUsage = Array.from(slotsPerWeek.entries()).map(([week, slots]) => 
            `Week ${week + 1}: ${slots}/7 slots`
          ).join(', ');
          
          throw new Error(
            `Kan wedstrijd van speeldag ${matchday} (Team ${match.home} vs Team ${match.away}) niet plaatsen. ` +
            `Alle weken zijn bezet of hebben team conflicten. ` +
            `Week gebruik: ${weekUsage}`
          );
        }
      }
      
      // Voeg alle geplaatste wedstrijden toe
      distributedMatches.push(...placedMatches);
      
      // Update currentWeek naar de eerste week met ruimte voor de volgende speeldag
      while (currentWeek < playingWeeks.length && (slotsPerWeek.get(currentWeek) || 0) >= matchesPerWeek) {
        currentWeek++;
      }
    }
    
    console.log(`✅ Alle ${distributedMatches.length} wedstrijden succesvol verdeeld over weken`);
    
    // Sorteer wedstrijden chronologisch
    const sortedMatches = [...distributedMatches].sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.slot - b.slot;
    });
    
    // Log verdeling
    console.log('📅 Chronologische verdeling:');
    sortedMatches.forEach(({ match, week, slot }, idx) => {
      const weekDate = playingWeeks[week];
      const inferredMatchday = Math.floor(idx / matchesPerMatchday) + 1;
      console.log(`  Week ${week + 1} (${weekDate}): Slot ${slot + 1} - Speeldag ${inferredMatchday} - Team ${match.home} vs Team ${match.away}`);
    });
    
    return sortedMatches;
  },

  // Genereer playoff wedstrijden (2x tegen elkaar voor top 8 en bottom 8)
  async generatePlayoffMatches(
    teams: number[],
    playoffTeams: number,
    playingWeeks: string[],
    startWeekIndex: number
  ): Promise<Array<{ match: { home: number; away: number; round: string }; week: number; slot: number }>> {
    const playoffMatches: Array<{ match: { home: number; away: number; round: string }; week: number; slot: number }> = [];
    
    // Top teams (1-8) en bottom teams (9-16)
    const topTeams = teams.slice(0, playoffTeams);
    const bottomTeams = teams.slice(-playoffTeams);
    
    // Top 8 playoff wedstrijden (2x tegen elkaar)
    const top8Matches = this.generatePlayoffRoundMatches(topTeams, 'top_playoff');
    
    // Bottom 8 playoff wedstrijden (2x tegen elkaar)
    const bottom8Matches = this.generatePlayoffRoundMatches(bottomTeams, 'bottom_playoff');
    
    // Verdeel over weken
    let currentWeek = startWeekIndex;
    let currentSlot = 0;
    
    // Top 8 wedstrijden
    for (const match of top8Matches) {
      if (currentSlot >= 7) {
        currentWeek++;
        currentSlot = 0;
      }
      
      playoffMatches.push({
        match,
        week: currentWeek,
        slot: currentSlot
      });
      currentSlot++;
    }
    
    // Bottom 8 wedstrijden
    for (const match of bottom8Matches) {
      if (currentSlot >= 7) {
        currentWeek++;
        currentSlot = 0;
      }
      
      playoffMatches.push({
        match,
        week: currentWeek,
        slot: currentSlot
      });
      currentSlot++;
    }
    
    return playoffMatches;
  },

  // Genereer playoff wedstrijden voor een groep teams (2x tegen elkaar)
  generatePlayoffRoundMatches(teams: number[], roundType: string): Array<{ home: number; away: number; round: string }> {
    const matches: Array<{ home: number; away: number; round: string }> = [];
    
    // Genereer 2 rondes: elke ploeg speelt 2x tegen elke andere ploeg
    for (let round = 1; round <= 2; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          // Wissel thuis/uit voor tweede ronde
          if (round === 1) {
            matches.push({
              home: teams[i],
              away: teams[j],
              round: `${roundType}_r${round}`
            });
          } else {
            matches.push({
              home: teams[j],
              away: teams[i],
              round: `${roundType}_r${round}`
            });
          }
        }
      }
    }
    
    return matches;
  },

  // Helper: splits teams in bovenste en onderste helft (bij oneven: onderste helft is oneven)
  splitTopBottomByRanking(teamsInRankingOrder: number[]): { top: number[]; bottom: number[] } {
    return playoffService.splitTopBottomByRanking(teamsInRankingOrder);
  },

  // Helper: genereer playoff wedstrijden op basis van ranking (top/bottom aparte dubbele round-robin)
  generatePlayoffsFromRanking(teamsInRankingOrder: number[], roundsPerGroup: number): Array<{ home: number; away: number; round: string }> {
    const { top, bottom } = playoffService.splitTopBottomByRanking(teamsInRankingOrder);
    const topMatches = playoffService.generatePlayoffRoundMatchesCustom(top, 'top_playoff', roundsPerGroup);
    const bottomMatches = playoffService.generatePlayoffRoundMatchesCustom(bottom, 'bottom_playoff', roundsPerGroup);
    const interleaved: Array<{ home: number; away: number; round: string }> = [];
    const maxLen = Math.max(topMatches.length, bottomMatches.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < topMatches.length) interleaved.push(topMatches[i]);
      if (i < bottomMatches.length) interleaved.push(bottomMatches[i]);
    }
    return interleaved;
  },

  // Maak wedstrijd object voor database
  createMatchObject(
    uniqueNumber: string,
    speeldag: string,
    homeTeamId: number | null,
    awayTeamId: number | null,
    matchDateTime: string,
    venue: string,
    isPlayoff: boolean = false,
    playoffRound?: string,
    playoffPosition?: string
  ) {
    const baseObject = {
      unique_number: uniqueNumber,
      speeldag,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: matchDateTime,
      location: normalizeVenueName(venue),
      is_cup_match: false,
      is_submitted: false,
      is_locked: false
    };

    // Voor nu, sla playoff informatie op in speeldag veld om database compatibiliteit te behouden
    if (isPlayoff) {
      return {
        ...baseObject,
        speeldag: `${speeldag} [PLAYOFF: ${playoffRound}]`
      };
    }

    return baseObject;
  },

  async previewCompetition(config: CompetitionConfig): Promise<{ success: boolean; message: string; plan: Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string; details: { homeScore: number; awayScore: number; combined: number; maxCombined: number } }>; totalCombined?: number; teamTotals?: Record<number, number> }> {
    try {
      // Validate basic input
      const inputValidation = this.validateCompetitionInput(config);
      if (!inputValidation.isValid) {
        return { success: false, message: inputValidation.message!, plan: [] };
      }

      // Generate weeks
      const { weeks: playingWeeks } = await this.generatePlayingWeeks(config);
      if (playingWeeks.length === 0) {
        return { success: false, message: 'Geen beschikbare speelweken', plan: [] };
      }

      // Generate regular matches (round-robin)
      const regularMatches = this.generateRegularSeasonMatches(config.teams, config.format.regular_rounds);

      // Load preferences and venues
      const seasonData = await seasonService.getSeasonData();
      const allTeamsData = await teamService.getAllTeams();
      const selectedTeamsSet = new Set(config.teams);
      const teamPreferences = normalizeTeamsPreferences(allTeamsData.filter(t => selectedTeamsSet.has(t.team_id)));
      const venues = seasonData.venues || [];

      // Load seasonal fairness data for dynamic scoring
      const { getSeasonalFairness, calculateFairnessBoost } = await import("@/services/core/teamPreferencesService");
      const { fairnessMetrics, teamFairness } = await getSeasonalFairness(allTeamsData.filter(t => selectedTeamsSet.has(t.team_id)));
      
      console.log('🎯 Seasonal fairness loaded:', {
        overallAverage: fairnessMetrics.overallAverage.toFixed(2),
        teamsNeedingBoost: fairnessMetrics.teamsNeedingBoost.length,
        fairnessScore: fairnessMetrics.fairnessScore.toFixed(1)
      });

      // Greedy week assignment without slots (respecting team conflicts and capacity)
      const matchesPerWeek = 7;
      const teamsPerWeek: Map<number, Set<number>> = new Map();
      const weekToMatches: Map<number, Array<{ home: number; away: number; matchday: number }>> = new Map();
      for (let w = 0; w < playingWeeks.length; w++) {
        teamsPerWeek.set(w, new Set());
        weekToMatches.set(w, []);
      }

      const allTeamsSet = new Set<number>();
      regularMatches.forEach(m => { allTeamsSet.add(m.home); allTeamsSet.add(m.away); });
      const matchesPerMatchday = Math.max(1, Math.floor(allTeamsSet.size / 2));

      const matchesByMatchday = new Map<number, Array<{ home: number; away: number; matchday: number }>>();
      regularMatches.forEach((m, idx) => {
        const matchday = m.matchday || Math.floor(idx / matchesPerMatchday) + 1;
        const arr = matchesByMatchday.get(matchday) || [];
        arr.push({ home: m.home, away: m.away, matchday });
        matchesByMatchday.set(matchday, arr);
      });

      let currentWeek = 0;
      const matchdayToWeek: Map<number, number> = new Map();
      const sortedMatchdays = Array.from(matchesByMatchday.keys()).sort((a, b) => a - b);
      for (const md of sortedMatchdays) {
        const mdMatches = matchesByMatchday.get(md)!;
        for (const m of mdMatches) {
          let placed = false;
          for (let w = currentWeek; w < playingWeeks.length; w++) {
            const teamSet = teamsPerWeek.get(w)!;
            const list = weekToMatches.get(w)!;
            if (list.length >= matchesPerWeek) continue;
            if (teamSet.has(m.home) || teamSet.has(m.away)) continue;
            teamSet.add(m.home); teamSet.add(m.away);
            list.push(m);
            if (!matchdayToWeek.has(md)) matchdayToWeek.set(md, w);
            placed = true; break;
          }
          if (!placed) {
            return { success: false, message: `Kan wedstrijd ${m.home}-${m.away} (speeldag ${md}) niet plannen binnen beschikbare weken`, plan: [] };
          }
        }
        while (currentWeek < playingWeeks.length && (weekToMatches.get(currentWeek)!.length >= matchesPerWeek)) currentWeek++;
      }

      // Optimize slot assignment per week (maximize combined)
      const plan: Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string; details: { homeScore: number; awayScore: number; combined: number; maxCombined: number } } > = [];
      let totalCombined = 0;
      const totalAvailableSlots = 7;

      // Preload slot details
      const slotDetails: Array<{ venue: string; timeslot: any }> = [];
      for (let s = 0; s < totalAvailableSlots; s++) {
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(s, totalAvailableSlots);
        slotDetails.push({ venue, timeslot });
      }

      const combinations = (arr: number[], k: number): number[][] => {
        const res: number[][] = []; const back = (start: number, path: number[]) => {
          if (path.length === k) { res.push([...path]); return; }
          for (let i = start; i < arr.length; i++) { path.push(arr[i]); back(i + 1, path); path.pop(); }
        }; back(0, []); return res;
      };
      const permutations = (arr: number[]): number[][] => {
        const res: number[][] = []; const used = new Array(arr.length).fill(false); const path: number[] = [];
        const back = () => { if (path.length === arr.length) { res.push([...path]); return; } for (let i = 0; i < arr.length; i++) { if (used[i]) continue; used[i] = true; path.push(arr[i]); back(); path.pop(); used[i] = false; } };
        back(); return res;
      };

      let counter = 1;
      // Fairness: track totals and variance to avoid extreme imbalance
      const fairnessWeight = 0.5; // variance weight
      const spreadWeight = 1.0;   // max-min spread weight
      const minRaiseWeight = 0.5; // reward raising the minimum team total
      const lowerBound = 10;      // soft lower bound target per team
      const lowerBoundWeight = 0.5;
      const teamTotals = new Map<number, number>();
      Array.from(allTeamsSet).forEach(t => teamTotals.set(t, 0));
      const computeVariance = (totals: Map<number, number>) => {
        const values = Array.from(totals.values());
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
        return variance;
      };
      const computeMinMax = (totals: Map<number, number>) => {
        const values = Array.from(totals.values());
        if (values.length === 0) return { min: 0, max: 0 };
        let min = values[0], max = values[0];
        for (let i = 1; i < values.length; i++) {
          const v = values[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        return { min, max };
      };
      const computeDeficit = (totals: Map<number, number>, bound: number) => {
        let deficit = 0;
        for (const val of totals.values()) {
          if (val < bound) deficit += (bound - val);
        }
        return deficit;
      };
      // Helpers for stochastic search (to avoid identical previews while aiming for high scores)
      const shuffle = (arr: number[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
      };
      for (const [weekIndex, matchesList] of weekToMatches.entries()) {
        const m = matchesList.length;
        if (m === 0) continue;

        // Build score matrix m x 7 with seasonal fairness boosts and adaptive fallback
        const { applyAdaptiveFallback } = await import("@/services/core/teamPreferencesService");
        const scoreMatrix: Array<Array<{ combined: number; h: number; a: number }>> = [];
        
        for (let r = 0; r < m; r++) {
          const { home, away } = matchesList[r];
          const row: Array<{ combined: number; h: number; a: number }> = [];
          
          // Calculate base scores for all slots first
          const homeSlotScores: number[] = [];
          const awaySlotScores: number[] = [];
          
          for (let c = 0; c < totalAvailableSlots; c++) {
            const { venue, timeslot } = slotDetails[c];
            const hRes = scoreTeamForDetails(teamPreferences.get(home), timeslot, venue, venues);
            const aRes = scoreTeamForDetails(teamPreferences.get(away), timeslot, venue, venues);
            
            homeSlotScores.push(hRes.score);
            awaySlotScores.push(aRes.score);
          }
          
          // Apply adaptive fallback if needed
          const adjustedHomeScores = applyAdaptiveFallback(home, homeSlotScores, teamPreferences);
          const adjustedAwayScores = applyAdaptiveFallback(away, awaySlotScores, teamPreferences);
          
          // Apply seasonal fairness boosts to adjusted scores
          for (let c = 0; c < totalAvailableSlots; c++) {
            const homeBoost = calculateFairnessBoost(home, teamFairness);
            const awayBoost = calculateFairnessBoost(away, teamFairness);
            
            // Create pseudo-deficit for teams with no matches to enable boosting in preview
            const homeFairness = teamFairness.find(tf => tf.teamId === home);
            const awayFairness = teamFairness.find(tf => tf.teamId === away);
            
            const homeHasPseudoDeficit = homeFairness?.totalMatches === 0;
            const awayHasPseudoDeficit = awayFairness?.totalMatches === 0;
            
            let finalHomeBoost = homeBoost;
            let finalAwayBoost = awayBoost;
            
            // Apply pseudo-deficit boost for teams with no matches (1.2x boost)
            if (homeHasPseudoDeficit && homeBoost === 0) {
              finalHomeBoost = 1.2;
            }
            if (awayHasPseudoDeficit && awayBoost === 0) {
              finalAwayBoost = 1.2;
            }
            
            const homeScore = adjustedHomeScores[c] * finalHomeBoost;
            const awayScore = adjustedAwayScores[c] * finalAwayBoost;
            
            row.push({ 
              combined: homeScore + awayScore, 
              h: homeScore, 
              a: awayScore 
            });
          }
          scoreMatrix.push(row);
        }

        const allSlots = Array.from({ length: totalAvailableSlots }, (_, i) => i);
        let assignment: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
        let bestEval = -1;
        if (m <= totalAvailableSlots && m <= 7) {
          const slotCombos = combinations(allSlots, m);
          for (const slots of slotCombos) {
            const perms = permutations(slots);
            for (const perm of perms) {
              let sum = 0; const chosen: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
              for (let r = 0; r < m; r++) {
                const c = perm[r]; const s = scoreMatrix[r][c]; sum += s.combined; chosen.push({ r, c, h: s.h, a: s.a, combined: s.combined });
              }
              // Fairness-adjusted evaluation
              const baseVar = computeVariance(teamTotals);
              const { min: baseMin, max: baseMax } = computeMinMax(teamTotals);
              const tempTotals = new Map(teamTotals);
              for (const ch of chosen) {
                const mt = matchesList[ch.r];
                tempTotals.set(mt.home, (tempTotals.get(mt.home) || 0) + ch.h);
                tempTotals.set(mt.away, (tempTotals.get(mt.away) || 0) + ch.a);
              }
              const newVar = computeVariance(tempTotals);
              const { min: newMin, max: newMax } = computeMinMax(tempTotals);
              const fairnessPenalty = newVar - baseVar;
              const spreadDelta = (newMax - newMin) - (baseMax - baseMin);
              const minRaise = newMin - baseMin; // reward increasing the minimum
              const baseDef = computeDeficit(teamTotals, lowerBound);
              const newDef = computeDeficit(tempTotals, lowerBound);
              const evalScore = sum
                - fairnessWeight * fairnessPenalty
                - spreadWeight * spreadDelta
                + minRaiseWeight * minRaise
                - lowerBoundWeight * (newDef - baseDef)
                + Math.random() * 0.1; // Add small randomization for variety
              if (evalScore > bestEval || (evalScore === bestEval && Math.random() < 0.5)) { bestEval = evalScore; assignment = chosen; }
            }
          }
        }

        // Enhanced multi-sample search strategy for preview variation
        const useMultiSampleSearch = true; // Always use for preview variation
        
        if (assignment.length === 0 || useMultiSampleSearch) {
          // Generate 30-50 alternative solutions and select top 10% based on fairness score
          const totalSamples = 30 + Math.floor(Math.random() * 20); // 30-50 samples
          const allSolutions: Array<{
            assignment: Array<{ r: number; c: number; h: number; a: number; combined: number }>;
            evalScore: number;
            totalScore: number;
            fairnessScore: number;
          }> = [];
          
          for (let sample = 0; sample < totalSamples; sample++) {
            const attempts = 3 + Math.floor(Math.random() * 3); // 3-5 attempts per sample
            let bestGreedy: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
            let bestGreedyEval = -1;
          for (let attempt = 0; attempt < attempts; attempt++) {
            const order = shuffle(Array.from({ length: m }, (_, i) => i));
            const used = new Set<number>();
            const chosen: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
            for (const r of order) {
              let bestC = -1, best = -1, bh = 0, ba = 0;
              for (let c = 0; c < totalAvailableSlots; c++) {
                if (used.has(c)) continue;
                const s = scoreMatrix[r][c];
                // Small random jitter in tie-breaking
                const jitter = Math.random() * 0.0001;
                if (s.combined + jitter > best) { best = s.combined + jitter; bestC = c; bh = s.h; ba = s.a; }
              }
              if (bestC === -1) { // fallback to first available
                for (let c = 0; c < totalAvailableSlots; c++) { if (!used.has(c)) { bestC = c; const s = scoreMatrix[r][c]; bh = s.h; ba = s.a; best = s.combined; break; } }
              }
              used.add(bestC);
              chosen.push({ r, c: bestC, h: bh, a: ba, combined: scoreMatrix[r][bestC].combined });
            }
            // Compare sums (remove jitter effect for comparison by recomputing actual sum)
            const trueSum = chosen.reduce((acc, ch) => acc + scoreMatrix[ch.r][ch.c].combined, 0);
            // Enhanced evaluation with seasonal fairness
            const baseVar = computeVariance(teamTotals);
            const { min: baseMin, max: baseMax } = computeMinMax(teamTotals);
            const tempTotals = new Map(teamTotals);
            
            for (const ch of chosen) {
              const mt = matchesList[ch.r];
              tempTotals.set(mt.home, (tempTotals.get(mt.home) || 0) + ch.h);
              tempTotals.set(mt.away, (tempTotals.get(mt.away) || 0) + ch.a);
            }
            
            const newVar = computeVariance(tempTotals);
            const { min: newMin, max: newMax } = computeMinMax(tempTotals);
            const fairnessPenalty = newVar - baseVar;
            const spreadDelta = (newMax - newMin) - (baseMax - baseMin);
            const minRaise = newMin - baseMin;
            const baseDef = computeDeficit(teamTotals, lowerBound);
            const newDef = computeDeficit(tempTotals, lowerBound);
            const evalScore = trueSum
              - fairnessWeight * fairnessPenalty
              - spreadWeight * spreadDelta
              + minRaiseWeight * minRaise
              - lowerBoundWeight * (newDef - baseDef)
              + Math.random() * 0.1; // Add small randomization for variety
            if (evalScore > bestGreedyEval || (evalScore === bestGreedyEval && Math.random() < 0.5)) {
              bestGreedyEval = evalScore;
              bestGreedy = chosen.map(ch => ({ ...ch, combined: scoreMatrix[ch.r][ch.c].combined }));
            }
            }
            
            if (bestGreedy.length > 0) {
              // Calculate fairness score for this solution
              const baseVar = computeVariance(teamTotals);
              const tempTotals = new Map(teamTotals);
              
              for (const ch of bestGreedy) {
                const mt = matchesList[ch.r];
                tempTotals.set(mt.home, (tempTotals.get(mt.home) || 0) + ch.h);
                tempTotals.set(mt.away, (tempTotals.get(mt.away) || 0) + ch.a);
              }
              
              const newVar = computeVariance(tempTotals);
              const fairnessScore = Math.max(0, 100 - (newVar - baseVar) * 10);
              const totalScore = bestGreedy.reduce((sum, ch) => sum + ch.combined, 0);
              
              allSolutions.push({
                assignment: bestGreedy,
                evalScore: bestGreedyEval,
                totalScore,
                fairnessScore
              });
            }
          }
          
          // Select from top 10% solutions randomly (weighted by fairness + score)
          if (allSolutions.length > 0) {
            allSolutions.sort((a, b) => (b.fairnessScore + b.totalScore * 0.1) - (a.fairnessScore + a.totalScore * 0.1));
            const topSolutions = allSolutions.slice(0, Math.max(1, Math.floor(allSolutions.length * 0.1)));
            const selectedSolution = topSolutions[Math.floor(Math.random() * topSolutions.length)];
            
            assignment = selectedSolution.assignment;
            bestEval = selectedSolution.evalScore;
            
            console.log(`🎲 Multi-sample search: Generated ${allSolutions.length} solutions, selected from top ${topSolutions.length} (fairness: ${selectedSolution.fairnessScore.toFixed(1)}, score: ${selectedSolution.totalScore.toFixed(1)})`);
          }
        }

        // Emit plan for week and update team totals for fairness
        for (const asn of assignment) {
          const match = matchesList[asn.r];
          const { venue, timeslot } = slotDetails[asn.c];
          const baseDate = playingWeeks[weekIndex];
          const isMonday = timeslot?.day_of_week === 1;
          const matchDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
          const matchTime = timeslot?.start_time || '19:00';
          plan.push({
            unique_number: `REG-${String(counter).padStart(3, '0')}`,
            speeldag: `Speeldag ${match.matchday}`,
            home_team_id: match.home,
            away_team_id: match.away,
            match_date: matchDate,
            match_time: matchTime,
            venue,
            details: { homeScore: asn.h, awayScore: asn.a, combined: asn.combined, maxCombined: 6 }
          });
          totalCombined += asn.combined; counter++;
          teamTotals.set(match.home, (teamTotals.get(match.home) || 0) + asn.h);
          teamTotals.set(match.away, (teamTotals.get(match.away) || 0) + asn.a);
        }
      }

      // Voeg BYE-rijen toe bij oneven aantal teams: per speeldag 1 team heeft bye
      if (allTeamsSet.size % 2 === 1) {
        const mdList = Array.from(matchesByMatchday.keys()).sort((a, b) => a - b);
        for (const md of mdList) {
          const mdMatches = matchesByMatchday.get(md) || [];
          const present = new Set<number>();
          mdMatches.forEach(m => { present.add(m.home); present.add(m.away); });
          const byeTeam = Array.from(allTeamsSet).find(t => !present.has(t));
          if (typeof byeTeam === 'number') {
            const assignedWeek = matchdayToWeek.get(md) ?? 0;
            const baseDate = playingWeeks[assignedWeek];
            const byeDate = cupService.addDaysToDate(baseDate, 1); // dinsdag
            plan.push({
              unique_number: `BYE-${String(md).padStart(3, '0')}`,
              speeldag: `Speeldag ${md}`,
              home_team_id: byeTeam,
              away_team_id: null,
              match_date: byeDate,
              match_time: '',
              venue: '',
              details: { homeScore: 0, awayScore: 0, combined: 0, maxCombined: 6 }
            });
          }
        }
      }

      // Convert teamTotals map to plain object
      const totalsObj: Record<number, number> = {};
      Array.from(teamTotals.entries()).forEach(([teamId, total]) => { totalsObj[teamId] = total; });
      return { success: true, message: 'Preview competitie gegenereerd', plan, totalCombined, teamTotals: totalsObj };
    } catch (e) {
      console.error('Error previewing competition:', e);
      return { success: false, message: 'Fout bij preview competitie', plan: [] };
    }
  },

  // Genereer meerdere alternatieve previews en geef top X% terug op basis van totale score
  async previewCompetitionTop(
    config: CompetitionConfig,
    samples: number = 40,
    topPercent: number = 0.05
  ): Promise<{ success: boolean; message: string; previews: Array<{ plan: Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string; details: { homeScore: number; awayScore: number; combined: number; maxCombined: number } }>; totalCombined: number }> }> {
    try {
      // Validate basic input
      const inputValidation = this.validateCompetitionInput(config);
      if (!inputValidation.isValid) {
        return { success: false, message: inputValidation.message!, previews: [] };
      }

      // Generate weeks once
      const { weeks: playingWeeks } = await this.generatePlayingWeeks(config);
      if (playingWeeks.length === 0) {
        return { success: false, message: 'Geen beschikbare speelweken', previews: [] };
      }

      // Generate regular matches once
      const regularMatches = this.generateRegularSeasonMatches(config.teams, config.format.regular_rounds);

      // Load preferences and venues once
      const seasonData = await seasonService.getSeasonData();
      const allTeamsData = await teamService.getAllTeams();
      const selectedTeamsSet = new Set(config.teams);
      const teamPreferences = normalizeTeamsPreferences(allTeamsData.filter(t => selectedTeamsSet.has(t.team_id)));
      const venues = seasonData.venues || [];

      // Prepare common structures
      const allTeamsSet = new Set<number>();
      regularMatches.forEach(m => { allTeamsSet.add(m.home); allTeamsSet.add(m.away); });
      const matchesPerMatchday = Math.max(1, Math.floor(allTeamsSet.size / 2));

      const matchesByMatchdayBase = new Map<number, Array<{ home: number; away: number; matchday: number }>>();
      regularMatches.forEach((m, idx) => {
        const matchday = m.matchday || Math.floor(idx / matchesPerMatchday) + 1;
        const arr = matchesByMatchdayBase.get(matchday) || [];
        arr.push({ home: m.home, away: m.away, matchday });
        matchesByMatchdayBase.set(matchday, arr);
      });

      // Preload slot details once (7 slots)
      const totalAvailableSlots = 7;
      const slotDetails: Array<{ venue: string; timeslot: any }> = [];
      for (let s = 0; s < totalAvailableSlots; s++) {
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(s, totalAvailableSlots);
        slotDetails.push({ venue, timeslot });
      }

      // Helper for one preview using prepared data
      const generateOnePreview = async () => {
        const teamsPerWeek: Map<number, Set<number>> = new Map();
        const weekToMatches: Map<number, Array<{ home: number; away: number; matchday: number }>> = new Map();
        for (let w = 0; w < playingWeeks.length; w++) {
          teamsPerWeek.set(w, new Set());
          weekToMatches.set(w, []);
        }

        const matchesByMatchday = new Map(matchesByMatchdayBase);
        let currentWeek = 0;
        const sortedMatchdays = Array.from(matchesByMatchday.keys()).sort((a, b) => a - b);
        const matchdayToWeek: Map<number, number> = new Map();

        for (const md of sortedMatchdays) {
          const mdMatches = matchesByMatchday.get(md)!;
          for (const m of mdMatches) {
            let placed = false;
            for (let w = currentWeek; w < playingWeeks.length; w++) {
              const teamSet = teamsPerWeek.get(w)!;
              const list = weekToMatches.get(w)!;
              if (list.length >= 7) continue;
              if (teamSet.has(m.home) || teamSet.has(m.away)) continue;
              teamSet.add(m.home); teamSet.add(m.away);
              list.push(m);
              if (!matchdayToWeek.has(md)) matchdayToWeek.set(md, w);
              placed = true; break;
            }
            if (!placed) {
              return { plan: [], totalCombined: -1 };
            }
          }
          while (currentWeek < playingWeeks.length && (weekToMatches.get(currentWeek)!.length >= 7)) currentWeek++;
        }

        // Score matrix per week and stochastic assignment (same rules as previewCompetition)
        const plan: Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string; details: { homeScore: number; awayScore: number; combined: number; maxCombined: number } } > = [];
        let totalCombined = 0;

        // Helpers
        const combinations = (arr: number[], k: number): number[][] => {
          const res: number[][] = []; const back = (start: number, path: number[]) => {
            if (path.length === k) { res.push([...path]); return; }
            for (let i = start; i < arr.length; i++) { path.push(arr[i]); back(i + 1, path); path.pop(); }
          }; back(0, []); return res;
        };
        const permutations = (arr: number[]): number[][] => {
          const res: number[][] = []; const used = new Array(arr.length).fill(false); const path: number[] = [];
          const back = () => { if (path.length === arr.length) { res.push([...path]); return; } for (let i = 0; i < arr.length; i++) { if (used[i]) continue; used[i] = true; path.push(arr[i]); back(); path.pop(); used[i] = false; } };
          back(); return res;
        };
        const shuffle = (arr: number[]) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };

        let counter = 1;
        for (const [weekIndex, matchesList] of weekToMatches.entries()) {
          const m = matchesList.length;
          if (m === 0) continue;

          // Build score matrix m x 7
          const scoreMatrix: Array<Array<{ combined: number; h: number; a: number }>> = [];
          for (let r = 0; r < m; r++) {
            const { home, away } = matchesList[r];
            const row: Array<{ combined: number; h: number; a: number }> = [];
            for (let c = 0; c < totalAvailableSlots; c++) {
              const { venue, timeslot } = slotDetails[c];
              const hRes = scoreTeamForDetails(teamPreferences.get(home), timeslot, venue, venues);
              const aRes = scoreTeamForDetails(teamPreferences.get(away), timeslot, venue, venues);
              row.push({ combined: (hRes.score as number) + (aRes.score as number), h: hRes.score as number, a: aRes.score as number });
            }
            scoreMatrix.push(row);
          }

          const allSlots = Array.from({ length: totalAvailableSlots }, (_, i) => i);
          let assignment: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
          let bestSum = -1;
          if (m <= totalAvailableSlots && m <= 7) {
            const slotCombos = combinations(allSlots, m);
            for (const slots of slotCombos) {
              const perms = permutations(slots);
              for (const perm of perms) {
                let sum = 0; const chosen: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
                for (let r = 0; r < m; r++) {
                  const c = perm[r]; const s = scoreMatrix[r][c]; sum += s.combined; chosen.push({ r, c, h: s.h, a: s.a, combined: s.combined });
                }
                if (sum > bestSum || (sum === bestSum && Math.random() < 0.5)) { bestSum = sum; assignment = chosen; }
              }
            }
          }

          if (assignment.length === 0) {
            const attempts = 10 + Math.floor(Math.random() * 5);
            let bestGreedy: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
            let bestGreedySum = -1;
            for (let attempt = 0; attempt < attempts; attempt++) {
              const order = shuffle(Array.from({ length: m }, (_, i) => i));
              const used = new Set<number>();
              const chosen: Array<{ r: number; c: number; h: number; a: number; combined: number }> = [];
              for (const r of order) {
                let bestC = -1, best = -1, bh = 0, ba = 0;
                for (let c = 0; c < totalAvailableSlots; c++) {
                  if (used.has(c)) continue;
                  const s = scoreMatrix[r][c];
                  const jitter = Math.random() * 0.0001;
                  if (s.combined + jitter > best) { best = s.combined + jitter; bestC = c; bh = s.h; ba = s.a; }
                }
                if (bestC === -1) { for (let c = 0; c < totalAvailableSlots; c++) { if (!used.has(c)) { bestC = c; const s = scoreMatrix[r][c]; bh = s.h; ba = s.a; best = s.combined; break; } } }
                used.add(bestC);
                chosen.push({ r, c: bestC, h: bh, a: ba, combined: scoreMatrix[r][bestC].combined });
              }
              const trueSum = chosen.reduce((acc, ch) => acc + scoreMatrix[ch.r][ch.c].combined, 0);
              if (trueSum > bestGreedySum || (trueSum === bestGreedySum && Math.random() < 0.5)) { bestGreedySum = trueSum; bestGreedy = chosen; }
            }
            assignment = bestGreedy;
            bestSum = bestGreedySum;
          }

          // Emit plan for week
          for (const asn of assignment) {
            const match = matchesList[asn.r];
            const { venue, timeslot } = slotDetails[asn.c];
            const baseDate = playingWeeks[weekIndex];
            const isMonday = timeslot?.day_of_week === 1;
            const matchDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
            const matchTime = timeslot?.start_time || '19:00';
            plan.push({
              unique_number: `REG-${String(counter).padStart(3, '0')}`,
              speeldag: `Speeldag ${match.matchday}`,
              home_team_id: match.home,
              away_team_id: match.away,
              match_date: matchDate,
              match_time: matchTime,
              venue,
              details: { homeScore: asn.h, awayScore: asn.a, combined: asn.combined, maxCombined: 6 }
            });
            totalCombined += asn.combined; counter++;
          }
        }

        // BYE rows (Tuesday date)
        if (allTeamsSet.size % 2 === 1) {
          const mdList = Array.from(matchesByMatchdayBase.keys()).sort((a, b) => a - b);
          for (const md of mdList) {
            const mdMatches = matchesByMatchdayBase.get(md) || [];
            const present = new Set<number>();
            mdMatches.forEach(m => { present.add(m.home); present.add(m.away); });
            const byeTeam = Array.from(allTeamsSet).find(t => !present.has(t));
            if (typeof byeTeam === 'number') {
              const assignedWeek = matchdayToWeek.get(md) ?? 0;
              const baseDate = playingWeeks[assignedWeek];
              const byeDate = cupService.addDaysToDate(baseDate, 1);
              plan.push({
                unique_number: `BYE-${String(md).padStart(3, '0')}`,
                speeldag: `Speeldag ${md}`,
                home_team_id: byeTeam,
                away_team_id: null,
                match_date: byeDate,
                match_time: '',
                venue: '',
                details: { homeScore: 0, awayScore: 0, combined: 0, maxCombined: 6 }
              });
            }
          }
        }

        return { plan, totalCombined };
      };

      // Generate multiple previews and select top X%
      const results: Array<{ plan: any[]; totalCombined: number }> = [];
      const runs = Math.max(1, samples);
      for (let i = 0; i < runs; i++) {
        const res = await generateOnePreview();
        if (res.plan.length > 0) results.push(res);
      }

      if (results.length === 0) {
        return { success: false, message: 'Geen alternatieven beschikbaar', previews: [] };
      }

      results.sort((a, b) => b.totalCombined - a.totalCombined);
      const topCount = Math.max(1, Math.ceil(results.length * Math.max(0.01, Math.min(1, topPercent))));
      const top = results.slice(0, topCount);
      return { success: true, message: `Top ${topCount}/${results.length} alternatieven`, previews: top };
    } catch (e) {
      console.error('Error generating top previews:', e);
      return { success: false, message: 'Fout bij genereren top previews', previews: [] };
    }
  },

  async createCompetitionFromPlan(plan: Array<{ unique_number: string; speeldag: string; home_team_id: number; away_team_id: number | null; match_date: string; match_time: string; venue: string }>): Promise<{ success: boolean; message: string }> {
    try {
      // Verwijder BYE-rijen (away_team_id === null) bij import
      const filteredPlan = plan.filter(p => p.away_team_id !== null);
      const uniqueNumbers = filteredPlan.map(p => p.unique_number);
      if (uniqueNumbers.length > 0) {
        const { error: delError } = await supabase
          .from('matches')
          .delete()
          .in('unique_number', uniqueNumbers)
          .eq('is_cup_match', false);
        if (delError) console.warn('Warning: could not clear competition matches before import', delError);
      }

      const rows = filteredPlan.map(p => this.createMatchObject(
        p.unique_number,
        p.speeldag,
        p.home_team_id,
        p.away_team_id,
        localDateTimeToISO(p.match_date, p.match_time),
        p.venue
      ));

      const { error } = await supabase.from('matches').insert(rows);
      if (error) throw error;
      return { success: true, message: 'Competitieplan geïmporteerd' };
    } catch (e) {
      console.error('Error importing competition plan:', e);
      return { success: false, message: 'Fout bij importeren competitieplan' };
    }
  },

  // Hoofdfunctie voor het genereren van competitie
  async generateCompetition(config: CompetitionConfig): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🏆 Start competitie generatie:', config);

      // Validaties
      const inputValidation = this.validateCompetitionInput(config);
      if (!inputValidation.isValid) {
        return { success: false, message: inputValidation.message! };
      }

      const existingCompetition = await this.checkExistingCompetition();
      if (existingCompetition.exists) {
        return { success: false, message: existingCompetition.message! };
      }

      const seasonValidation = await this.validateSeasonData();
      if (!seasonValidation.isValid) {
        return { success: false, message: seasonValidation.message! };
      }

      // Genereer automatisch speelweken
      const { weeks: playingWeeks, message: weeksMessage } = await this.generatePlayingWeeks(config);
      if (playingWeeks.length === 0) {
        return { success: false, message: "Geen beschikbare speelweken gevonden. Controleer seizoen data, bekerwedstrijden en vakanties." };
      }
      
      console.log('📅 Automatisch gegenereerde speelweken:', playingWeeks);
      console.log(weeksMessage);

      // Bereken reguliere competitie wedstrijden
      const regularMatches = this.generateRegularSeasonMatches(config.teams, config.format.regular_rounds);
      const totalRegularMatches = regularMatches.length;
      const weeksNeeded = this.calculateWeeksNeeded(totalRegularMatches, 7);
      
      console.log(`⚽ Reguliere wedstrijden: ${totalRegularMatches} (${weeksNeeded} weken nodig)`);
      
      // Controleer of we genoeg weken hebben
      if (playingWeeks.length < weeksNeeded) {
        const teamsCount = config.teams.length;
        const roundsCount = config.format.regular_rounds;
        
        // Bereken alternatieven
        const alternatives = [];
        
        // Optie 1: Verminder teams
        if (teamsCount > 8) {
          const reducedTeams = Math.max(8, teamsCount - 2);
          const reducedMatches = this.calculateRegularMatches(Array(reducedTeams).fill(0), roundsCount);
          const reducedWeeks = this.calculateWeeksNeeded(reducedMatches, 7);
          alternatives.push(`- Verminder naar ${reducedTeams} teams: ${reducedWeeks} weken nodig`);
        }
        
        // Optie 2: Verminder teams (reguliere competitie is altijd 1 ronde)
        if (teamsCount > 12) {
          const reducedTeams = Math.max(12, teamsCount - 2);
          const reducedMatches = this.calculateRegularMatches(Array(reducedTeams).fill(0), 1);
          const reducedWeeks = this.calculateWeeksNeeded(reducedMatches, 7);
          alternatives.push(`- Verminder naar ${reducedTeams} teams: ${reducedWeeks} weken nodig`);
        }
        
        // Optie 3: Meer wedstrijden per week
        const moreMatchesPerWeek = this.calculateWeeksNeeded(totalRegularMatches, 8);
        if (moreMatchesPerWeek <= playingWeeks.length) {
          alternatives.push(`- Speel 8 wedstrijden per week: ${moreMatchesPerWeek} weken nodig`);
        }
        
        const alternativesText = alternatives.length > 0 ? `\n\nAlternatieven:\n${alternatives.join('\n')}` : '';
        
        return { 
          success: false, 
          message: `Niet genoeg speelweken beschikbaar voor ${teamsCount} teams in reguliere competitie. ` +
                   `Nodig: ${weeksNeeded} weken, Beschikbaar: ${playingWeeks.length} weken. ` +
                   `Voor 4 maanden (16-18 weken) kun je maximaal ${Math.floor(playingWeeks.length * 7 / (teamsCount * (teamsCount - 1) / 2))} teams spelen.` +
                   alternativesText
        };
      }

      // Laad teamvoorkeuren en normaliseer
      const allTeamsData = await teamService.getAllTeams();
      const selectedTeamsSet = new Set(config.teams);
      const teamPreferencesRaw = allTeamsData.filter(t => selectedTeamsSet.has(t.team_id));
      const teamPreferences = normalizeTeamsPreferences(teamPreferencesRaw);

      // Verdeel reguliere wedstrijden over weken met voorkeur-scoring
      const distributedRegularMatches = await this.distributeMatchesOverWeeks(regularMatches, playingWeeks, {
        teamPreferences,
        venues: seasonValidation.data?.venues,
        dayNames: seasonValidation.data?.day_names,
      });
      console.log(`📊 Verdeelde reguliere wedstrijden: ${distributedRegularMatches.length}`);

      // Genereer alle wedstrijd objecten voor reguliere competitie
      const regularSeasonMatches = [];
      let matchCounter = 1;

      for (const distributedMatch of distributedRegularMatches) {
        const { match, week, slot } = distributedMatch;
        
        // Haal venue en timeslot op basis van prioriteit
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(slot, 7);
        
        // Bepaal correcte datum
        const baseDate = playingWeeks[week];
        const isMonday = timeslot?.day_of_week === 1;
        const matchDate = isMonday ? baseDate : this.addDaysToDate(baseDate, 1);
        
        // Format match datum met tijd (UTC opslag, behoud lokale kloktijd)
        const matchDateTime = localDateTimeToISO(matchDate, timeslot?.start_time || '19:00');
        
        // Gebruik de correcte speeldag van het round-robin algoritme
        const matchday = match.matchday || Math.floor((matchCounter - 1) / 8) + 1;
        
        console.log(`🎯 Reguliere wedstrijd ${matchCounter}: Week ${week + 1}, Speeldag ${matchday}, ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${slot + 1}, ${venue} (Team ${match.home} vs Team ${match.away})`);
        
        regularSeasonMatches.push(this.createMatchObject(
          `REG-${matchCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          `Speeldag ${matchday}`, // Gebruik correct speeldag nummer van round-robin
          match.home,
          match.away,
          matchDateTime,
          venue
        ));
        
        matchCounter++;
      }

      // Playoff wedstrijden worden later apart gegenereerd
      let playoffMatches = [];
      console.log(`🏆 Playoff wedstrijden worden later apart gegenereerd op basis van eindstand`);

      // Sla alle wedstrijden op in database
      const allMatches = [...regularSeasonMatches, ...playoffMatches];
      
      try {
        const { error } = await supabase
          .from('matches')
          .insert(allMatches);

        if (error) {
          console.error('❌ Fout bij opslaan wedstrijden:', error);
          return { success: false, message: `Fout bij opslaan: ${error.message}` };
        }
      } catch (error) {
        console.error('❌ Fout bij opslaan wedstrijden:', error);
        return { success: false, message: `Fout bij opslaan: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
      }

      console.log(`✅ Reguliere competitie succesvol gegenereerd: ${regularSeasonMatches.length} wedstrijden`);
      
      return { 
        success: true, 
        message: `Reguliere competitie succesvol gegenereerd! ${regularSeasonMatches.length} wedstrijden. Playoffs kunnen later apart worden gegenereerd op basis van de eindstand. ${weeksMessage}` 
      };

    } catch (error) {
      console.error('❌ Fout bij genereren competitie:', error);
      return { 
        success: false, 
        message: `Fout bij genereren competitie: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Haal alle competitie wedstrijden op
  async getCompetitionMatches(): Promise<CompetitionMatch[]> {
    try {
      // Gebruik basis kolommen voor compatibiliteit
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          unique_number,
          home_team_id,
          away_team_id,
          match_date,
          location,
          speeldag,
          is_submitted,
          is_locked,
          referee,
          referee_notes,
          home_score,
          away_score
        `)
        .eq('is_cup_match', false)
        .order('match_date');

      if (error) {
        console.error('Error fetching competition matches:', error);
        throw error;
      }

      // Map data en detecteer playoff wedstrijden uit speeldag veld
      return (data || []).map((match: any) => {
        const isPlayoff = match.speeldag?.includes('[PLAYOFF:');
        let playoffRound: string | undefined;
        let playoffPosition: string | undefined;
        
        if (isPlayoff) {
          // Extraheer playoff informatie uit speeldag
          const playoffMatch = match.speeldag.match(/\[PLAYOFF: ([^\]]+)\]/);
          playoffRound = playoffMatch ? playoffMatch[1] : undefined;
          playoffPosition = `pos_${match.match_id}`;
        }

        return {
          ...match,
          is_playoff_match: isPlayoff,
          playoff_round: playoffRound,
          playoff_position: playoffPosition
        };
      });
    } catch (error) {
      console.error('Error fetching competition matches:', error);
      throw error;
    }
  },

  // Verwijder competitie
  async deleteCompetition(): Promise<{ success: boolean; message: string }> {
    try {
      // Eerst alle match IDs ophalen voor competitie wedstrijden
      const { data: matchIds, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .eq('is_cup_match', false);

      if (fetchError) {
        console.error('Error fetching match IDs:', fetchError);
        return { success: false, message: `Fout bij ophalen wedstrijd IDs: ${fetchError.message}` };
      }

      if (matchIds && matchIds.length > 0) {
        // Alle gerelateerde team_costs records verwijderen
        const { error: teamCostsError } = await supabase
          .from('team_costs')
          .delete()
          .in('match_id', matchIds.map(m => m.match_id));

        if (teamCostsError) {
          console.error('Error deleting team costs:', teamCostsError);
          return { success: false, message: `Fout bij verwijderen team kosten: ${teamCostsError.message}` };
        }
      }

      // Dan de wedstrijden verwijderen
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('is_cup_match', false);

      if (error) {
        console.error('Error deleting competition:', error);
        return { success: false, message: `Fout bij verwijderen: ${error.message}` };
      }

      return { success: true, message: "Competitie succesvol verwijderd" };
    } catch (error) {
      console.error('Error deleting competition:', error);
      return { 
        success: false, 
        message: `Fout bij verwijderen competitie: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Update competitie wedstrijd
  async updateCompetitionMatch(matchId: number, updateData: Partial<CompetitionMatch>): Promise<{ success: boolean; message: string }> {
    try {
      // Filter playoff velden uit voor database compatibiliteit
      const { is_playoff_match, playoff_round, playoff_position, ...databaseUpdateData } = updateData as any;
      
      const { error } = await supabase
        .from('matches')
        .update(databaseUpdateData)
        .eq('match_id', matchId)
        .eq('is_cup_match', false);

      if (error) {
        console.error('Error updating competition match:', error);
        return { success: false, message: `Fout bij updaten: ${error.message}` };
      }

      return { success: true, message: "Wedstrijd succesvol bijgewerkt" };
    } catch (error) {
      console.error('Error updating competition match:', error);
      return { 
        success: false, 
        message: `Fout bij updaten wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Verwijder playoff wedstrijden
  async deletePlayoffMatches(): Promise<{ success: boolean; message: string }> {
    try {
      // Eerst alle playoff match IDs ophalen
      const { data: playoffMatchIds, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .like('speeldag', '%[PLAYOFF:%');

      if (fetchError) {
        console.error('Error fetching playoff match IDs:', fetchError);
        return { success: false, message: `Fout bij ophalen playoff wedstrijd IDs: ${fetchError.message}` };
      }

      if (playoffMatchIds && playoffMatchIds.length > 0) {
        // Alle gerelateerde team_costs records verwijderen
        const { error: teamCostsError } = await supabase
          .from('team_costs')
          .delete()
          .in('match_id', playoffMatchIds.map(m => m.match_id));

        if (teamCostsError) {
          console.error('Error deleting playoff team costs:', teamCostsError);
          return { success: false, message: `Fout bij verwijderen playoff team kosten: ${teamCostsError.message}` };
        }
      }

      // Dan de playoff wedstrijden verwijderen
      const { error } = await supabase
        .from('matches')
        .delete()
        .like('speeldag', '%[PLAYOFF:%');

      if (error) {
        console.error('Error deleting playoff matches:', error);
        return { success: false, message: `Fout bij verwijderen: ${error.message}` };
      }

      return { success: true, message: "Playoff wedstrijden succesvol verwijderd" };
    } catch (error) {
      console.error('Error deleting playoff matches:', error);
      return { 
        success: false, 
        message: `Fout bij verwijderen playoff wedstrijden: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Genereer beschikbare speelweken voor playoffs (zonder weekbehoefte-berekening)
  async generatePlayoffWeeks(start_date: string, end_date: string): Promise<string[]> {
    return playoffService.generatePlayoffWeeks(start_date, end_date);
  },

  // Genereer rondes voor playoffs met configurable aantal rondes
  generatePlayoffRoundMatchesCustom(teams: number[], roundType: string, rounds: number): Array<{ home: number; away: number; round: string }> {
    const matches: Array<{ home: number; away: number; round: string }> = [];
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          if (round % 2 === 1) {
            matches.push({ home: teams[i], away: teams[j], round: `${roundType}_r${round}` });
          } else {
            matches.push({ home: teams[j], away: teams[i], round: `${roundType}_r${round}` });
          }
        }
      }
    }
    return matches;
  },

  // Genereer en sla playoff wedstrijden op volgens 7 slots/week, met venue/tijd
  async generateAndSavePlayoffs(
    topTeams: number[],
    bottomTeams: number[],
    rounds: number,
    start_date: string,
    end_date: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const seasonValidation = await this.validateSeasonData();
      if (!seasonValidation.isValid) {
        return { success: false, message: seasonValidation.message! };
      }

      const playingWeeks = await this.generatePlayoffWeeks(start_date, end_date);
      if (playingWeeks.length === 0) {
        return { success: false, message: "Geen beschikbare speelweken binnen de geselecteerde periode." };
      }

      const topMatches = this.generatePlayoffRoundMatchesCustom(topTeams, 'top_playoff', rounds);
      const bottomMatches = this.generatePlayoffRoundMatchesCustom(bottomTeams, 'bottom_playoff', rounds);

      // Interleave top/bottom
      const allMatches: Array<{ home: number; away: number; round: string }> = [];
      const maxLen = Math.max(topMatches.length, bottomMatches.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < topMatches.length) allMatches.push(topMatches[i]);
        if (i < bottomMatches.length) allMatches.push(bottomMatches[i]);
      }

      // Distributie met 7 slots/week, geen team 2x per week, met voorkeur-scoring
      const matchesPerWeek = 7;
      const teamsPerWeek: Map<number, Set<number>> = new Map();
      const slotsPerWeek: Map<number, number> = new Map();
      for (let w = 0; w < playingWeeks.length; w++) {
        teamsPerWeek.set(w, new Set());
        slotsPerWeek.set(w, 0);
      }

      const placed: Array<{ match: { home: number; away: number; round: string }; week: number; slot: number }> = [];

      // Laad teamvoorkeuren voor alle betrokken teams
      const allTeamsData = await teamService.getAllTeams();
      const involvedTeams = new Set<number>([...topTeams, ...bottomTeams]);
      const teamPrefs = normalizeTeamsPreferences(allTeamsData.filter(t => involvedTeams.has(t.team_id)));
      const venues = seasonValidation.data?.venues || [];

      for (const m of allMatches) {
        // Kies beste week obv score voor slot = slotsUsed
        let bestWeek: number | null = null;
        let bestSlotForWeek = 0;
        let bestScore = -1;
        for (let w = 0; w < playingWeeks.length; w++) {
          const weekTeams = teamsPerWeek.get(w)!;
          const slotsUsed = slotsPerWeek.get(w)!;
          if (slotsUsed >= matchesPerWeek) continue;
          if (weekTeams.has(m.home) || weekTeams.has(m.away)) continue;

          const slotIndex = slotsUsed;
          const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, 7);
          const h = scoreTeamForDetails(teamPrefs.get(m.home), timeslot, venue, venues);
          const a = scoreTeamForDetails(teamPrefs.get(m.away), timeslot, venue, venues);
          const combined = h.score + a.score;
          if (combined > bestScore) {
            bestScore = combined;
            bestWeek = w;
            bestSlotForWeek = slotIndex;
          }
        }

        if (bestWeek !== null) {
          const weekTeams = teamsPerWeek.get(bestWeek)!;
          weekTeams.add(m.home); weekTeams.add(m.away);
          teamsPerWeek.set(bestWeek, weekTeams);
          slotsPerWeek.set(bestWeek, bestSlotForWeek + 1);
          placed.push({ match: m, week: bestWeek, slot: bestSlotForWeek });
        } else {
          return { success: false, message: "Onvoldoende weken/slots om alle playoff wedstrijden in te plannen." };
        }
      }

      // Maak DB records
      const matchInserts: any[] = [];
      let counter = 1;
      for (const { match, week, slot } of placed) {
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(slot, 7);
        const baseDate = playingWeeks[week];
        const isMonday = timeslot?.day_of_week === 1;
        const matchDate = isMonday ? baseDate : this.addDaysToDate(baseDate, 1);
        const matchDateTime = localDateTimeToISO(matchDate, timeslot?.start_time || '19:00');

        matchInserts.push(this.createMatchObject(
          `PO-${counter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          `Playoff`,
          match.home,
          match.away,
          matchDateTime,
          venue,
          true,
          match.round
        ));
        counter++;
      }

      const { error } = await supabase.from('matches').insert(matchInserts);
      if (error) {
        console.error('Fout bij opslaan playoff wedstrijden:', error);
        return { success: false, message: `Fout bij opslaan: ${error.message}` };
      }

      return { success: true, message: `${matchInserts.length} playoff wedstrijden succesvol aangemaakt.` };
    } catch (e) {
      console.error('Fout bij genereren playoffs:', e);
      return { success: false, message: e instanceof Error ? e.message : 'Onbekende fout' };
    }
  }
};