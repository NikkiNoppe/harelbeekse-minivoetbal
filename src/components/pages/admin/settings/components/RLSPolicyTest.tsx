import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const RLSTestComponent: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runRLSTests = async () => {
    setLoading(true);
    try {
      console.log('🧪 Running RLS tests...');
      
      // Test 1: Check current user role
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role' as any);
      console.log('👤 Current user role:', roleData, roleError);

      // Test 2: Check if user is admin
      const { data: adminData, error: adminError } = await supabase.rpc('is_current_user_admin' as any);
      console.log('👑 Is admin:', adminData, adminError);

      // Test 3: Get user's team IDs
      const { data: teamData, error: teamError } = await supabase.rpc('get_current_user_team_ids' as any);
      console.log('🏀 User team IDs:', teamData, teamError);

      // Test 4: Try to read players (should work for everyone)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id')
        .limit(5);
      console.log('📊 Players read test:', playersData?.length || 0, 'players', playersError);

      // Test 5: Try to update a player (should work for admin/team manager)
      let updateData: any = null;
      let updateError: any = null;
      
      if (playersData && playersData.length > 0) {
        const testPlayer = playersData[0];
        const updateResult = await supabase
          .from('players')
          .update({ first_name: testPlayer.first_name }) // No change, just test
          .eq('player_id', testPlayer.player_id)
          .select();
        updateData = updateResult.data;
        updateError = updateResult.error;
        console.log('✏️ Update test:', updateData?.length || 0, 'updated', updateError);
      }

      setTestResults({
        role: { data: roleData, error: roleError },
        isAdmin: { data: adminData, error: adminError },
        teamIds: { data: teamData, error: teamError },
        playersRead: { data: playersData?.length || 0, error: playersError },
        updateTest: { data: updateData?.length || 0, error: updateError }
      });

    } catch (error) {
      console.error('❌ RLS test error:', error);
      setTestResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔒 RLS Policy Test
          <Badge variant={user ? "default" : "secondary"}>
            {user ? `Logged in as ${user.username} (${user.role})` : "Not logged in"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runRLSTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Running tests..." : "Run RLS Tests"}
        </Button>

        {testResults && (
          <div className="space-y-3">
            <h4 className="font-semibold">Test Results:</h4>
            
            {testResults.error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">❌ Test Error: {testResults.error.message}</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current User Role:</span>
                  <Badge variant={testResults.role.error ? "destructive" : "default"}>
                    {testResults.role.error ? "Error" : testResults.role.data}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Is Admin:</span>
                  <Badge variant={testResults.isAdmin.error ? "destructive" : "default"}>
                    {testResults.isAdmin.error ? "Error" : (testResults.isAdmin.data ? "Yes" : "No")}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Team IDs:</span>
                  <Badge variant={testResults.teamIds.error ? "destructive" : "default"}>
                    {testResults.teamIds.error ? "Error" : JSON.stringify(testResults.teamIds.data)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Players Read:</span>
                  <Badge variant={testResults.playersRead.error ? "destructive" : "default"}>
                    {testResults.playersRead.error ? "Error" : `${testResults.playersRead.data} players`}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Update Test:</span>
                  <Badge variant={testResults.updateTest.error ? "destructive" : "default"}>
                    {testResults.updateTest.error ? "Error" : `${testResults.updateTest.data} updated`}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 