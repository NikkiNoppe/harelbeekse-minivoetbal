
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config, teams, team_preferences, vacation_periods, ai_provider } = await req.json();
    
    console.log('Generating competition schedule with:', {
      ai_provider,
      teams: teams.length,
      config: config.name
    });

    let aiResponse;
    
    if (ai_provider === 'openai') {
      aiResponse = await generateWithOpenAI(config, teams, team_preferences, vacation_periods);
    } else if (ai_provider === 'abacus') {
      aiResponse = await generateWithAbacus(config, teams, team_preferences, vacation_periods);
    } else {
      throw new Error('Invalid AI provider');
    }

    return new Response(
      JSON.stringify(aiResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error generating schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        matches: [],
        matchdays: [],
        validation_notes: ['Er is een fout opgetreden bij het genereren van het schema'],
        confidence_score: 0
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function generateWithOpenAI(config: any, teams: any[], team_preferences: any[], vacation_periods: any[]) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = createCompetitionPrompt(config, teams, team_preferences, vacation_periods);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het maken van sportcompetitie schema\'s. Genereer een optimaal wedstrijdschema op basis van de gegeven parameters. Antwoord alleen met geldige JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiContent = data.choices[0]?.message?.content;
  
  if (!aiContent) {
    throw new Error('No content received from OpenAI');
  }

  try {
    return JSON.parse(aiContent);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', aiContent);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

async function generateWithAbacus(config: any, teams: any[], team_preferences: any[], vacation_periods: any[]) {
  // Fallback implementation - in real scenario you'd integrate with Abacus.ai API
  console.log('Using Abacus.ai fallback implementation');
  
  return generateSimpleSchedule(config, teams, team_preferences, vacation_periods);
}

function createCompetitionPrompt(config: any, teams: any[], team_preferences: any[], vacation_periods: any[]) {
  const vacationDates = vacation_periods.map(vp => `${vp.name}: ${vp.start_date} tot ${vp.end_date}`).join(', ');
  const teamPrefs = team_preferences.map(tp => {
    const team = teams.find(t => t.team_id === tp.team_id);
    return `${team?.team_name}: ${tp.preferred_home_day !== undefined ? `Thuis op ${getDayName(tp.preferred_home_day)}` : ''} ${tp.preferred_time_slot ? `om ${tp.preferred_time_slot}` : ''} ${tp.notes ? `(${tp.notes})` : ''}`.trim();
  }).join(', ');

  return `
Genereer een competitieschema met de volgende parameters:

COMPETITIE DETAILS:
- Naam: ${config.name}
- Type: ${config.format_type}
- Periode: ${config.start_date} tot ${config.end_date}
- Wedstrijden per week: ${config.matches_per_week}
- Totaal rondes: ${config.total_rounds || 'Automatisch bepalen'}

TEAMS (${teams.length}):
${teams.map(t => `- ${t.team_name} (ID: ${t.team_id})`).join('\n')}

TEAM VOORKEUREN:
${teamPrefs || 'Geen specifieke voorkeuren'}

VERLOFPERIODES:
${vacationDates || 'Geen verlofperiodes'}

        FAIRNESS EISEN:
        6. Zorg dat geen enkel team gemiddeld onder 1.5 punten per wedstrijd scoort over het seizoen
        7. Teams met lage scores in vroege weken krijgen prioriteit op betere slots later  
        8. Streef naar minimale standaarddeviatie tussen team scores (max 0.8)
        9. Roteer voorkeursslots zodat elk team periodiek hun voorkeuren krijgt
        10. Compenseer teams die meerdere weken achter elkaar lage scores krijgen

Antwoord met ALLEEN deze JSON structuur:
{
  "matches": [
    {
      "home_team_id": 1,
      "away_team_id": 2,
      "home_team_name": "Team A",
      "away_team_name": "Team B",
      "matchday": 1,
      "match_date": "2025-01-20",
      "match_time": "20:00",
      "location": "Sportpark Noord"
    }
  ],
  "matchdays": [
    {
      "name": "Speeldag 1",
      "date": "2025-01-20",
      "matches": []
    }
  ],
  "validation_notes": ["Opmerkingen over het schema"],
  "confidence_score": 0.95
}
  `;
}

function generateSimpleSchedule(config: any, teams: any[], team_preferences: any[], vacation_periods: any[]) {
  // Simple round-robin implementation as fallback
  const matches = [];
  const matchdays = [];
  let matchdayCounter = 1;
  let currentDate = new Date(config.start_date);
  
  // Generate round-robin matches
  for (let round = 0; round < (config.total_rounds || 1); round++) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];
        
        matches.push({
          home_team_id: homeTeam.team_id,
          away_team_id: awayTeam.team_id,
          home_team_name: homeTeam.team_name,
          away_team_name: awayTeam.team_name,
          matchday: matchdayCounter,
          match_date: currentDate.toISOString().split('T')[0],
          match_time: "20:00",
          location: "Sportpark Noord"
        });
        
        // If we have enough matches for a matchday, create it
        if (matches.filter(m => m.matchday === matchdayCounter).length >= Math.min(config.matches_per_week, teams.length / 2)) {
          matchdays.push({
            name: `Speeldag ${matchdayCounter}`,
            date: currentDate.toISOString().split('T')[0],
            matches: matches.filter(m => m.matchday === matchdayCounter)
          });
          
          matchdayCounter++;
          currentDate.setDate(currentDate.getDate() + 7); // Next week
        }
      }
    }
  }
  
  return {
    matches,
    matchdays,
    validation_notes: ["Schema gegenereerd met eenvoudige round-robin algoritme"],
    confidence_score: 0.7
  };
}

function getDayName(dayNumber: number): string {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return days[dayNumber] || 'Onbekend';
}
