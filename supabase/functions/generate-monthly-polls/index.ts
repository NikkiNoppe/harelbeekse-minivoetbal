import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchData {
  match_id: number;
  match_date: string;
  location: string;
  home_team_name: string;
  away_team_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { month } = await req.json();
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(
        JSON.stringify({ error: 'Invalid month format. Use YYYY-MM.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating polls for month: ${month}`);

    // Get matches for the specified month that don't have poll groups yet
    const [year, monthNum] = month.split('-').map(Number);
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${lastDayOfMonth.toString().padStart(2, '0')}`;
    
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        match_id,
        match_date,
        location,
        poll_group_id,
        teams_home:teams!home_team_id(team_name),
        teams_away:teams!away_team_id(team_name)
      `)
      .gte('match_date', startDate)
      .lte('match_date', endDate)
      .is('poll_group_id', null) // Only matches without poll groups
      .order('match_date');

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch matches' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No matches found for clustering', 
          groups_created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cluster matches by location and time slot
    const clusters = new Map<string, MatchData[]>();

    matches.forEach((match: any) => {
      const matchDate = new Date(match.match_date);
      const timeSlot = `${matchDate.getHours().toString().padStart(2, '0')}:${matchDate.getMinutes().toString().padStart(2, '0')}`;
      const location = match.location || 'Onbekend';
      
      // Create cluster key: location + time slot
      const clusterKey = `${location}_${timeSlot}`;
      
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      
      clusters.get(clusterKey)!.push({
        match_id: match.match_id,
        match_date: match.match_date,
        location: location,
        home_team_name: match.teams_home?.team_name || 'Onbekend',
        away_team_name: match.teams_away?.team_name || 'Onbekend'
      });
    });

    // Filter out single-match clusters (groups should have at least 2 matches)
    const validClusters = Array.from(clusters.entries()).filter(([_, matches]) => matches.length >= 2);

    if (validClusters.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No valid clusters found (minimum 2 matches per group)', 
          groups_created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let groupsCreated = 0;

    // Create poll groups and update matches
    for (const [clusterKey, clusterMatches] of validClusters) {
      const pollGroupId = `${month}_${clusterKey}_${Date.now()}`;
      
      console.log(`Creating poll group: ${pollGroupId} with ${clusterMatches.length} matches`);

      // Update all matches in this cluster with the poll group ID
      const matchIds = clusterMatches.map(m => m.match_id);
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          poll_group_id: pollGroupId,
          poll_month: month
        })
        .in('match_id', matchIds);

      if (updateError) {
        console.error(`Error updating matches for group ${pollGroupId}:`, updateError);
        continue; // Skip this group but continue with others
      }

      groupsCreated++;
    }

    // Send notification if groups were created
    if (groupsCreated > 0) {
      await supabase
        .from('application_settings')
        .insert({
          setting_category: 'admin_notifications',
          setting_name: `poll_generated_${Date.now()}`,
          setting_value: {
            message: `Nieuwe scheidsrechter polls gegenereerd voor ${month}. ${groupsCreated} groep(en) aangemaakt.`,
            target_roles: ['referee', 'admin'],
            created_at: new Date().toISOString(),
            type: 'poll_generated'
          },
          is_active: true
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        groups_created: groupsCreated,
        month,
        message: `Successfully created ${groupsCreated} poll groups for ${month}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-monthly-polls:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});