import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { competitionService } from "@/services/match/competitionService";
import { teamService } from "@/services/core/teamService";
import { getSeasonalFairness, TeamSeasonalFairness, SeasonalFairnessMetrics } from "@/services/core/teamPreferencesService";
import { FairnessPreview } from "./FairnessPreview";
import { Loader2, BarChart3, Calendar, Users } from "lucide-react";

export const CompetitionWithFairnessPage: React.FC = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [fairnessMetrics, setFairnessMetrics] = useState<SeasonalFairnessMetrics | null>(null);
  const [teamFairness, setTeamFairness] = useState<TeamSeasonalFairness[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [competitionPreview, setCompetitionPreview] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teams
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);
      
      // Load seasonal fairness
      const { fairnessMetrics, teamFairness } = await getSeasonalFairness(teamsData);
      setFairnessMetrics(fairnessMetrics);
      setTeamFairness(teamFairness);
      
    } catch (error) {
      console.error('Error loading fairness data:', error);
      toast({
        title: "Fout bij laden data",
        description: "Er is een fout opgetreden bij het laden van de fairness data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFairnessPreview = async () => {
    if (teams.length === 0) {
      toast({
        title: "Geen teams",
        description: "Er zijn geen teams beschikbaar voor preview.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPreviewLoading(true);
      
      // Mock configuration for preview
      const mockConfig = {
        format: { 
          id: 1, 
          name: "Reguliere Competitie", 
          description: "Fairness Test", 
          regular_rounds: 2, 
          has_playoffs: false 
        },
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        teams: teams.map(t => t.team_id)
      };

      const preview = await competitionService.previewCompetition(mockConfig);
      setCompetitionPreview(preview);
      
      // Refresh fairness data after generating preview
      await loadData();
      
      toast({
        title: "Preview gegenereerd",
        description: "Fairness-geoptimaliseerde competitie preview is succesvol gegenereerd.",
      });
      
    } catch (error) {
      console.error('Error generating fairness preview:', error);
      toast({
        title: "Fout bij preview",
        description: "Er is een fout opgetreden bij het genereren van de preview.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTeamPreferenceUpdate = async () => {
    // Trigger refresh when team preferences are updated
    await loadData();
    toast({
      title: "Voorkeuren gewijzigd",
      description: "Fairness scores zijn herberekend op basis van nieuwe voorkeuren.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competition Fairness Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor seasonal fairness en genereer eerlijke competitie schema's
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadData} 
            variant="outline"
            disabled={loading}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Ververs Data
          </Button>
          <Button 
            onClick={generateFairnessPreview}
            disabled={previewLoading || teams.length === 0}
          >
            {previewLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Genereer Preview
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fairness" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fairness" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Fairness Metrics
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Details
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Competition Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fairness" className="space-y-6">
          {fairnessMetrics && (
            <FairnessPreview 
              fairnessMetrics={fairnessMetrics}
              teamFairness={teamFairness}
            />
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => {
                    const teamFairnessData = teamFairness.find(tf => tf.teamId === team.team_id);
                    return (
                      <Card key={team.team_id} className="p-4">
                        <div className="font-semibold">{team.team_name}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Wedstrijden: {teamFairnessData?.totalMatches || 0}</div>
                          <div>Gemiddelde Score: {teamFairnessData?.averageScore.toFixed(2) || 'N/A'}</div>
                          <div>Deficit: {teamFairnessData?.fairnessDeficit.toFixed(2) || '0.00'}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2 w-full"
                          onClick={handleTeamPreferenceUpdate}
                        >
                          Update Voorkeuren
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competition Preview met Fairness</CardTitle>
            </CardHeader>
            <CardContent>
              {competitionPreview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">Totale Score</div>
                      <div className="text-2xl">{competitionPreview.totalCombined}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Wedstrijden</div>
                      <div className="text-2xl">{competitionPreview.plan?.length || 0}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Teams</div>
                      <div className="text-2xl">{teams.length}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Fairness Score</div>
                      <div className="text-2xl">{Math.round(fairnessMetrics?.fairnessScore || 0)}/100</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Team Scores in Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(competitionPreview.teamTotals || {}).map(([teamId, total]) => {
                        const team = teams.find(t => t.team_id === parseInt(teamId));
                        const matchCount = competitionPreview.plan?.filter((p: any) => 
                          p.home_team_id === parseInt(teamId) || p.away_team_id === parseInt(teamId)
                        ).length || 0;
                        const average = matchCount > 0 ? (total as number) / matchCount : 0;
                        
                        return (
                          <div key={teamId} className="flex justify-between p-2 bg-muted rounded">
                            <span>{team?.team_name || `Team ${teamId}`}</span>
                            <span className="font-mono">
                              {average.toFixed(2)} avg ({(total as number).toFixed(1)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Klik op "Genereer Preview" om een fairness-geoptimaliseerde competitie te genereren
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};