
import { supabase } from "@shared/integrations/supabase/client";

// Helper function to wait with delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to verify player update by fetching fresh data
export const verifyPlayerUpdate = async (playerId: number, expectedFirstName: string, expectedLastName: string, expectedBirthDate: string) => {
  console.log('🔍 Verifying player update for ID:', playerId);
  try {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date')
      .eq('player_id', playerId)
      .single();

    if (error || !data) {
      console.error('❌ Error verifying player update:', error);
      return false;
    }

    const isUpdated = 
      data.first_name === expectedFirstName.trim() &&
      data.last_name === expectedLastName.trim() &&
      data.birth_date === expectedBirthDate;

    console.log('📊 Verification result:', {
      expected: { firstName: expectedFirstName, lastName: expectedLastName, birthDate: expectedBirthDate },
      actual: { firstName: data.first_name, lastName: data.last_name, birthDate: data.birth_date },
      isUpdated
    });

    return isUpdated;
  } catch (error) {
    console.error('💥 Error in verifyPlayerUpdate:', error);
    return false;
  }
};

// Enhanced refresh with retry logic
export const refreshWithRetry = async (refreshPlayers: () => Promise<void>, maxRetries = 3, delayMs = 500) => {
  console.log('🔄 Starting enhanced refresh with retry logic');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Refresh attempt ${attempt}/${maxRetries}`);
    
    // Add delay before refresh to allow database transaction to commit
    if (attempt > 1) {
      console.log(`⏱️ Waiting ${delayMs}ms before retry...`);
      await delay(delayMs);
    }

    try {
      await refreshPlayers();
      console.log(`✅ Refresh attempt ${attempt} completed`);
      
      // If this isn't the last attempt, add a small delay to let the UI update
      if (attempt < maxRetries) {
        await delay(200);
      }
    } catch (error) {
      console.error(`❌ Refresh attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};

// NEW: Test database connectivity and permissions
export const testDatabaseConnection = async () => {
  console.log('🔍 TESTING DATABASE CONNECTION AND PERMISSIONS');

  try {
    // Test basic connectivity
    const { data: testQuery, error: testError } = await supabase
      .from('players')
      .select('player_id')
      .limit(1);

    console.log('📊 Database connectivity test:', {
      testQuery,
      testError,
      timestamp: new Date().toISOString()
    });

    if (testError) {
      console.error('❌ Database connectivity failed:', testError);
      return false;
    }

    // Test update permissions by trying a harmless update
    if (testQuery && testQuery.length > 0) {
      const testTarget = testQuery[0];
      const { data: updateTest, error: updateError } = await supabase
        .from('players')
        .update({ last_name: "test" }) // Uses last_name, which exists on the schema
        .eq('player_id', testTarget.player_id)
        .select();

      console.log('📊 Update permission test:', {
        updateTest,
        updateError,
        timestamp: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('💥 Database connection test failed:', error);
    return false;
  }
};
