import { supabase } from "@/integrations/supabase/client";
import { teamService } from "../core/teamService";
import { seasonService } from "../seasonService";
import { timeslotPriorityService } from "../timeslotPriorityService";

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
  // Helper function to add days to a date string
  addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
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

    // Group matches by round based on unique_number pattern
    const groupMatches = (matches: any[]) => {
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
    };

    return groupMatches(matches);


  },

  async createCupTournament(teams: number[], selectedDates: string[]): Promise<{ success: boolean; message: string }> {
    if (teams.length !== 16) {
      return { success: false, message: "Een bekertoernooi vereist exact 16 teams" };
    }

    if (selectedDates.length !== 5) {
      return { success: false, message: "Er moeten exact 5 speelweken geselecteerd zijn" };
    }

    try {
      console.log('🏆 Starting cup tournament creation...');
      
      // Check if cup matches already exist
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('match_id')
        .eq('is_cup_match', true);

      if (existingMatches && existingMatches.length > 0) {
        return { success: false, message: "Er bestaat al een bekertoernooi. Verwijder het eerst." };
      }

      // Load competition data from database
      console.log('📋 Loading competition data from database...');
      const seasonData = await seasonService.getSeasonData();
      
      // Extract venues and timeslots from season data
      const venues = seasonData.venues || [];
      const timeslots = seasonData.venue_timeslots || [];
      const vacations = seasonData.vacation_periods || [];
      
      console.log('🏟️ Available venues:', venues.length);
      console.log('⏰ Available timeslots:', timeslots.length);
      console.log('🏖️ Vacation periods:', vacations.length);
      
      if (venues.length === 0) {
        return { success: false, message: "Geen venues beschikbaar in de database. Configureer eerst de competitiedata." };
      }
      
      if (timeslots.length === 0) {
        return { success: false, message: "Geen tijdslots beschikbaar in de database. Configureer eerst de competitiedata." };
      }

      // Check if selected dates conflict with vacation periods
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
            success: false, 
            message: `Geselecteerde datum ${selectedDate.toLocaleDateString('nl-NL')} valt in vakantieperiode: ${vacation?.name}` 
          };
        }
      }

      // Shuffle teams for random bracket
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Convert selected dates to actual playing weeks (Monday + Tuesday)
      const convertToPlayingWeeks = (selectedDates: string[]): string[] => {
        return selectedDates.map(dateStr => {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          
          // Calculate Monday of this week
          const monday = new Date(date);
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as -6
          monday.setDate(date.getDate() + daysToMonday);
          
          return monday.toISOString().split('T')[0]; // Return Monday in YYYY-MM-DD format
        });
      };

      // Convert selected dates to playing weeks (Mondays)
      const playingWeeks = convertToPlayingWeeks(selectedDates);
      console.log('📅 Original dates:', selectedDates);
      console.log('📅 Converted to playing weeks (Mondays):', playingWeeks);

      // Create all cup matches
      const cupMatches = [];

      // Use shared timeslot priority service
      const getMatchDateTime = async (date: string, timeIndex: number, totalMatchesThisDay: number) => {
        return await timeslotPriorityService.formatMatchDateTime(date, timeIndex, totalMatchesThisDay);
      };

      // 1. Create 8e finales (8 matches) - spread over first 2 weeks (4 matches each week)
      for (let i = 0; i < 8; i++) {
        const homeTeamIndex = i * 2;
        const awayTeamIndex = i * 2 + 1;
        const weekIndex = i < 4 ? 0 : 1; // First 4 matches in week 0, last 4 in week 1
        const timeIndex = i % 4; // Reset time index for second week
        
        // Determine if this match should be on Monday (first 2 of each week) or Tuesday (last 2 of each week)
        const isMonday = (i % 4) < 2;
        const matchDate = isMonday ? playingWeeks[weekIndex] : cupService.addDaysToDate(playingWeeks[weekIndex], 1);
        
        const matchDateTime = await getMatchDateTime(matchDate, timeIndex % 2, 2); // 2 matches per day
        const { venue } = await timeslotPriorityService.getMatchDetails(timeIndex % 2, 2, matchDate);
        
        cupMatches.push({
          unique_number: `1/8-${i + 1}`,
          speeldag: `1/8 Finale ${i + 1}`,
          home_team_id: shuffledTeams[homeTeamIndex],
          away_team_id: shuffledTeams[awayTeamIndex],
          match_date: matchDateTime,
          location: venue,
          is_cup_match: true,
          is_submitted: false,
          is_locked: false
        });
      }

      // 2. Create kwartfinales (4 matches) - week 3
      for (let i = 0; i < 4; i++) {
        // Split 4 matches: 2 on Monday, 2 on Tuesday
        const isMonday = i < 2;
        const matchDate = isMonday ? playingWeeks[2] : cupService.addDaysToDate(playingWeeks[2], 1);
        
        const matchDateTime = await getMatchDateTime(matchDate, i % 2, 2); // 2 matches per day
        const { venue } = await timeslotPriorityService.getMatchDetails(i % 2, 2, matchDate);
        
        cupMatches.push({
          unique_number: `QF-${i + 1}`,
          speeldag: `Kwartfinale ${i + 1}`,
          home_team_id: null,
          away_team_id: null,
          match_date: matchDateTime,
          location: venue,
          is_cup_match: true,
          is_submitted: false,
          is_locked: false
        });
      }

      // 3. Create halve finales (2 matches) - week 4 (both on Monday for prime time)
      for (let i = 0; i < 2; i++) {
        const matchDate = playingWeeks[3]; // Monday of week 4
        
        const matchDateTime = await getMatchDateTime(matchDate, i, 2);
        // For semi-finals, use the top 2 priority venues
        const { venue } = await timeslotPriorityService.getMatchDetails(i, 2, matchDate);
        
        cupMatches.push({
          unique_number: `SF-${i + 1}`,
          speeldag: `Halve Finale ${i + 1}`,
          home_team_id: null,
          away_team_id: null,
          match_date: matchDateTime,
          location: venue,
          is_cup_match: true,
          is_submitted: false,
          is_locked: false
        });
      }

      // 4. Create finale - week 5 (Monday for maximum prime time)
      const finalDate = playingWeeks[4]; // Monday of week 5
      const finalMatchDateTime = await getMatchDateTime(finalDate, 0, 1);
      // For finale, use the top priority venue (best slot)
      const { venue: finalVenue } = await timeslotPriorityService.getMatchDetails(0, 1, finalDate);
      
      cupMatches.push({
        unique_number: 'FINAL',
        speeldag: 'Finale',
        home_team_id: null,
        away_team_id: null,
        match_date: finalMatchDateTime,
        location: finalVenue,
        is_cup_match: true,
        is_submitted: false,
        is_locked: false
      });

      // Insert all matches
      const { error } = await supabase
        .from('matches')
        .insert(cupMatches);

      if (error) throw error;

      console.log('✅ Cup tournament created successfully with database competition data');
      return { 
        success: true, 
        message: `Bekertoernooi succesvol aangemaakt! Gebruikt ${venues.length} venue(s), ${timeslots.length} tijdslot(s) en ${vacations.length} vakantieperiode(s) uit de database.` 
      };

    } catch (error) {
      console.error('Error creating cup tournament:', error);
      return { 
        success: false, 
        message: `Fout bij aanmaken toernooi: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
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

      // Delete related team_transactions first (if any exist)
      const { error: transactionError } = await supabase
        .from('team_transactions')
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
      home_team_name: data.teams_home?.team_name || 'TBD',
      away_team_name: data.teams_away?.team_name || 'TBD',
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

  async advanceWinner(matchId: number, winnerTeamId: number, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🎯 Advancing winner:', { matchId, winnerTeamId, nextRound });
      
      // Find the next match to advance the winner to
      const { data: nextMatch, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id')
        .eq('unique_number', nextRound)
        .eq('is_cup_match', true)
        .single();

      console.log('🔍 Next match found:', { nextMatch, findError });

      if (findError || !nextMatch) {
        console.log('❌ Next match not found:', { nextRound, findError });
        return { success: false, message: "Volgende ronde wedstrijd niet gevonden" };
      }

      // Determine if winner should be home or away team
      const updateField = nextMatch.home_team_id === null ? 'home_team_id' : 'away_team_id';
      console.log('📝 Updating field:', { updateField, winnerTeamId, matchId: nextMatch.match_id });
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ [updateField]: winnerTeamId })
        .eq('match_id', nextMatch.match_id);

      if (updateError) {
        console.log('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Winner successfully advanced!');
      return { success: true, message: "Winnaar doorgeschoven naar volgende ronde!" };
    } catch (error) {
      console.error('❌ Error advancing winner:', error);
      return { 
        success: false, 
        message: `Fout bij doorschuiven winnaar: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Automatische doorschuiving van winnaars met controle op wijzigingen
  async autoAdvanceWinner(matchId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Starting auto-advance for match:', matchId);
      
      // Get the completed match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('match_id, unique_number, home_team_id, away_team_id, home_score, away_score, is_submitted')
        .eq('match_id', matchId)
        .eq('is_cup_match', true)
        .single();

      console.log('📊 Match data retrieved:', { match, matchError });

      if (matchError || !match) {
        console.log('❌ Match not found or error:', matchError);
        return { success: false, message: "Bekerwedstrijd niet gevonden" };
      }

      // Check if match is submitted and has valid scores
      if (!match.is_submitted || match.home_score === null || match.away_score === null) {
        console.log('⚠️ Match not ready for advance:', { 
          is_submitted: match.is_submitted, 
          home_score: match.home_score, 
          away_score: match.away_score 
        });
        return { success: false, message: "Wedstrijd nog niet afgesloten of scores ontbreken" };
      }

      // Note: Draws are now handled by penalty shootout in the UI
      // The match should never reach here with a draw since penalties are mandatory for cup matches

      // Determine winner
      const winnerTeamId = match.home_score > match.away_score ? match.home_team_id : match.away_team_id;
      console.log('🏆 Winner determined:', { 
        homeScore: match.home_score, 
        awayScore: match.away_score, 
        winnerTeamId 
      });

      if (!winnerTeamId) {
        console.log('❌ No valid winner team found');
        return { success: false, message: "Geen geldig winnaar team gevonden" };
      }

      // Get the next round based on current round
      const nextRound = cupService.getNextRound(match.unique_number);
      console.log('🎯 Next round calculated:', { 
        currentRound: match.unique_number, 
        nextRound 
      });
      
      if (!nextRound) {
        if (match.unique_number === 'FINAL') {
          console.log('🏆 Tournament completed!');
          return { success: true, message: "Toernooi voltooid! Kampioen is bekend." };
        }
        console.log('❌ Could not determine next round');
        return { success: false, message: "Volgende ronde kon niet bepaald worden" };
      }

      // Check if winner has changed and update accordingly
      console.log('🔄 Checking for winner changes and updating advancement...');
      const updateResult = await cupService.updateAdvancement(match.unique_number, winnerTeamId, nextRound);
      console.log('📤 Update result:', updateResult);
      return updateResult;

    } catch (error) {
      console.error('Error in auto advance winner:', error);
      return { 
        success: false, 
        message: `Fout bij automatisch doorschuiven: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Update advancement - slimme functie die controleert of winnaar is veranderd
  async updateAdvancement(currentMatchUniqueNumber: string, newWinnerTeamId: number, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Updating advancement:', { currentMatchUniqueNumber, newWinnerTeamId, nextRound });
      
      // Find the next match
      const { data: nextMatch, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id, unique_number')
        .eq('unique_number', nextRound)
        .eq('is_cup_match', true)
        .single();

      if (findError || !nextMatch) {
        console.log('❌ Next match not found:', { nextRound, findError });
        return { success: false, message: "Volgende ronde wedstrijd niet gevonden" };
      }

      // Determine which position this winner should be in based on the match number
      const currentMatchNumber = cupService.extractMatchNumber(currentMatchUniqueNumber);
      const shouldBeHome = cupService.shouldBeHomeTeam(currentMatchUniqueNumber, currentMatchNumber);
      
      const targetField = shouldBeHome ? 'home_team_id' : 'away_team_id';
      const currentValueInTarget = shouldBeHome ? nextMatch.home_team_id : nextMatch.away_team_id;
      
      console.log('🎯 Position analysis:', { 
        currentMatchNumber, 
        shouldBeHome, 
        targetField, 
        currentValueInTarget, 
        newWinnerTeamId 
      });

      // Check if the winner has actually changed
      if (currentValueInTarget === newWinnerTeamId) {
        console.log('✅ Winner unchanged, no update needed');
        return { success: true, message: "Winnaar ongewijzigd" };
      }

      // Winner has changed, update the next round
      const { error: updateError } = await supabase
        .from('matches')
        .update({ [targetField]: newWinnerTeamId })
        .eq('match_id', nextMatch.match_id);

      if (updateError) {
        console.log('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Winner updated in next round');

      // If this next match also has both teams and is completed, we need to cascade the update
      if (nextMatch.home_team_id && nextMatch.away_team_id) {
        console.log('🔄 Cascading update check for completed next match...');
        const cascadeResult = await cupService.checkAndCascadeUpdate(nextMatch.match_id);
        if (cascadeResult.success) {
          return { success: true, message: `Winnaar doorgeschoven naar volgende ronde! ${cascadeResult.message}` };
        }
      }

      return { success: true, message: "Winnaar doorgeschoven naar volgende ronde!" };
    } catch (error) {
      console.error('❌ Error updating advancement:', error);
      return { 
        success: false, 
        message: `Fout bij bijwerken doorschuiving: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
      };
    }
  },

  // Check if a match needs cascade updates (when both teams are present and match is completed)
  async checkAndCascadeUpdate(matchId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('match_id, unique_number, home_team_id, away_team_id, home_score, away_score, is_submitted')
        .eq('match_id', matchId)
        .eq('is_cup_match', true)
        .single();

      if (error || !match) {
        return { success: false, message: "Wedstrijd niet gevonden voor cascade update" };
      }

      // Only cascade if match has both teams and is completed with scores
      if (match.home_team_id && match.away_team_id && match.is_submitted && 
          match.home_score !== null && match.away_score !== null) {
        console.log('🔄 Cascading update for match:', matchId);
        return await cupService.autoAdvanceWinner(matchId);
      }

      return { success: true, message: "" };
    } catch (error) {
      console.error('❌ Error in cascade update:', error);
      return { success: false, message: "Fout bij cascade update" };
    }
  },

  // Clear advancement when there's a draw or error
  async clearAdvancement(currentMatchUniqueNumber: string, nextRound: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧹 Clearing advancement:', { currentMatchUniqueNumber, nextRound });
      
      const { data: nextMatch, error: findError } = await supabase
        .from('matches')
        .select('match_id, home_team_id, away_team_id')
        .eq('unique_number', nextRound)
        .eq('is_cup_match', true)
        .single();

      if (findError || !nextMatch) {
        return { success: false, message: "Volgende ronde wedstrijd niet gevonden" };
      }

      const currentMatchNumber = cupService.extractMatchNumber(currentMatchUniqueNumber);
      const shouldBeHome = cupService.shouldBeHomeTeam(currentMatchUniqueNumber, currentMatchNumber);
      const targetField = shouldBeHome ? 'home_team_id' : 'away_team_id';

      const { error: updateError } = await supabase
        .from('matches')
        .update({ [targetField]: null })
        .eq('match_id', nextMatch.match_id);

      if (updateError) throw updateError;

      console.log('✅ Advancement cleared');
      return { success: true, message: "Doorschuiving gewist" };
    } catch (error) {
      console.error('❌ Error clearing advancement:', error);
      return { success: false, message: "Fout bij wissen doorschuiving" };
    }
  },

  // Helper function to extract match number from unique_number
  extractMatchNumber(uniqueNumber: string): number {
    const match = uniqueNumber.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 1;
  },

  // Helper function to determine if a team should be home or away based on tournament bracket logic
  shouldBeHomeTeam(uniqueNumber: string, matchNumber: number): boolean {
    if (uniqueNumber.startsWith('1/8-')) {
      // 1/8-1,2 -> QF-1 (1=home, 2=away), 1/8-3,4 -> QF-2 (3=home, 4=away), etc.
      return matchNumber % 2 === 1;
    } else if (uniqueNumber.startsWith('QF-')) {
      // QF-1,2 -> SF-1 (1=home, 2=away), QF-3,4 -> SF-2 (3=home, 4=away)
      return matchNumber % 2 === 1;
    } else if (uniqueNumber.startsWith('SF-')) {
      // SF-1,2 -> FINAL (1=home, 2=away)
      return matchNumber % 2 === 1;
    }
    return true; // Default to home
  },

  // Helper function to determine the next round
  getNextRound(currentUniqueNumber: string): string | null {
    if (currentUniqueNumber.startsWith('1/8-')) {
      // Achtste finale -> Kwartfinale
      const matchNumber = parseInt(currentUniqueNumber.split('-')[1]);
      const qfNumber = Math.ceil(matchNumber / 2); // 1,2->1, 3,4->2, 5,6->3, 7,8->4
      return `QF-${qfNumber}`;
    } else if (currentUniqueNumber.startsWith('QF-')) {
      // Kwartfinale -> Halve finale
      const matchNumber = parseInt(currentUniqueNumber.split('-')[1]);
      const sfNumber = Math.ceil(matchNumber / 2); // 1,2->1, 3,4->2
      return `SF-${sfNumber}`;
    } else if (currentUniqueNumber.startsWith('SF-')) {
      // Halve finale -> Finale
      return 'FINAL';
    } else if (currentUniqueNumber === 'FINAL') {
      // Finale is the end
      return null;
    }
    return null;
  }
}; 