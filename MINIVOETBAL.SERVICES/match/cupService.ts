import { supabase } from "../../MINIVOETBAL.SDK/client";
import { seasonService } from "../seasonService";
import { priorityOrderService } from "../priorityOrderService";

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

export const cupService = {
  addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // Helper functions for validation
  validateCupTournamentInput(teams: number[], selectedDates: string[]): { isValid: boolean; message?: string } {
    if (teams.length !== 16) {
      return { isValid: false, message: "Een bekertoernooi vereist exact 16 teams" };
    }

    if (selectedDates.length !== 5) {
      return { isValid: false, message: "Er moeten exact 5 speelweken geselecteerd zijn" };
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
    matchDateTime: string, 
    venue: string
  ) {
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

  async createEightFinals(shuffledTeams: number[], playingWeeks: string[]): Promise<any[]> {
    const cupMatches: any[] = [];
    
    for (let i = 0; i < 8; i++) {
      const homeTeamIndex = i * 2;
      const awayTeamIndex = i * 2 + 1;
      const weekIndex = i < 4 ? 0 : 1; // First 4 matches in week 0, last 4 in week 1
      const matchIndexInWeek = i % 4; // 0-3 for each week (4 matches per week)
      
      // Get the optimal timeslot for this match (using priority slots in order)
      const optimalSlotIndex = matchIndexInWeek; // 0-3 for the 4 best slots per week
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(optimalSlotIndex, 4); // 4 matches per week
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[weekIndex];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
      
      // Format the match date with the selected time
      const matchDateTime = `${matchDate}T${timeslot?.start_time || '19:00'}:00+02:00`;
      
      console.log(`🎯 Match ${i + 1}: Week ${weekIndex + 1}, ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${optimalSlotIndex + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}`);
      
      cupMatches.push(cupService.createMatchObject(
        `1/8-${i + 1}`,
        `1/8 Finale ${i + 1}`,
        shuffledTeams[homeTeamIndex],
        shuffledTeams[awayTeamIndex],
        matchDateTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createQuarterFinals(playingWeeks: string[]): Promise<any[]> {
    const cupMatches: any[] = [];
    
    for (let i = 0; i < 4; i++) {
      // Get the optimal timeslot for this match (using all 7 priority slots)
      const optimalSlotIndex = i; // 0-3 for the 4 best slots
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(optimalSlotIndex, 4);
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[2];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
      
      // Format the match date with the selected time
      const matchDateTime = `${matchDate}T${timeslot?.start_time || '19:00'}:00+02:00`;
      
      console.log(`🎯 Kwartfinale ${i + 1}: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${optimalSlotIndex + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}`);
      
      cupMatches.push(cupService.createMatchObject(
        `QF-${i + 1}`,
        `Kwartfinale ${i + 1}`,
        null,
        null,
        matchDateTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createSemiFinals(playingWeeks: string[]): Promise<any[]> {
    const cupMatches: any[] = [];
    
    for (let i = 0; i < 2; i++) {
      // Get the optimal timeslot for this match (using all 7 priority slots)
      const optimalSlotIndex = i; // 0-1 for the 2 best slots
      const { venue, timeslot } = await priorityOrderService.getMatchDetails(optimalSlotIndex, 2);
      
      // Determine the correct date based on the selected slot's day_of_week
      const baseDate = playingWeeks[3];
      const isMonday = timeslot?.day_of_week === 1;
      const matchDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
      
      // Format the match date with the selected time
      const matchDateTime = `${matchDate}T${timeslot?.start_time || '19:00'}:00+02:00`;
      
      console.log(`🎯 Halve finale ${i + 1}: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${optimalSlotIndex + 1} (Priority ${timeslot?.priority || 'N/A'}), Venue: ${venue}`);
      
      cupMatches.push(cupService.createMatchObject(
        `SF-${i + 1}`,
        `Halve Finale ${i + 1}`,
        null,
        null,
        matchDateTime,
        venue
      ));
    }

    return cupMatches;
  },

  async createFinal(playingWeeks: string[]): Promise<any[]> {
    // Get the optimal timeslot for the final (using the best slot)
    const optimalSlotIndex = 0; // Best slot for the final
    const { venue: finalVenue, timeslot: finalTimeslot } = await priorityOrderService.getMatchDetails(optimalSlotIndex, 1);
    
    // Determine the correct date based on the selected slot's day_of_week
    const baseDate = playingWeeks[4];
    const isMonday = finalTimeslot?.day_of_week === 1;
    const finalDate = isMonday ? baseDate : cupService.addDaysToDate(baseDate, 1);
    
    // Format the match date with the selected time
    const finalMatchDateTime = `${finalDate}T${finalTimeslot?.start_time || '19:00'}:00+02:00`;
    
    console.log(`🎯 Finale: ${isMonday ? 'Monday' : 'Tuesday'}, Slot ${optimalSlotIndex + 1} (Priority ${finalTimeslot?.priority || 'N/A'}), Venue: ${finalVenue}`);
    
    return [cupService.createMatchObject(
      'FINAL',
      'Finale',
      null,
      null,
      finalMatchDateTime,
      finalVenue
    )];
  },

  async createCupTournament(teams: number[], selectedDates: string[]): Promise<{ success: boolean; message: string }> {
    // Validate input
    const inputValidation = cupService.validateCupTournamentInput(teams, selectedDates);
    if (!inputValidation.isValid) {
      return { success: false, message: inputValidation.message! };
    }

    try {
      console.log('🏆 Starting cup tournament creation...');
      
      // Check if cup matches already exist
      const existingCheck = await cupService.checkExistingCupTournament();
      if (existingCheck.exists) {
        return { success: false, message: existingCheck.message! };
      }

      // Load and validate season data
      console.log('📋 Loading competition data from database...');
      const seasonValidation = await cupService.validateSeasonData();
      if (!seasonValidation.isValid) {
        return { success: false, message: seasonValidation.message! };
      }

      const { venues, timeslots, vacations } = seasonValidation.data!;
      
      console.log('🏟️ Available venues:', venues.length);
      console.log('⏰ Available timeslots:', timeslots.length);
      console.log('🏖️ Vacation periods:', vacations.length);
      
      // Validate vacation conflicts
      const vacationValidation = cupService.validateVacationConflicts(selectedDates, vacations);
      if (!vacationValidation.isValid) {
        return { success: false, message: vacationValidation.message! };
      }

      // Shuffle teams for random bracket
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Convert selected dates to playing weeks (Mondays)
      const playingWeeks = cupService.convertToPlayingWeeks(selectedDates);
      console.log('📅 Original dates:', selectedDates);
      console.log('📅 Converted to playing weeks (Mondays):', playingWeeks);

      // Get prioritized timeslots for optimal match scheduling
      console.log('🎯 Getting prioritized timeslots for optimal scheduling...');
      const prioritizedTimeslots = await priorityOrderService.getPrioritizedTimeslots();
      console.log('🎯 Available prioritized timeslots:', prioritizedTimeslots.length);
      console.log('🎯 Timeslots details:', prioritizedTimeslots.map(t => `${t.priority}. ${t.venue_name} - ${t.start_time}`));
      
      // Show the priority order for information
      await priorityOrderService.showPriorityOrder();

      // Create all cup matches
      const cupMatches: any[] = [];

      // Create 8e finales (8 matches) - split over 2 weeks (4 per week) with priority slots in order
      console.log('🏆 Creating 1/8 finales with optimal timeslot distribution...');
      const eightFinals = await cupService.createEightFinals(shuffledTeams, playingWeeks);
      cupMatches.push(...eightFinals);

      // Create kwartfinales (4 matches) - week 3 with optimal timeslots
      console.log('🏆 Creating kwartfinales with optimal timeslot distribution...');
      const quarterFinals = await cupService.createQuarterFinals(playingWeeks);
      cupMatches.push(...quarterFinals);

      // Create halve finales (2 matches) - week 4 with optimal timeslots
      console.log('🏆 Creating halve finales with optimal timeslot distribution...');
      const semiFinals = await cupService.createSemiFinals(playingWeeks);
      cupMatches.push(...semiFinals);

      // Create finale (1 match) - week 5 with optimal timeslot
      console.log('🏆 Creating finale with optimal timeslot...');
      const final = await cupService.createFinal(playingWeeks);
      cupMatches.push(...final);

      // Insert all matches
      const { error } = await supabase
        .from('matches')
        .insert(cupMatches);

      if (error) throw error;

      console.log('✅ Cup tournament created successfully with optimal timeslot distribution');
      return { 
        success: true, 
        message: `Bekertoernooi succesvol aangemaakt! 8 wedstrijden verdeeld over 2 weken met optimale speelmomenten. Gebruikt ${venues.length} venue(s), ${timeslots.length} tijdslot(s) en ${vacations.length} vakantieperiode(s) uit de database.` 
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

    return cupService.groupMatchesByRound(matches);
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
      unique_number: data.unique_number ?? '',
      home_team_id: data.home_team_id,
      away_team_id: data.away_team_id,
      home_team_name: data.teams_home?.team_name || 'Te spelen',
      away_team_name: data.teams_away?.team_name || 'Te spelen',
      home_score: data.home_score,
      away_score: data.away_score,
      match_date: data.match_date ?? '',
      location: data.location ?? '',
      tournament_round: data.speeldag ?? '',
      tournament_position: null,
      next_match_id: null,
      is_submitted: data.is_submitted ?? false,
      is_locked: data.is_locked ?? false,
      referee: data.referee ?? undefined,
      referee_notes: data.referee_notes ?? undefined
    };
  },

  // Helper functions for winner advancement
  getNextMatchUniqueNumber(currentUniqueNumber: string): string | null {
    const matchNumber = cupService.extractMatchNumber(currentUniqueNumber);
    
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
      const currentMatch = await cupService.getCupMatchById(matchId);
      if (!currentMatch) {
        return { success: false, message: "Wedstrijd niet gevonden." };
      }

      const nextMatchUniqueNumber = cupService.getNextMatchUniqueNumber(currentMatch.unique_number!);
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

      // Determine if winner should be home or away team
      const shouldBeHome = cupService.shouldBeHomeTeam(currentMatch.unique_number!, cupService.extractMatchNumber(currentMatch.unique_number!));
      
      const updateData: any = {};
      if (shouldBeHome) {
        updateData.home_team_id = winnerTeamId;
      } else {
        updateData.away_team_id = winnerTeamId;
      }

      // Update the next match
      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('match_id', nextMatch.match_id);

      if (updateError) throw updateError;

      console.log('✅ Winner advanced successfully');
      return { success: true, message: "Winner advanced successfully" };
    } catch (error) {
      console.error('Error advancing winner:', error);
      return { 
        success: false, 
        message: `Fout bij advancen winnaar: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  extractMatchNumber(uniqueNumber: string): number {
    const matchNumberMatch = uniqueNumber.match(/\d+/);
    if (matchNumberMatch) {
      return parseInt(matchNumberMatch[0], 10);
    }
    return 0;
  },

  shouldBeHomeTeam(uniqueNumber: string, matchNumber: number): boolean {
    const isEven = matchNumber % 2 === 0;
    return isEven;
  }
};