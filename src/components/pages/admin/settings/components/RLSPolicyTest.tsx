
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getRpcSessionArgs } from '@/lib/authSession';
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
      console.log('👤 Current user from context:', user);
      
      const { data: teamsSessionData, error: teamsSessionError } = await supabase.rpc(
        'get_teams_for_session',
        getRpcSessionArgs() as any,
      );
      console.log('🏀 Session teams RPC:', teamsSessionData?.length || 0, teamsSessionError);

      // Test 4: Try to read team_users (should work for admins now)
      const { data: teamUsersData, error: teamUsersError } = await supabase.rpc(
        'manage_team_user_for_session',
        {
          ...getRpcSessionArgs(),
          p_operation: 'list',
          p_user_id: 0,
        } as any,
      );
      const teamUsersList = Array.isArray(teamUsersData) ? teamUsersData : [];
      console.log('📊 Team users session RPC:', teamUsersList.length, 'records', teamUsersError);

      // Test 5: Try to read players (should work for everyone)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id')
        .limit(5);
      console.log('📊 Players read test:', playersData?.length || 0, 'players', playersError);

      setTestResults({
        sessionTeams: { data: teamsSessionData?.length || 0, error: teamsSessionError },
        teamUsersRead: { data: teamUsersList.length, error: teamUsersError },
        playersRead: { data: playersData?.length || 0, error: playersError }
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
                  <span>Session teams RPC:</span>
                  <Badge variant={testResults.sessionTeams?.error ? "destructive" : "default"}>
                    {testResults.sessionTeams?.error ? "Error" : `${testResults.sessionTeams?.data ?? 0} teams`}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span>Team Users Read:</span>
                  <Badge variant={testResults.teamUsersRead.error ? "destructive" : "default"}>
                    {testResults.teamUsersRead.error ? "Error" : `${testResults.teamUsersRead.data} records`}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Players Read:</span>
                  <Badge variant={testResults.playersRead.error ? "destructive" : "default"}>
                    {testResults.playersRead.error ? "Error" : `${testResults.playersRead.data} players`}
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
