import { supabase } from "@/integrations/supabase/client";
import { seasonService } from "@/services/seasonService";
import { priorityOrderService } from "@/services/priorityOrderService";
import { teamService } from "@/services/core/teamService";
import { cupService } from "./cupService";

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
    
    if (venues.length === 0) {
      return { isValid: false, message: "Geen venues beschikbaar in de database. Configureer eerst de competitiedata." };
    }
    
    if (timeslots.length === 0) {
      return { isValid: false, message: "Geen tijdslots beschikbaar in de database. Configureer eerst de competitiedata." };
    }

    if (formats.length === 0) {
      return { isValid: false, message: "Geen competitieformaten beschikbaar in de database. Configureer eerst de competitiedata." };
    }

    return { isValid: true, data: { venues, timeslots, vacations, formats } };
  },

  // Genereer automatisch speelweken gebaseerd op seizoen data
  async generatePlayingWeeks(config: CompetitionConfig): Promise<{ weeks: string[]; message: string }> {
    try {
      const seasonData = await seasonService.getSeasonData();
      const vacations = seasonData.vacation_periods || [];
      
      // Haal bekerwedstrijd datums op
      const { cupDates } = await this.checkExistingCupMatches();
      
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
    const matches: Array<{ home: number; away: number; round: number }> = [];
    const n = teams.length;
    
    // Voor een correct round-robin schema met 16 teams = 15 speeldagen
    // Gebruik round-robin algoritme waarbij elke speeldag elk team exact 1x speelt
    for (let round = 1; round <= rounds; round++) {
      const roundMatches = this.generateRoundRobinMatches(teams);
      roundMatches.forEach(match => {
        matches.push({ ...match, round });
      });
    }
    
    return matches;
  },

  // Round-robin algoritme: Circle Method voor 16 teams, 15 speeldagen
  generateRoundRobinMatches(teams: number[]): Array<{ home: number; away: number; matchday: number }> {
    const matches: Array<{ home: number; away: number; matchday: number }> = [];
    const n = teams.length;
    
    if (n % 2 !== 0) {
      throw new Error('Round-robin vereist een even aantal teams');
    }
    
    console.log(`🏆 Genereer round-robin voor ${n} teams: [${teams.join(', ')}]`);
    
    // Circle Method implementatie voor round-robin
    // Voor 16 teams = 15 speeldagen (n-1)
    const numMatchdays = n - 1;
    
    for (let matchday = 0; matchday < numMatchdays; matchday++) {
      const matchdayMatches: Array<{ home: number; away: number; matchday: number }> = [];
      
      // Creëer een rotatie array voor deze speeldag
      // Team aan index 0 blijft vast, anderen roteren
      const roundTeams = [...teams];
      
      // Roteer alle teams behalve de eerste voor deze speeldag
      if (matchday > 0) {
        const fixed = roundTeams[0];
        const rotating = roundTeams.slice(1);
        
        // Roteer de array 'matchday' posities naar rechts
        for (let r = 0; r < matchday; r++) {
          const last = rotating.pop()!;
          rotating.unshift(last);
        }
        
        roundTeams[0] = fixed;
        for (let i = 1; i < roundTeams.length; i++) {
          roundTeams[i] = rotating[i - 1];
        }
      }
      
      // Genereer wedstrijden voor deze speeldag: match team i met team (n-1-i)
      for (let i = 0; i < n / 2; i++) {
        const home = roundTeams[i];
        const away = roundTeams[n - 1 - i];
        
        matchdayMatches.push({
          home,
          away,
          matchday: matchday + 1
        });
      }
      
      // Valideer dat elk team exact 1x voorkomt op deze speeldag
      const teamsInMatchday = new Set<number>();
      matchdayMatches.forEach(match => {
        teamsInMatchday.add(match.home);
        teamsInMatchday.add(match.away);
      });
      
      if (teamsInMatchday.size !== n) {
        const missingTeams = teams.filter(t => !teamsInMatchday.has(t));
        const duplicateTeams = matchdayMatches.flatMap(m => [m.home, m.away])
          .filter((team, index, arr) => arr.indexOf(team) !== index);
        
        console.error(`❌ Speeldag ${matchday + 1}: ${teamsInMatchday.size}/${n} teams`);
        console.error(`Teams in speeldag:`, Array.from(teamsInMatchday).sort((a, b) => a - b));
        console.error(`Ontbrekende teams:`, missingTeams);
        console.error(`Dubbele teams:`, duplicateTeams);
        console.error(`Wedstrijden:`, matchdayMatches);
        
        throw new Error(`Speeldag ${matchday + 1} validatie gefaald: ${teamsInMatchday.size}/${n} teams. Ontbrekende teams: ${missingTeams.join(', ')}`);
      }
      
      console.log(`✅ Speeldag ${matchday + 1}: Alle ${n} teams ingepland (${matchdayMatches.length} wedstrijden)`);
      console.log(`   Wedstrijden: ${matchdayMatches.map(m => `${m.home}-${m.away}`).join(', ')}`);
      
      matches.push(...matchdayMatches);
    }
    
    return matches;
  },

  // Verbeterde distributie met correct round-robin algoritme
  async distributeMatchesOverWeeks(
    matches: Array<{ home: number; away: number; round: number; matchday?: number }>,
    playingWeeks: string[]
  ): Promise<Array<{ match: { home: number; away: number; round: number }; week: number; slot: number }>> {
    const distributedMatches: Array<{ match: { home: number; away: number; round: number }; week: number; slot: number }> = [];
    const matchesPerWeek = 7; // 7 speelmomenten per week
    const totalMatches = matches.length;
    
    console.log(`📊 Distributie info: ${totalMatches} wedstrijden, ${playingWeeks.length} weken beschikbaar`);
    
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
      // Gebruik de matchday van het round-robin algoritme, of bereken het
      const matchday = match.matchday || Math.floor(index / 8) + 1;
      if (!matchesByMatchday.has(matchday)) {
        matchesByMatchday.set(matchday, []);
      }
      matchesByMatchday.get(matchday)!.push(match);
    });
    
    console.log(`🏆 Competitie structuur: ${matchesByMatchday.size} speeldagen`);
    
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
      
      const expectedTeams = 16; // Voor 16 teams
      if (teamsInMatchday.size !== expectedTeams) {
        console.error(`⚠️ VALIDATIE FOUT - Speeldag ${matchday}: ${teamsInMatchday.size} teams in plaats van ${expectedTeams}`);
        console.error(`Teams in speeldag:`, Array.from(teamsInMatchday).sort((a, b) => a - b));
        
        const allTeams = new Set<number>();
        matches.forEach(match => {
          allTeams.add(match.home);
          allTeams.add(match.away);
        });
        const missingTeams = Array.from(allTeams).filter(t => !teamsInMatchday.has(t));
        console.error(`Ontbrekende teams:`, missingTeams.sort((a, b) => a - b));
        
        throw new Error(`Speeldag ${matchday} validatie gefaald: ${teamsInMatchday.size}/${expectedTeams} teams. Ontbrekende teams: ${missingTeams.join(', ')}`);
      }
      
      // Probeer alle wedstrijden van deze speeldag te plaatsen
      const placedMatches: Array<{ match: any; week: number; slot: number }> = [];
      
      for (const match of matchdayMatches) {
        let placed = false;
        
        // Probeer in alle beschikbare weken (start bij huidige week)
        for (let weekIndex = currentWeek; weekIndex < playingWeeks.length && !placed; weekIndex++) {
          const weekTeams = teamsPerWeek.get(weekIndex)!;
          const slotsUsed = slotsPerWeek.get(weekIndex)!;
          
          // Check of deze week geschikt is
          if (slotsUsed < matchesPerWeek && 
              !weekTeams.has(match.home) && 
              !weekTeams.has(match.away)) {
            
            // Plaats wedstrijd in deze week
            weekTeams.add(match.home);
            weekTeams.add(match.away);
            teamsPerWeek.set(weekIndex, weekTeams);
            slotsPerWeek.set(weekIndex, slotsUsed + 1);
            
            placedMatches.push({
              match,
              week: weekIndex,
              slot: slotsUsed
            });
            
            placed = true;
            console.log(`  ✅ Geplaatst: Week ${weekIndex + 1}, Slot ${slotsUsed + 1}: Team ${match.home} vs Team ${match.away}`);
          }
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
    sortedMatches.forEach(({ match, week, slot }) => {
      const weekDate = playingWeeks[week];
      const matchday = Math.floor(sortedMatches.findIndex(m => m === sortedMatches.find(sm => sm.match === match)) / 8) + 1;
      console.log(`  Week ${week + 1} (${weekDate}): Slot ${slot + 1} - Speeldag ${matchday} - Team ${match.home} vs Team ${match.away}`);
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
      location: venue,
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

      // Verdeel reguliere wedstrijden over weken
      const distributedRegularMatches = await this.distributeMatchesOverWeeks(regularMatches, playingWeeks);
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
        
        // Format match datum met tijd
        const matchDateTime = `${matchDate}T${timeslot?.start_time || '19:00'}:00+02:00`;
        
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
  }
}; 