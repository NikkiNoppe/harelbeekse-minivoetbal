import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO } from "@/lib/dateUtils";
import { seasonService } from "@/services/seasonService";
import { priorityOrderService } from "@/services/priorityOrderService";
import { teamService } from "@/services/core/teamService";
import { normalizeTeamsPreferences, scoreTeamForDetails } from "@/services/core/teamPreferencesService";

export interface PlayoffMatch {
  match_id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  home_position: number | null;
  away_position: number | null;
  playoff_type: string | null;
  is_playoff_finalized: boolean;
  match_date: string;
  location: string | null;
  speeldag: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team_name?: string;
  away_team_name?: string;
}

export const playoffService = {
  addDaysToDate(dateStr: string, days: number): string {
    // Parse als lokale datum om DST problemen te voorkomen
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
  },

  async validateSeasonData(): Promise<{ isValid: boolean; message?: string; data?: any }> {
    const seasonData = await seasonService.getSeasonData();
    const venues = seasonData.venues || [];
    const timeslots = seasonData.venue_timeslots || [];
    if (venues.length === 0) return { isValid: false, message: "Geen venues beschikbaar in de database. Configureer eerst de competitiedata." };
    if (timeslots.length === 0) return { isValid: false, message: "Geen tijdslots beschikbaar in de database. Configureer eerst de competitiedata." };
    return { isValid: true, data: { venues, timeslots } };
  },

  splitTopBottomByRanking(teamsInRankingOrder: number[]): { top: number[]; bottom: number[] } {
    const total = teamsInRankingOrder.length;
    const half = Math.floor(total / 2);
    const top = teamsInRankingOrder.slice(0, half);
    const bottom = teamsInRankingOrder.slice(half);
    return { top, bottom };
  },

  // Round-robin algoritme voor posities (Circle Method) - hergebruikt competitie logica
  // Retourneert matches gegroepeerd per speeldag zodat elk team/positie max 1x per speeldag speelt
  generatePlayoffRoundRobinMatches(
    positions: number[], 
    playoffType: 'top' | 'bottom', 
    rounds: number
  ): Array<{ home_position: number; away_position: number; round: string; matchday: number }> {
    const matches: Array<{ home_position: number; away_position: number; round: string; matchday: number }> = [];
    const originalPositions = [...positions];
    const originalCount = originalPositions.length;
    const isOdd = originalCount % 2 !== 0;
    const BYE_POSITION = -1;

    // Werkset voor algoritme (voeg BYE toe bij oneven aantal)
    const arr = isOdd ? [...originalPositions, BYE_POSITION] : [...originalPositions];
    const n = arr.length; // even

    console.log(`🏆 Genereer playoff round-robin voor ${originalCount} posities${isOdd ? ' (met BYE)' : ''}: [${originalPositions.join(', ')}]`);

    const numMatchdays = n - 1; // Bij 8 teams: 7 speeldagen, bij 7 teams (+BYE=8): 7 speeldagen

    for (let round = 1; round <= rounds; round++) {
      // Reset arr voor elke ronde
      const roundArr = isOdd ? [...originalPositions, BYE_POSITION] : [...originalPositions];
      
      for (let matchday = 1; matchday <= numMatchdays; matchday++) {
        const globalMatchday = (round - 1) * numMatchdays + matchday;
        
        for (let i = 0; i < n / 2; i++) {
          const home = roundArr[i];
          const away = roundArr[n - 1 - i];
          
          // Skip BYE matches
          if (home === BYE_POSITION || away === BYE_POSITION) continue;
          
          // Alternate home/away between rounds
          if (round % 2 === 1) {
            matches.push({ 
              home_position: home, 
              away_position: away, 
              round: `${playoffType}_playoff_r${round}`,
              matchday: globalMatchday
            });
          } else {
            matches.push({ 
              home_position: away, 
              away_position: home, 
              round: `${playoffType}_playoff_r${round}`,
              matchday: globalMatchday
            });
          }
        }

        // Rotate (houd index 0 vast) - Circle Method
        const last = roundArr.pop() as number;
        roundArr.splice(1, 0, last);
      }
    }

    console.log(`✅ Playoff ${playoffType}: ${matches.length} wedstrijden gegenereerd over ${numMatchdays * rounds} speeldagen`);
    return matches;
  },

  // Legacy functie - behouden voor backward compatibility
  generatePositionBasedMatches(
    positions: number[], 
    playoffType: 'top' | 'bottom', 
    rounds: number
  ): Array<{ home_position: number; away_position: number; round: string }> {
    // Delegate naar nieuwe round-robin functie
    return this.generatePlayoffRoundRobinMatches(positions, playoffType, rounds)
      .map(({ home_position, away_position, round }) => ({ home_position, away_position, round }));
  },

  generatePlayoffRoundMatches(teams: number[], roundType: string): Array<{ home: number; away: number; round: string }> {
    const matches: Array<{ home: number; away: number; round: string }> = [];
    for (let round = 1; round <= 2; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          if (round === 1) {
            matches.push({ home: teams[i], away: teams[j], round: `${roundType}_r${round}` });
          } else {
            matches.push({ home: teams[j], away: teams[i], round: `${roundType}_r${round}` });
          }
        }
      }
    }
    return matches;
  },

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

  async generatePlayoffWeeks(start_date: string, end_date: string): Promise<string[]> {
    const seasonData = await seasonService.getSeasonData();
    const vacations = seasonData.vacation_periods || [];
    
    // Parse als lokale datum (niet UTC!) om DST problemen te voorkomen
    const [startYear, startMonth, startDay] = start_date.split('-').map(Number);
    const [endYear, endMonth, endDay] = end_date.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    
    const weeks: string[] = [];
    let currentDate = new Date(startDate);
    
    // Normaliseer naar maandag van de startweek
    const dow = currentDate.getDay();
    const daysToMonday = dow === 0 ? -6 : 1 - dow;
    currentDate.setDate(currentDate.getDate() + daysToMonday);
    
    // Load existing non-playoff matches to avoid conflicts
    const { data: existingMatchesAll } = await supabase
      .from('matches')
      .select('match_date')
      .eq('is_playoff_match', false)
      .order('match_date');
    
    const existingMondays = new Set<string>();
    (existingMatchesAll || []).forEach((m: any) => {
      if (!m?.match_date) return;
      // Parse match date en normaliseer naar maandag (lokale tijd)
      const matchDate = new Date(m.match_date);
      const monday = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      const mdow = monday.getDay();
      const mdelta = mdow === 0 ? -6 : 1 - mdow;
      monday.setDate(monday.getDate() + mdelta);
      
      const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      existingMondays.add(mondayStr);
    });

    while (currentDate <= endDate) {
      const weekYear = currentDate.getFullYear();
      const weekMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const weekDay = String(currentDate.getDate()).padStart(2, '0');
      const weekDateStr = `${weekYear}-${weekMonth}-${weekDay}`;
      
      // Check vakantie - gebruik lokale datum parsing
      const isVacation = vacations.some((vacation: any) => {
        if (!vacation.is_active) return false;
        const [vStartY, vStartM, vStartD] = vacation.start_date.split('-').map(Number);
        const [vEndY, vEndM, vEndD] = vacation.end_date.split('-').map(Number);
        const vacStart = new Date(vStartY, vStartM - 1, vStartD);
        const vacEnd = new Date(vEndY, vEndM - 1, vEndD);
        return currentDate >= vacStart && currentDate <= vacEnd;
      });
      
      const hasConflict = existingMondays.has(weekDateStr);
      
      if (!isVacation && !hasConflict) {
        weeks.push(weekDateStr);
      }
      
      // Ga naar volgende week (maandag)
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return weeks;
  },

  // Calculate which position has BYE for a given matchday (for odd number of teams)
  getByePositionForMatchday(
    positions: number[], 
    matchday: number
  ): number | null {
    if (positions.length % 2 === 0) return null; // No bye with even number
    
    const BYE_POSITION = -1;
    const arr = [...positions, BYE_POSITION];
    const n = arr.length;
    const numMatchdays = n - 1;
    
    // Normalize matchday to single round
    const normalizedMatchday = ((matchday - 1) % numMatchdays) + 1;
    
    // Simulate round-robin rotation to this matchday
    for (let day = 1; day < normalizedMatchday; day++) {
      const last = arr.pop()!;
      arr.splice(1, 0, last);
    }
    
    // Find which real position plays against BYE
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home === BYE_POSITION) return away;
      if (away === BYE_POSITION) return home;
    }
    return null;
  },

  // Get BYE info for all playoff matchdays
  getByeInfoForPlayoffs(
    bottomPositions: number[],
    rounds: number
  ): Map<number, number> {
    const byeInfo = new Map<number, number>();
    if (bottomPositions.length % 2 === 0) return byeInfo; // No bye needed
    
    const numMatchdays = bottomPositions.length; // With BYE added it becomes even, so n-1 = positions.length
    const totalMatchdays = numMatchdays * rounds;
    
    for (let matchday = 1; matchday <= totalMatchdays; matchday++) {
      const byePosition = this.getByePositionForMatchday(bottomPositions, matchday);
      if (byePosition) byeInfo.set(matchday, byePosition);
    }
    return byeInfo;
  },

  // Get timeslots filtered by day of week
  async getTimeslotsForDay(dayOfWeek: number): Promise<Array<{ time: string; venue: string }>> {
    const seasonData = await seasonService.getSeasonData();
    const timeslots = seasonData.venue_timeslots || [];
    const venues = seasonData.venues || [];
    
    return timeslots
      .filter((ts: any) => ts.day_of_week === dayOfWeek)
      .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99))
      .map((ts: any) => {
        const venue = venues.find((v: any) => v.venue_id === ts.venue_id);
        return {
          time: ts.start_time,
          venue: ts.venue_name || venue?.name || 'Onbekend'
        };
      });
  },

  // NEW: Generate position-based playoffs (concept planning)
  // Uses round-robin algorithm: each matchday, every position plays max 1 match
  // Top 8: 4 matches per matchday on MONDAY, Bottom 7: 3 matches per matchday on TUESDAY (1 bye)
  async generatePositionBasedPlayoffs(
    topPositions: number[], // e.g. [1,2,3,4,5,6,7,8] for top 8
    bottomPositions: number[], // e.g. [9,10,11,12,13,14,15] for bottom 7
    rounds: number,
    start_date: string,
    end_date: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const seasonValidation = await this.validateSeasonData();
      if (!seasonValidation.isValid) return { success: false, message: seasonValidation.message! };
      
      const playingWeeks = await this.generatePlayoffWeeks(start_date, end_date);
      if (playingWeeks.length === 0) return { success: false, message: "Geen beschikbare speelweken binnen de geselecteerde periode." };

      // Get timeslots per day - PO1 on Monday (day 1), PO2 on Tuesday (day 2)
      const mondaySlots = await this.getTimeslotsForDay(1);
      const tuesdaySlots = await this.getTimeslotsForDay(2);
      
      console.log(`📅 Monday slots (for PO1): ${mondaySlots.length}`, mondaySlots);
      console.log(`📅 Tuesday slots (for PO2): ${tuesdaySlots.length}`, tuesdaySlots);

      // Generate position-based matches using round-robin (with proper matchday grouping)
      const topMatches = topPositions.length > 0 
        ? this.generatePlayoffRoundRobinMatches(topPositions, 'top', rounds) 
        : [];
      const bottomMatches = bottomPositions.length > 0 
        ? this.generatePlayoffRoundRobinMatches(bottomPositions, 'bottom', rounds) 
        : [];
      
      // Calculate matchdays per round
      const topMatchdays = (topPositions.length > 0) 
        ? (topPositions.length % 2 === 0 ? topPositions.length - 1 : topPositions.length) 
        : 0;
      const bottomMatchdays = (bottomPositions.length > 0) 
        ? (bottomPositions.length % 2 === 0 ? bottomPositions.length - 1 : bottomPositions.length) 
        : 0;
      const totalMatchdays = Math.max(topMatchdays, bottomMatchdays) * rounds;
      
      console.log(`📊 Playoff planning: Top ${topPositions.length} posities (${topMatchdays} speeldagen/ronde), Bottom ${bottomPositions.length} posities (${bottomMatchdays} speeldagen/ronde)`);
      console.log(`📊 Totaal ${totalMatchdays} speeldagen nodig, ${playingWeeks.length} weken beschikbaar`);
      
      if (playingWeeks.length < totalMatchdays) {
        return { 
          success: false, 
          message: `Onvoldoende weken: ${totalMatchdays} speeldagen nodig, maar slechts ${playingWeeks.length} weken beschikbaar.` 
        };
      }

      // Create combined schedule per matchday
      const matchInserts: any[] = [];
      let counter = 1;

      for (let matchday = 1; matchday <= totalMatchdays; matchday++) {
        const weekIndex = matchday - 1;
        if (weekIndex >= playingWeeks.length) break;
        
        const baseDate = playingWeeks[weekIndex]; // Monday of this week
        
        // Alternate day assignment per matchday for fair distribution
        // Odd matchday: PO1=Monday, PO2=Tuesday
        // Even matchday: PO1=Tuesday, PO2=Monday
        const isOddMatchday = matchday % 2 === 1;
        const po1DayOffset = isOddMatchday ? 0 : 1;  // 0 = Monday, 1 = Tuesday
        const po2DayOffset = isOddMatchday ? 1 : 0;
        const po1Slots = isOddMatchday ? mondaySlots : tuesdaySlots;
        const po2Slots = isOddMatchday ? tuesdaySlots : mondaySlots;
        
        // Get top matches for this matchday
        const topMatchesForDay = topMatches.filter(m => m.matchday === matchday);
        let slotIndex = 0;
        
        for (const match of topMatchesForDay) {
          const slot = po1Slots[slotIndex % po1Slots.length] || { time: '19:00', venue: 'De Dageraad' };
          const po1Date = this.addDaysToDate(baseDate, po1DayOffset);
          const matchDateTime = localDateTimeToISO(po1Date, slot.time);
          
          matchInserts.push({
            unique_number: `PO-${counter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            speeldag: `Playoff Speeldag ${matchday}`,
            home_team_id: null,
            away_team_id: null,
            home_position: match.home_position,
            away_position: match.away_position,
            playoff_type: 'top',
            is_playoff_finalized: false,
            is_playoff_match: true,
            match_date: matchDateTime,
            location: slot.venue,
            is_cup_match: false,
            is_submitted: false,
            is_locked: false
          });
          counter++;
          slotIndex++;
        }
        
        // Get bottom matches for this matchday
        const bottomMatchesForDay = bottomMatches.filter(m => m.matchday === matchday);
        slotIndex = 0;
        
        for (const match of bottomMatchesForDay) {
          const slot = po2Slots[slotIndex % po2Slots.length] || { time: '18:30', venue: 'De Dageraad' };
          const po2Date = this.addDaysToDate(baseDate, po2DayOffset);
          const matchDateTime = localDateTimeToISO(po2Date, slot.time);
          
          matchInserts.push({
            unique_number: `PO-${counter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            speeldag: `Playoff Speeldag ${matchday}`,
            home_team_id: null,
            away_team_id: null,
            home_position: match.home_position,
            away_position: match.away_position,
            playoff_type: 'bottom',
            is_playoff_finalized: false,
            is_playoff_match: true,
            match_date: matchDateTime,
            location: slot.venue,
            is_cup_match: false,
            is_submitted: false,
            is_locked: false
          });
          counter++;
          slotIndex++;
        }
      }

      const { error } = await supabase.from('matches').insert(matchInserts);
      if (error) return { success: false, message: `Fout bij opslaan: ${error.message}` };
      
      return { 
        success: true, 
        message: `${matchInserts.length} playoff wedstrijden succesvol aangemaakt (concept). PO1/PO2 wisselen wekelijks van dag (ma↔di) voor eerlijke verdeling.` 
      };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Onbekende fout' };
    }
  },

  // NEW: Finalize playoffs - assign actual teams based on current standings
  async finalizePlayoffs(
    standingsMap: Map<number, number> // position -> team_id
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get all non-finalized playoff matches
      const { data: playoffMatches, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('is_playoff_match', true)
        .eq('is_playoff_finalized', false)
        .not('home_position', 'is', null);

      if (fetchError) {
        return { success: false, message: `Fout bij ophalen playoff wedstrijden: ${fetchError.message}` };
      }

      if (!playoffMatches || playoffMatches.length === 0) {
        return { success: false, message: "Geen concept playoff wedstrijden gevonden om te finaliseren." };
      }

      // Update each match with actual team IDs
      let updatedCount = 0;
      for (const match of playoffMatches) {
        const homeTeamId = standingsMap.get(match.home_position);
        const awayTeamId = standingsMap.get(match.away_position);

        if (!homeTeamId || !awayTeamId) {
          console.warn(`Kon geen team vinden voor positie ${match.home_position} of ${match.away_position}`);
          continue;
        }

        const { error: updateError } = await supabase
          .from('matches')
          .update({
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            is_playoff_finalized: true
          })
          .eq('match_id', match.match_id);

        if (updateError) {
          console.error(`Fout bij updaten match ${match.match_id}:`, updateError);
          continue;
        }
        updatedCount++;
      }

      return { 
        success: true, 
        message: `${updatedCount} playoff wedstrijden succesvol gefinaliseerd met echte teams.` 
      };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Onbekende fout' };
    }
  },

  // NEW: Unfinalize playoffs - revert to position-based (clear team assignments)
  async unfinalizePlayoffs(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: playoffMatches, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .eq('is_playoff_match', true)
        .eq('is_playoff_finalized', true);

      if (fetchError) {
        return { success: false, message: `Fout bij ophalen playoff wedstrijden: ${fetchError.message}` };
      }

      if (!playoffMatches || playoffMatches.length === 0) {
        return { success: false, message: "Geen gefinaliseerde playoff wedstrijden gevonden." };
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_team_id: null,
          away_team_id: null,
          is_playoff_finalized: false
        })
        .eq('is_playoff_match', true)
        .eq('is_playoff_finalized', true);

      if (updateError) {
        return { success: false, message: `Fout bij terugzetten: ${updateError.message}` };
      }

      return { 
        success: true, 
        message: `${playoffMatches.length} playoff wedstrijden teruggezet naar concept (posities).` 
      };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Onbekende fout' };
    }
  },

  // NEW: Get playoff matches with team names resolved
  async getPlayoffMatches(): Promise<PlayoffMatch[]> {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        home_team_id,
        away_team_id,
        home_position,
        away_position,
        playoff_type,
        is_playoff_finalized,
        match_date,
        location,
        speeldag,
        home_score,
        away_score
      `)
      .eq('is_playoff_match', true)
      .order('match_date');

    if (error || !matches) {
      console.error('Error fetching playoff matches:', error);
      return [];
    }

    // Get team names
    const teamIds = new Set<number>();
    matches.forEach(m => {
      if (m.home_team_id) teamIds.add(m.home_team_id);
      if (m.away_team_id) teamIds.add(m.away_team_id);
    });

    const teams = await teamService.getAllTeams();
    const teamMap = new Map(teams.map(t => [t.team_id, t.team_name]));

    return matches.map(m => ({
      ...m,
      home_team_name: m.home_team_id ? teamMap.get(m.home_team_id) : undefined,
      away_team_name: m.away_team_id ? teamMap.get(m.away_team_id) : undefined
    }));
  },

  // Check if there are any position-based (concept) playoffs
  async hasConceptPlayoffs(): Promise<boolean> {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('is_playoff_match', true)
      .eq('is_playoff_finalized', false)
      .not('home_position', 'is', null);

    return !error && (count ?? 0) > 0;
  },

  // Check if there are any finalized playoffs
  async hasFinalizedPlayoffs(): Promise<boolean> {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('is_playoff_match', true)
      .eq('is_playoff_finalized', true);

    return !error && (count ?? 0) > 0;
  },

  async generateAndSavePlayoffs(
    topTeams: number[],
    bottomTeams: number[],
    rounds: number,
    start_date: string,
    end_date: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const seasonValidation = await this.validateSeasonData();
      if (!seasonValidation.isValid) return { success: false, message: seasonValidation.message! };
      const playingWeeks = await this.generatePlayoffWeeks(start_date, end_date);
      if (playingWeeks.length === 0) return { success: false, message: "Geen beschikbare speelweken binnen de geselecteerde periode." };

      const topMatches = this.generatePlayoffRoundMatchesCustom(topTeams, 'top_playoff', rounds);
      const bottomMatches = this.generatePlayoffRoundMatchesCustom(bottomTeams, 'bottom_playoff', rounds);
      const allMatches: Array<{ home: number; away: number; round: string }> = [];
      const maxLen = Math.max(topMatches.length, bottomMatches.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < topMatches.length) allMatches.push(topMatches[i]);
        if (i < bottomMatches.length) allMatches.push(bottomMatches[i]);
      }

      const matchesPerWeek = 7;
      const teamsPerWeek: Map<number, Set<number>> = new Map();
      const slotsPerWeek: Map<number, number> = new Map();
      for (let w = 0; w < playingWeeks.length; w++) { teamsPerWeek.set(w, new Set()); slotsPerWeek.set(w, 0); }

      // Teamvoorkeuren laden
      const allTeamsData = await teamService.getAllTeams();
      const involvedTeams = new Set<number>([...topTeams, ...bottomTeams]);
      const teamPrefs = normalizeTeamsPreferences(allTeamsData.filter(t => involvedTeams.has(t.team_id)));
      const venues = seasonValidation.data?.venues || [];

      const placed: Array<{ match: { home: number; away: number; round: string }; week: number; slot: number }> = [];
      for (const m of allMatches) {
        let bestWeek: number | null = null; let bestSlotForWeek = 0; let bestScore = -1;
        for (let w = 0; w < playingWeeks.length; w++) {
          const weekTeams = teamsPerWeek.get(w)!; const slotsUsed = slotsPerWeek.get(w)!;
          if (slotsUsed >= matchesPerWeek) continue;
          if (weekTeams.has(m.home) || weekTeams.has(m.away)) continue;
          const slotIndex = slotsUsed;
          const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, 7);
          const h = scoreTeamForDetails(teamPrefs.get(m.home), timeslot, venue, venues);
          const a = scoreTeamForDetails(teamPrefs.get(m.away), timeslot, venue, venues);
          const combined = h.score + a.score;
          if (combined > bestScore) { bestScore = combined; bestWeek = w; bestSlotForWeek = slotIndex; }
        }
        if (bestWeek === null) return { success: false, message: "Onvoldoende weken/slots om alle playoff wedstrijden in te plannen." };
        const weekTeams = teamsPerWeek.get(bestWeek)!; weekTeams.add(m.home); weekTeams.add(m.away);
        teamsPerWeek.set(bestWeek, weekTeams); slotsPerWeek.set(bestWeek, bestSlotForWeek + 1);
        placed.push({ match: m, week: bestWeek, slot: bestSlotForWeek });
      }

      const matchInserts: any[] = []; let counter = 1;
      for (const { match, week, slot } of placed) {
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(slot, 7);
        const baseDate = playingWeeks[week];
        const isMonday = timeslot?.day_of_week === 1;
        const matchDate = isMonday ? baseDate : this.addDaysToDate(baseDate, 1);
        const matchDateTime = localDateTimeToISO(matchDate, timeslot?.start_time || '19:00');
        matchInserts.push({
          unique_number: `PO-${counter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          speeldag: `Playoff`,
          home_team_id: match.home,
          away_team_id: match.away,
          is_playoff_match: true,
          is_playoff_finalized: true, // Direct finalized because we have team IDs
          match_date: matchDateTime,
          location: venue,
          is_cup_match: false,
          is_submitted: false,
          is_locked: false
        });
        counter++;
      }

      const { error } = await supabase.from('matches').insert(matchInserts);
      if (error) return { success: false, message: `Fout bij opslaan: ${error.message}` };
      return { success: true, message: `${matchInserts.length} playoff wedstrijden succesvol aangemaakt.` };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Onbekende fout' };
    }
  },

  async deletePlayoffMatches(): Promise<{ success: boolean; message: string }> {
    try {
      // Get playoff match IDs
      const { data: playoffMatchIds, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .eq('is_playoff_match', true);
        
      if (fetchError) return { success: false, message: `Fout bij ophalen playoff wedstrijd IDs: ${fetchError.message}` };
      
      if (playoffMatchIds && playoffMatchIds.length > 0) {
        const { error: teamCostsError } = await supabase
          .from('team_costs')
          .delete()
          .in('match_id', playoffMatchIds.map(m => m.match_id));
        if (teamCostsError) return { success: false, message: `Fout bij verwijderen playoff team kosten: ${teamCostsError.message}` };
      }
      
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('is_playoff_match', true);
        
      if (error) return { success: false, message: `Fout bij verwijderen: ${error.message}` };
      return { success: true, message: "Playoff wedstrijden succesvol verwijderd" };
    } catch (error) {
      return { success: false, message: `Fout bij verwijderen playoff wedstrijden: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  }
};
