import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env file
const envFile = readFileSync('.env', 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Applying contact migration...');
    
    // SQL to add contact columns
    const sql = `
      ALTER TABLE public.teams
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
        ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30),
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
        ADD COLUMN IF NOT EXISTS club_colors VARCHAR(100),
        ADD COLUMN IF NOT EXISTS preferred_play_moments JSONB;

      COMMENT ON COLUMN public.teams.contact_person IS 'Naam van de contactpersoon voor het team';
      COMMENT ON COLUMN public.teams.contact_phone IS 'Telefoonnummer van de contactpersoon';
      COMMENT ON COLUMN public.teams.contact_email IS 'Emailadres van de contactpersoon';
      COMMENT ON COLUMN public.teams.club_colors IS 'Clubkleuren (bv. rood-wit)';
      COMMENT ON COLUMN public.teams.preferred_play_moments IS 'JSONB met voorkeursdagen, tijdsloten, locaties en extra wensen. Voorbeeld: {"days": ["maandag"], "timeslots": ["19:30-21:00"], "venues": [1], "notes": "Liever niet op maandag"}';
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('✅ Contact migration applied successfully!');
    
    // Test the new columns
    const { data, error: testError } = await supabase
      .from('teams')
      .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing new columns:', testError);
    } else {
      console.log('✅ New columns are working correctly!');
      console.log('Sample data:', data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration(); 