import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kuyviionmstyvkvglizh.supabase.co";
// Note: In production, you should use environment variables for the service role key
// For now, we'll use the anon key but with a different approach
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eXZpaW9ubXN0eXZrdmdsaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDc3NDQsImV4cCI6MjA2MjIyMzc0NH0.a8pkewpTbzFsLptp_yWD98tHgBlFXKHCRP_Bh3D2XYA";

// Create admin client with service role key
// In production, you would use: process.env.SUPABASE_SERVICE_ROLE_KEY
export const adminSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to check if RLS is enabled on teams table
export const checkRLSStatus = async () => {
  try {
    const { data, error } = await adminSupabase
      .from('teams_public')
      .select('team_id, team_name')
      .limit(1);
    
    console.log('RLS check result:', { data, error });
    return { hasAccess: !error, error };
  } catch (error) {
    console.error('RLS check failed:', error);
    return { hasAccess: false, error };
  }
}; 