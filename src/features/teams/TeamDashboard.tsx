
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { toast } from "@shared/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { User } from "@shared/types/auth";
import { TeamPlayer } from "./match-form/components/useTeamPlayers";
import { PlayersList } from "./PlayersList";
import CompactMatchForm from "./match-form/CompactMatchForm";
import { supabase } from "@shared/integrations/supabase/client";

interface TeamDashboardProps {
  user: User | null;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ user }) => {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamName, setTeamName] = useState<string | null>(null);
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!teamId) {
        console.error("No team ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const teamIdNumber = parseInt(teamId);
        
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('team_name')
          .eq('team_id', teamIdNumber)
          .single();

        if (teamError) {
          console.error("Error fetching team:", teamError);
          toast({
            title: "Failed to load team details",
            variant: "destructive",
          });
          return;
        }

        setTeamName(teamData?.team_name || 'Unknown Team');

        // Check if the current user is an admin for this team
        const { data: adminData, error: adminError } = await supabase
          .from('team_users')
          .select('*')
          .eq('team_id', teamIdNumber)
          .eq('user_id', user?.id);

        if (adminError) {
          console.error("Error fetching admin status:", adminError);
          toast({
            title: "Failed to load admin status",
            variant: "destructive",
          });
          return;
        }

        setIsTeamAdmin(adminData && adminData.length > 0);

      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId, user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Dashboard</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (!teamId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Dashboard</CardTitle>
        </CardHeader>
        <CardContent>No team ID provided.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="matches" className="w-full">
          <TabsList>
            <TabsTrigger value="matches" className="focus:shadow-none">Wedstrijden</TabsTrigger>
            <TabsTrigger value="players" className="focus:shadow-none">Spelers</TabsTrigger>
          </TabsList>
          <TabsContent value="matches" className="mt-6">
            <CompactMatchForm teamId={parseInt(teamId)} />
          </TabsContent>
          <TabsContent value="players" className="mt-6">
            <PlayersList teamId={parseInt(teamId)} onPlayersChange={setTeamPlayers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeamDashboard;
