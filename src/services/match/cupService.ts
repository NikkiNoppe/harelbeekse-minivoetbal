import { supabase } from "@/integrations/supabase/client";
import { seasonService } from "@/services/seasonService";
import { priorityOrderService } from "@/services/priorityOrderService";
import { teamService } from "@/services/core/teamService";
import { normalizeTeamsPreferences, scoreTeamForDetails, TeamPreferencesNormalized } from "@/services/core/teamPreferencesService";
import { localDateTimeToISO } from "@/lib/dateUtils";

export interface CupMatch {
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
  tournament_round: string;
  tournament_position: string | null;
  next_match_id: number | null;
  is_submitted: boolean;
  is_locked: boolean;
  referee?: string;
  referee_notes?: string;
}

export interface TournamentBracket {
  achtste_finales: any[];
  kwartfinales: any[];
  halve_finales: any[];
  finale: any;
}

export const bekerService = {
  addDaysToDate(dateStr: string, days: number): string {
    // Parse date in YYYY-MM-DD format and add days
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Create in local timezone
    date.setDate(date.getDate() + days);
    
    // Return in YYYY-MM-DD format
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
  },

  

  // Allow manual assignment (byes) when odd number of teams: admin can prefill next-round slots
  async assignTeamToMatch(uniqueNumber: string, asHome: boolean, teamId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data: match, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id')
        .eq('unique_number', uniqueNumber)
        .eq('is_cup_match', true)
        .single();

      if (findError || !match) {
        return { success: false, message: 'Wedstrijd niet gevonden.' };
      }

      const updateData: any = {};
      if (asHome) {
        updateData.home_team_id = teamId;
      } else {
        updateData.away_team_id = teamId;
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('match_id', match.match_id);

      if (updateError) throw updateError;

      return { success: true, message: 'Team succesvol toegewezen aan wedstrijd.' };
    } catch (error) {
      return { success: false, message: `Fout bij toewijzen team: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
    }
  },

  // Helper functions for validation
  validateCupTournamentInput(teams: number[], selectedDates: string[]): { isValid: boolean; message?: string } {
    if (teams.length < 2) {
      return { isValid: false, message: "Selecteer minstens 2 teams" };
    }

    // 16 teams uses 5 weeks (1/8 in 2 weken, QF, SF, Finale)
    // Minder dan 16 teams: 4 weken (1/8 gecondenseerd in 1 week; QF, SF, Finale)
    const requiredWeeks = teams.length === 16 ? 5 : 4;
    if (selectedDates.length !== requiredWeeks) {
      return { isValid: false, message: `Selecteer exact ${requiredWeeks} speelweken voor ${teams.length} team(s)` };
    }

    return { isValid: true };
  },

  async checkExistingCupTournament(): Promise<{ exists: boolean; message?: string }> {
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('match_id')
      .eq('is_cup_match', true);

    if (existingMatches && existingMatches.length > 0) {
      return { exists: true, message: "Er bestaat al een bekertoernooi. Verwijder het eerst." };
    }

    return { exists: false };
  },

  async validateSeasonData(): Promise<{ isValid: boolean; message?: string; data?: any }> {
    const seasonData = await seasonService.getSeasonData();
    
    const venues = seasonData.venues || [];
    const timeslots = seasonData.venue_timeslots || [];
    const vacations = seasonData.vacation_periods || [];
    
    if (venues.length === 0) {
      return { isValid: false, message: "Geen venues beschikbaar in de database. Configureer eerst de competitiedata." };
    }
    
    if (timeslots.length === 0) {
      return { isValid: false, message: "Geen tijdslots beschikbaar in de database. Configureer eerst de competitiedata." };
    }

    return { isValid: true, data: { venues, timeslots, vacations } };
  },

  validateVacationConflicts(selectedDates: string[], vacations: any[]): { isValid: boolean; message?: string } {
    for (const dateStr of selectedDates) {
      const selectedDate = new Date(dateStr);
      const isVacation = vacations.some((vacation: any) => {
        if (!vacation.is_active) return false;
        const vacStart = new Date(vacation.start_date);
        const vacEnd = new Date(vacation.end_date);
        return selectedDate >= vacStart && selectedDate <= vacEnd;
      });
      
      if (isVacation) {
        const vacation = vacations.find((v: any) => {
          const vacStart = new Date(v.start_date);
          const vacEnd = new Date(v.end_date);
          return selectedDate >= vacStart && selectedDate <= vacEnd;
        });
        return { 
          isValid: false, 
          message: `Geselecteerde datum ${selectedDate.toLocaleDateString('nl-NL')} valt in vakantieperiode: ${vacation?.name}` 
        };
      }
    }

    return { isValid: true };
  },

  convertToPlayingWeeks(selectedDates: string[]): string[] {
    return selectedDates.map(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Calculate Monday of this week
      const monday = new Date(date);
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as -6
      monday.setDate(date.getDate() + daysToMonday);
      
      return monday.toISOString().split('T')[0]; // Return Monday in YYYY-MM-DD format
    });
  },

  createMatchObject(
    uniqueNumber: string, 
    speeldag: string, 
    homeTeamId: number | null, 
    awayTeamId: number | null, 
    dateStr: string,
    timeStr: string,
    venue: string
  ) {
    // Store as UTC ISO while preserving the intended local clock time
    const matchDateTime = localDateTimeToISO(dateStr, timeStr);
    
    return {
      unique_number: uniqueNumber,
      speeldag,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: matchDateTime,
      location: venue,
      is_cup_match: true,
      is_submitted: false,
      is_locked: false
    };
  },

  async createEightFinals(shuffledTeams: number[], playingWeeks: string[], opts?: { teamPreferences?: Map<number, TeamPreferencesNormalized>; venues?: any[] }): Promise<any[]> {
    const cupMatches = [];
    // Create only as many matches as there are pairs
    const numberOfPairs = Math.floor(shuffledTeams.length / 2);
    for (let i = 0; i < numberOfPairs; i++) {
      const homeTeamIndex = i * 2;
      const awayTeamIndex = i * 2 + 1;
      // If we only have 4 weeks (reduced schedule), play all 1/8 in week 0; otherwise split over week 0 and 1
      const weekIndex = playingWeeks.length === 5 ? (i < 4 ? 0 : 1) : 0;
      const matchIndexInWeek = i % 4; // 0-3 for each week (4 matches per week)

      // Use cyclical distribution across ALL 7 priority slots, with preference scoring
      const totalAvailableSlots = 7; // Use all 7 priority slots for best distribution
      const cycleIndex = i % totalAvailableSlots; // Cycle through all slots
      
      let bestSlot = cycleIndex;
      let bestScore = -1;
      
      // Check a few slots around the cycle index to find best team preference match
      for (let offset = 0; offset < Math.min(3, totalAvailableSlots); offset++) {
        const slotIndex = (cycleIndex + offset) % totalAvailableSlots;
        const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, totalAvailableSlots);
        let combined = 0;
        
        if (opts?.teamPreferences && opts?.venues) {
          const homeId = shuffledTeams[homeTeamIndex];
          const awayId = shuffledTeams[awayTeamIndex];
          const h = scoreTeamForDetails(opts.teamPreferences.get(homeId), timeslot, venue, opts.venues);
          const a = scoreTeamForDetails(opts.teamPreferences.get(awayId), timeslot, venue, opts.venues);
          combined = h.score + a.score;
        }
        
        if (combined > bestScore) {
          bestScore = combined;
          bestSlot = slotIndex;
        }
      }

      const { venue, timeslot } = await priorityOrderService.getMatchDetails(bestSlot, totalAvailableSlots);
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[weekIndex];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : bekerService.addDaysToDate(baseDate, 1);
      const matchTime = timeslot?.start_time || '19:00';
      
      console.log(`🎯 Match ${i + 1}: Week ${weekIndex + 1}, ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${bestSlot + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}, Time: ${matchTime}, prefScore=${bestScore}`);
      
      cupMatches.push(bekerService.createMatchObject(
        `1/8-${i + 1}`,
        `1/8 Finale ${i + 1}`,
        shuffledTeams[homeTeamIndex],
        shuffledTeams[awayTeamIndex],
        matchDate,
        matchTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createQuarterFinals(playingWeeks: string[]): Promise<any[]> {
    const cupMatches = [];
    // Use week 3 for a 5-week schedule, otherwise week 2 (indexing from 0)
    const baseWeekIndex = playingWeeks.length === 5 ? 2 : 1;
    for (let i = 0; i < 4; i++) {
      // Distribute across priority slots cyclically (using all 7 slots)
      const slotIndex = i; // Use first 4 priority slots for quarterfinals
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, 7); // Use all 7 slots
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[baseWeekIndex];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : bekerService.addDaysToDate(baseDate, 1);
      const matchTime = timeslot?.start_time || '19:00';
      
      console.log(`🎯 Kwartfinale ${i + 1}: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${slotIndex + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}, Time: ${matchTime}`);
      
      cupMatches.push(bekerService.createMatchObject(
        `QF-${i + 1}`,
        `Kwartfinale ${i + 1}`,
        null,
        null,
        matchDate,
        matchTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createSemiFinals(playingWeeks: string[]): Promise<any[]> {
    const cupMatches = [];
    // Use week 4 for a 5-week schedule, otherwise week 3 (indexing from 0)
    const baseWeekIndex = playingWeeks.length === 5 ? 3 : 2;
    for (let i = 0; i < 2; i++) {
      // Use top 2 priority slots for semifinals
      const slotIndex = i; // 0-1 for the 2 best slots
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(slotIndex, 7); // Use all 7 slots
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[baseWeekIndex];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : bekerService.addDaysToDate(baseDate, 1);
      const matchTime = timeslot?.start_time || '19:00';
      
      console.log(`🎯 Halve finale ${i + 1}: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${slotIndex + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}, Time: ${matchTime}`);
      
      cupMatches.push(bekerService.createMatchObject(
        `SF-${i + 1}`,
        `Halve Finale ${i + 1}`,
        null,
        null,
        matchDate,
        matchTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createFinal(playingWeeks: string[]): Promise<any[]> {
    // Get the best slot for the final (priority slot #1)
    const finalSlotIndex = 0; // Best slot for the final
    const { venue: finalVenue, timeslot: finalTimeslot } = await priorityOrderService.getMatchDetails(finalSlotIndex, 7); // Use all 7 slots
    
    // Determine the correct date based on the selected slot's day_of_week
    // Use last week index (4 for 5-week schedule, 3 for 4-week schedule)
    const baseWeekIndex = playingWeeks.length === 5 ? 4 : 3;
    const baseDate = playingWeeks[baseWeekIndex];
    const isMonday = finalTimeslot?.day_of_week === 1;
    const finalDate = isMonday ? baseDate : bekerService.addDaysToDate(baseDate, 1);
    const finalTime = finalTimeslot?.start_time || '19:00';
    
    console.log(`🎯 Finale: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${finalSlotIndex + 1} (Priority ${finalTimeslot?.priority || 'N/A'}), Venue: ${finalVenue}, Time: ${finalTime}`);
    
    return [bekerService.createMatchObject(
      'FINAL',
      'Finale',
      null,
      null,
      finalDate,
      finalTime,
      finalVenue
    )];
  },

  async createCupTournament(teams: number[], selectedDates: string[]): Promise<{ success: boolean; message: string }> {
    // Validate input
    const inputValidation = bekerService.validateCupTournamentInput(teams, selectedDates);
    if (!inputValidation.isValid) {
      return { success: false, message: inputValidation.message! };
    }

    try {
      console.log('🏆 Starting cup tournament creation...');
      
      // Check if cup matches already exist
      const existingCheck = await bekerService.checkExistingCupTournament();
      if (existingCheck.exists) {
        return { success: false, message: existingCheck.message! };
      }

      // Load and validate season data
      console.log('📋 Loading competition data from database...');
      const seasonValidation = await bekerService.validateSeasonData();
      if (!seasonValidation.isValid) {
        return { success: false, message: seasonValidation.message! };
      }

      const { venues, timeslots, vacations } = seasonValidation.data!;
      
      console.log('🏟️ Available venues:', venues.length);
      console.log('⏰ Available timeslots:', timeslots.length);
      console.log('🏖️ Vacation periods:', vacations.length);
      
      // Validate vacation conflicts
      const vacationValidation = bekerService.validateVacationConflicts(selectedDates, vacations);
      if (!vacationValidation.isValid) {
        return { success: false, message: vacationValidation.message! };
      }

      // Shuffle teams for random bracket
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Convert selected dates to playing weeks (Mondays)
      const playingWeeks = bekerService.convertToPlayingWeeks(selectedDates);
      console.log('📅 Original dates:', selectedDates);
      console.log('📅 Converted to playing weeks (Mondays):', playingWeeks);

      // Get prioritized timeslots for optimal match scheduling
      console.log('🎯 Getting prioritized timeslots for optimal scheduling...');
      const prioritizedTimeslots = await priorityOrderService.getPrioritizedTimeslots();
      console.log('🎯 Available prioritized timeslots:', prioritizedTimeslots.length);
      console.log('🎯 Timeslots details:', prioritizedTimeslots.map(t => `${t.priority}. ${t.venue_name} - ${t.start_time}`));
      
      // Show the priority order for information
      await priorityOrderService.showPriorityOrder();

      // Teamvoorkeuren inladen voor de 1/8 finales (enkel ronde met bekende teams)
      const allTeamsData = await teamService.getAllTeams();
      const selectedTeamsSet = new Set(teams);
      const teamPreferences = normalizeTeamsPreferences(allTeamsData.filter(t => selectedTeamsSet.has(t.team_id)));

      // Create all cup matches
      const cupMatches = [];

      // Create 8e finales - number of matches depends on available teams; split over 2 weeks for 5-week schedule or condensed into week 1 for 4-week schedule
      console.log('🏆 Creating 1/8 finales with optimal timeslot distribution...');
      const eightFinals = await bekerService.createEightFinals(shuffledTeams, playingWeeks, { teamPreferences, venues });
      cupMatches.push(...eightFinals);

      // Create kwartfinales (4 matches) - dynamic week index based on schedule length
      console.log('🏆 Creating kwartfinales with optimal timeslot distribution...');
      const quarterFinals = await bekerService.createQuarterFinals(playingWeeks);
      cupMatches.push(...quarterFinals);

      // Create halve finales (2 matches) - dynamic week index based on schedule length
      console.log('🏆 Creating halve finales with optimal timeslot distribution...');
      const semiFinals = await bekerService.createSemiFinals(playingWeeks);
      cupMatches.push(...semiFinals);

      // Create finale (1 match) - dynamic week index based on schedule length
      console.log('🏆 Creating finale with optimal timeslot...');
      const final = await bekerService.createFinal(playingWeeks);
      cupMatches.push(...final);

      // Insert all matches
      const { error } = await supabase
        .from('matches')
        .insert(cupMatches);

      if (error) throw error;

      console.log('✅ Cup tournament created successfully with optimal timeslot distribution');
      const isFullBracket = teams.length === 16;
      const weeksUsed = selectedDates.length;
      return { 
        success: true, 
        message: `Bekertoernooi succesvol aangemaakt! Schema over ${weeksUsed} week(en) (${isFullBracket ? 'volledige 16-teams bracket' : 'geconsolideerd schema voor minder teams'}). Gebruikt ${venues.length} venue(s), ${timeslots.length} tijdslot(s) en ${vacations.length} vakantieperiode(s) uit de database.` 
      };

    } catch (error) {
      console.error('Error creating cup tournament:', error);
      return { 
        success: false, 
        message: `Fout bij aanmaken toernooi: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async getCupMatches(): Promise<any> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        match_date,
        location,
        speeldag,
        is_submitted,
        is_locked,
        referee,
        referee_notes,
        teams_home:teams!home_team_id(team_name),
        teams_away:teams!away_team_id(team_name)
      `)
      .eq('is_cup_match', true)
      .order('unique_number', { ascending: true });

    if (error) {
      console.error('Error fetching cup matches:', error);
      throw error;
    }

    // Transform data and group by round
    const matches = (data || []).map((match: any) => ({
      match_id: match.match_id,
      unique_number: match.unique_number,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      home_team_name: match.teams_home?.team_name || 'Te spelen',
      away_team_name: match.teams_away?.team_name || 'Te spelen',
      home_score: match.home_score,
      away_score: match.away_score,
      match_date: match.match_date,
      location: match.location,
      speeldag: match.speeldag,
      is_submitted: match.is_submitted,
      is_locked: match.is_locked,
      referee: match.referee,
      referee_notes: match.referee_notes
    }));

    return bekerService.groupMatchesByRound(matches);
  },

  groupMatchesByRound(matches: any[]): TournamentBracket {
    const achtste_finales = matches.filter(m => m.unique_number?.startsWith('1/8-'));
    const kwartfinales = matches.filter(m => m.unique_number?.startsWith('QF-'));
    const halve_finales = matches.filter(m => m.unique_number?.startsWith('SF-'));
    const finale = matches.find(m => m.unique_number === 'FINAL') || null;

    return {
      achtste_finales,
      kwartfinales,
      halve_finales,
      finale
    };
  },

  async deleteCupTournament(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Starting cup tournament deletion process...');
      
      // First, get all cup match IDs
      const { data: cupMatches, error: fetchError } = await supabase
        .from('matches')
        .select('match_id')
        .eq('is_cup_match', true);

      if (fetchError) {
        console.error('Error fetching cup matches:', fetchError);
        throw fetchError;
      }

      if (!cupMatches || cupMatches.length === 0) {
        return { success: false, message: "Geen bekertoernooi gevonden om te verwijderen." };
      }

      const cupMatchIds = cupMatches.map(match => match.match_id);
      console.log('🎯 Found cup matches to delete:', cupMatchIds);

      // Delete related team_costs first (if any exist)
      const { error: transactionError } = await supabase
        .from('team_costs')
        .delete()
        .in('match_id', cupMatchIds);

      if (transactionError) {
        console.error('Error deleting related transactions:', transactionError);
        // Don't throw here - transactions might not exist, continue with match deletion
        console.log('⚠️ Warning: Could not delete related transactions, continuing...');
      } else {
        console.log('✅ Related transactions deleted successfully');
      }

      // Now delete the cup matches
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('is_cup_match', true);

      if (matchError) {
        console.error('Error deleting cup matches:', matchError);
        throw matchError;
      }

      console.log('✅ Cup tournament deleted successfully');
      return { success: true, message: "Bekertoernooi succesvol verwijderd!" };
    } catch (error) {
      console.error('❌ Error deleting cup tournament:', error);
      
      // Provide more detailed error information
      let errorMessage = 'Onbekende fout';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for specific PostgreSQL errors
        if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Er zijn nog gerelateerde gegevens gekoppeld aan het toernooi. Probeer opnieuw of neem contact op met de beheerder.';
        } else if (error.message.includes('violates')) {
          errorMessage = 'Database constraint overtreding. Er zijn mogelijk nog gekoppelde gegevens.';
        }
      }
      
      return { 
        success: false, 
        message: `Fout bij verwijderen toernooi: ${errorMessage}` 
      };
    }
  },

  async updateCupMatch(matchId: number, updateData: Partial<CupMatch>): Promise<{ success: boolean; message: string }> {
    try {
      const updateObject: any = {};
      
      if (updateData.home_score !== undefined) updateObject.home_score = updateData.home_score;
      if (updateData.away_score !== undefined) updateObject.away_score = updateData.away_score;
      if (updateData.referee !== undefined) updateObject.referee = updateData.referee;
      if (updateData.referee_notes !== undefined) updateObject.referee_notes = updateData.referee_notes;
      if (updateData.is_submitted !== undefined) updateObject.is_submitted = updateData.is_submitted;
      if (updateData.is_locked !== undefined) updateObject.is_locked = updateData.is_locked;
      if (updateData.match_date !== undefined) updateObject.match_date = updateData.match_date;
      if (updateData.location !== undefined) updateObject.location = updateData.location;

      updateObject.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId)
        .eq('is_cup_match', true);

      if (error) throw error;

      return { success: true, message: "Bekerwedstrijd succesvol bijgewerkt!" };
    } catch (error) {
      console.error('Error updating cup match:', error);
      return { 
        success: false, 
        message: `Fout bij bijwerken wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async getCupMatchById(matchId: number): Promise<CupMatch | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        match_date,
        location,
        speeldag,
        is_submitted,
        is_locked,
        referee,
        referee_notes,
        teams_home:teams!home_team_id(team_name),
        teams_away:teams!away_team_id(team_name)
      `)
      .eq('match_id', matchId)
      .eq('is_cup_match', true)
      .single();

    if (error) {
      console.error('Error fetching cup match:', error);
      return null;
    }

    return {
      match_id: data.match_id,
      unique_number: data.unique_number,
      home_team_id: data.home_team_id,
      away_team_id: data.away_team_id,
      home_team_name: data.teams_home?.team_name || 'Te spelen',
      away_team_name: data.teams_away?.team_name || 'Te spelen',
      home_score: data.home_score,
      away_score: data.away_score,
      match_date: data.match_date,
      location: data.location,
      tournament_round: data.speeldag,
      tournament_position: null,
      next_match_id: null,
      is_submitted: data.is_submitted,
      is_locked: data.is_locked,
      referee: data.referee,
      referee_notes: data.referee_notes
    };
  },

  // Helper functions for winner advancement
  getNextMatchUniqueNumber(currentUniqueNumber: string): string | null {
    const matchNumber = bekerService.extractMatchNumber(currentUniqueNumber);
    
    if (currentUniqueNumber.startsWith('1/8-')) {
      return `QF-${Math.ceil(matchNumber / 2)}`;
    } else if (currentUniqueNumber.startsWith('QF-')) {
      return `SF-${Math.ceil(matchNumber / 2)}`;
    } else if (currentUniqueNumber.startsWith('SF-')) {
      return 'FINAL';
    }
    
    return null;
  },

  async advanceWinner(matchId: number, winnerTeamId: number, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🏆 Advancing winner (Team ${winnerTeamId}) to ${nextRound}...`);
      
      // Get current match details
      const currentMatch = await bekerService.getCupMatchById(matchId);
      if (!currentMatch) {
        return { success: false, message: "Wedstrijd niet gevonden." };
      }

      const nextMatchUniqueNumber = bekerService.getNextMatchUniqueNumber(currentMatch.unique_number!);
      if (!nextMatchUniqueNumber) {
        return { success: false, message: "Geen volgende ronde gevonden." };
      }

      // Find the next match
      const { data: nextMatch, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id')
        .eq('unique_number', nextMatchUniqueNumber)
        .eq('is_cup_match', true)
        .single();

      if (findError || !nextMatch) {
        return { success: false, message: "Volgende wedstrijd niet gevonden." };
      }

      // Determine preferred slot (home for odd, away for even), but fall back to free slot if preferred is occupied
      const shouldBeHome = bekerService.shouldBeHomeTeam(currentMatch.unique_number!, bekerService.extractMatchNumber(currentMatch.unique_number!));

      const updateData: any = {};
      if (shouldBeHome) {
        if (!nextMatch.home_team_id) {
          updateData.home_team_id = winnerTeamId;
        } else if (!nextMatch.away_team_id) {
          updateData.away_team_id = winnerTeamId;
        } else {
          // Both occupied; do nothing to avoid overwriting
          return { success: false, message: "Volgende wedstrijd heeft al beide teams toegewezen." };
        }
      } else {
        if (!nextMatch.away_team_id) {
          updateData.away_team_id = winnerTeamId;
        } else if (!nextMatch.home_team_id) {
          updateData.home_team_id = winnerTeamId;
        } else {
          return { success: false, message: "Volgende wedstrijd heeft al beide teams toegewezen." };
        }
      }

      // Update the next match with the decided slot
      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('match_id', nextMatch.match_id);

      if (updateError) throw updateError;

      console.log(`✅ Winner advanced successfully to ${nextRound}`);
      return { success: true, message: `Winnaar succesvol doorgestroomd naar ${nextRound}!` };
    } catch (error) {
      console.error('Error advancing winner:', error);
      return { 
        success: false, 
        message: `Fout bij doorstromen winnaar: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async autoAdvanceWinner(matchId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🤖 Auto-advancing winner for match ${matchId}...`);
      
      // Get current match details
      const currentMatch = await bekerService.getCupMatchById(matchId);
      if (!currentMatch) {
        return { success: false, message: "Wedstrijd niet gevonden." };
      }

      // Check if match has scores
      if (currentMatch.home_score === null || currentMatch.away_score === null) {
        return { success: false, message: "Wedstrijd heeft nog geen scores." };
      }

      // Determine winner
      let winnerTeamId: number;
      if (currentMatch.home_score > currentMatch.away_score) {
        winnerTeamId = currentMatch.home_team_id!;
      } else if (currentMatch.away_score > currentMatch.home_score) {
        winnerTeamId = currentMatch.away_team_id!;
      } else {
        return { success: false, message: "Gelijkspel - kan geen winnaar bepalen." };
      }

      // Get next round
      const nextRound = bekerService.getNextRound(currentMatch.unique_number!);
      if (!nextRound) {
        return { success: false, message: "Geen volgende ronde gevonden." };
      }

      // Advance winner
      return await bekerService.advanceWinner(matchId, winnerTeamId, nextRound);
    } catch (error) {
      console.error('Error auto-advancing winner:', error);
      return { 
        success: false, 
        message: `Fout bij automatisch doorstromen: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async updateAdvancement(currentMatchUniqueNumber: string, newWinnerTeamId: number, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Updating advancement for ${currentMatchUniqueNumber} with new winner ${newWinnerTeamId}...`);
      
      const nextMatchUniqueNumber = bekerService.getNextMatchUniqueNumber(currentMatchUniqueNumber);
      if (!nextMatchUniqueNumber) {
        return { success: false, message: "Geen volgende wedstrijd gevonden." };
      }

      // Find the next match
      const { data: nextMatch, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id')
        .eq('unique_number', nextMatchUniqueNumber)
        .eq('is_cup_match', true)
        .single();

      if (findError || !nextMatch) {
        return { success: false, message: "Volgende wedstrijd niet gevonden." };
      }

      // Determine preferred slot (home for odd, away for even), but fall back to free slot if preferred is occupied
      const shouldBeHome = bekerService.shouldBeHomeTeam(currentMatchUniqueNumber, bekerService.extractMatchNumber(currentMatchUniqueNumber));

      const updateData: any = {};
      if (shouldBeHome) {
        if (!nextMatch.home_team_id) {
          updateData.home_team_id = newWinnerTeamId;
        } else if (!nextMatch.away_team_id) {
          updateData.away_team_id = newWinnerTeamId;
        } else {
          // If both occupied, default to home (replace home)
          updateData.home_team_id = newWinnerTeamId;
        }
      } else {
        if (!nextMatch.away_team_id) {
          updateData.away_team_id = newWinnerTeamId;
        } else if (!nextMatch.home_team_id) {
          updateData.home_team_id = newWinnerTeamId;
        } else {
          // If both occupied, default to away (replace away)
          updateData.away_team_id = newWinnerTeamId;
        }
      }

      // Update the next match with the decided slot
      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('match_id', nextMatch.match_id);

      if (updateError) throw updateError;

      console.log(`✅ Advancement updated successfully`);
      return { success: true, message: "Doorstroming succesvol bijgewerkt!" };
    } catch (error) {
      console.error('Error updating advancement:', error);
      return { 
        success: false, 
        message: `Fout bij bijwerken doorstroming: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async checkAndCascadeUpdate(matchId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Checking for cascade updates for match ${matchId}...`);
      
      const currentMatch = await bekerService.getCupMatchById(matchId);
      if (!currentMatch) {
        return { success: false, message: "Wedstrijd niet gevonden." };
      }

      // Check if this match affects later rounds
      const nextMatchUniqueNumber = bekerService.getNextMatchUniqueNumber(currentMatch.unique_number!);
      if (!nextMatchUniqueNumber) {
        return { success: true, message: "Geen cascade updates nodig." };
      }

      // Check if next match already has teams assigned
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id')
        .eq('unique_number', nextMatchUniqueNumber)
        .eq('is_cup_match', true)
        .single();

      if (nextMatch && (nextMatch.home_team_id || nextMatch.away_team_id)) {
        // Clear the next match teams since the current match result changed
        const { error: clearError } = await supabase
          .from('matches')
          .update({ home_team_id: null, away_team_id: null })
          .eq('unique_number', nextMatchUniqueNumber);

        if (clearError) throw clearError;

        console.log(`✅ Cleared next match teams due to result change`);
        return { success: true, message: "Volgende ronde teams gewist vanwege resultaatwijziging." };
      }

      return { success: true, message: "Geen cascade updates nodig." };
    } catch (error) {
      console.error('Error checking cascade updates:', error);
      return { 
        success: false, 
        message: `Fout bij controleren cascade updates: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  async clearAdvancement(currentMatchUniqueNumber: string, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Clearing advancement for ${currentMatchUniqueNumber}...`);
      
      const nextMatchUniqueNumber = bekerService.getNextMatchUniqueNumber(currentMatchUniqueNumber);
      if (!nextMatchUniqueNumber) {
        return { success: false, message: "Geen volgende wedstrijd gevonden." };
      }

      // Clear the next match teams
      const { error: clearError } = await supabase
        .from('matches')
        .update({ home_team_id: null, away_team_id: null })
        .eq('unique_number', nextMatchUniqueNumber)
        .eq('is_cup_match', true);

      if (clearError) throw clearError;

      console.log(`✅ Advancement cleared successfully`);
      return { success: true, message: "Doorstroming succesvol gewist!" };
    } catch (error) {
      console.error('Error clearing advancement:', error);
      return { 
        success: false, 
        message: `Fout bij wissen doorstroming: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Utility functions
  extractMatchNumber(uniqueNumber: string): number {
    // Prefer the number after the last hyphen (e.g., '1/8-3' -> 3, 'QF-2' -> 2)
    const parts = uniqueNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) return parsed;

    // Fallback: take the last number sequence in the string
    const allNumbers = uniqueNumber.match(/\d+/g);
    if (allNumbers && allNumbers.length > 0) {
      const last = allNumbers[allNumbers.length - 1];
      const fallbackParsed = parseInt(last, 10);
      if (!isNaN(fallbackParsed)) return fallbackParsed;
    }
    return 0;
  },

  shouldBeHomeTeam(uniqueNumber: string, matchNumber: number): boolean {
    // In cup tournaments, odd-numbered matches in each round are home teams
    return matchNumber % 2 === 1;
  },

  getNextRound(currentUniqueNumber: string): string | null {
    if (currentUniqueNumber.startsWith('1/8-')) {
      return 'Kwartfinale';
    } else if (currentUniqueNumber.startsWith('QF-')) {
      return 'Halve Finale';
    } else if (currentUniqueNumber.startsWith('SF-')) {
      return 'Finale';
    }
    return null;
  }
}; 