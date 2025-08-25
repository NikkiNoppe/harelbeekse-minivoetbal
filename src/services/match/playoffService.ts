import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO } from "@/lib/dateUtils";
import { seasonService } from "@/services/seasonService";
import { priorityOrderService } from "@/services/priorityOrderService";
import { teamService } from "@/services/core/teamService";
import { normalizeTeamsPreferences, scoreTeamForDetails } from "@/services/core/teamPreferencesService";

export const playoffService = {
  addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
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
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const weeks: string[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekDateStr = weekStart.toISOString().split('T')[0];
      const isVacation = vacations.some((vacation: any) => {
        if (!vacation.is_active) return false;
        const vacStart = new Date(vacation.start_date);
        const vacEnd = new Date(vacation.end_date);
        return weekStart >= vacStart && weekStart <= vacEnd;
      });
      if (!isVacation) weeks.push(weekDateStr);
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return weeks;
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
      const { data: playoffMatchIds, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .like('speeldag', '%[PLAYOFF:%');
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
        .like('speeldag', '%[PLAYOFF:%');
      if (error) return { success: false, message: `Fout bij verwijderen: ${error.message}` };
      return { success: true, message: "Playoff wedstrijden succesvol verwijderd" };
    } catch (error) {
      return { success: false, message: `Fout bij verwijderen playoff wedstrijden: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  }
};


