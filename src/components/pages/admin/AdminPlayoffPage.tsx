import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trophy, AlertCircle, Trash2, Calendar, CheckCircle, Clock, Undo2, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { competitionService, CompetitionMatch } from "@/services/match/competitionService";
import { playoffService, PlayoffMatch } from "@/services/match/playoffService";
import { teamService } from "@/services/core/teamService";
import { cn } from "@/lib/utils";
interface TeamStanding {
  team_id: number;
  team_name: string;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  position: number;
}
type PlayoffStatus = 'none' | 'concept' | 'finalized';
type ConfirmAction = 'finalize' | 'unfinalize' | 'delete' | null;

// Workflow Stepper Component
const WorkflowStepper = ({
  status
}: {
  status: PlayoffStatus;
}) => {
  const steps = [{
    id: 'none',
    label: 'Configureer',
    shortLabel: '1',
    icon: Settings
  }, {
    id: 'concept',
    label: 'Concept',
    shortLabel: '2',
    icon: Clock
  }, {
    id: 'finalized',
    label: 'Definitief',
    shortLabel: '3',
    icon: CheckCircle
  }];
  const getStepState = (stepId: string) => {
    const statusOrder = ['none', 'concept', 'finalized'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };
  return <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 bg-muted/30 rounded-lg">
      {steps.map((step, i) => {
      const state = getStepState(step.id);
      const Icon = step.icon;
      return <React.Fragment key={step.id}>
            <div className={cn("flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors", state === 'current' && "bg-[hsl(var(--color-500))] text-white", state === 'completed' && "bg-[hsl(var(--color-100))] text-[hsl(var(--color-700))]", state === 'pending' && "bg-muted text-muted-foreground")}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.shortLabel}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />}
          </React.Fragment>;
    })}
    </div>;
};

// Mobile Standings Card Component
const MobileStandingsCard = ({
  team,
  isTopTeam,
  isBottomTeam
}: {
  team: TeamStanding;
  isTopTeam: boolean;
  isBottomTeam: boolean;
}) => <div className={cn("p-3 rounded-lg flex items-center justify-between", isTopTeam && "bg-green-50 dark:bg-green-950/30", isBottomTeam && "bg-amber-50 dark:bg-amber-950/30", !isTopTeam && !isBottomTeam && "bg-muted/50")}>
    <div className="flex items-center gap-3 min-w-0">
      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", isTopTeam && "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100", isBottomTeam && "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100", !isTopTeam && !isBottomTeam && "bg-muted-foreground/20 text-muted-foreground")}>
        {team.position}
      </span>
      <span className="font-medium truncate">{team.team_name}</span>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="font-semibold text-sm">{team.points} ptn</span>
      {isTopTeam && <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-[10px] px-1.5">
          Top
        </Badge>}
      {isBottomTeam && <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-[10px] px-1.5">
          Bottom
        </Badge>}
    </div>
  </div>;

// Mobile Match Card Component
const MobileMatchCard = ({
  match,
  getTeamDisplay
}: {
  match: PlayoffMatch;
  getTeamDisplay: (match: PlayoffMatch, isHome: boolean) => string;
}) => <div className="p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground">
        {new Date(match.match_date).toLocaleDateString('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })}
      </span>
      {!match.is_playoff_finalized && <Badge variant="outline" className="text-[10px] h-5">Concept</Badge>}
    </div>
    <div className="flex items-center gap-2">
      <div className="flex-1 text-right min-w-0">
        <span className={cn("text-sm truncate block", match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic")}>
          {getTeamDisplay(match, true)}
        </span>
      </div>
      <div className="px-2 min-w-[50px] text-center flex-shrink-0">
        {match.home_score !== null && match.away_score !== null ? <span className="font-bold">{match.home_score} - {match.away_score}</span> : <span className="text-muted-foreground text-xs">vs</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm truncate block", match.is_playoff_finalized ? "font-medium" : "text-muted-foreground italic")}>
          {getTeamDisplay(match, false)}
        </span>
      </div>
    </div>
  </div>;
const AdminPlayoffPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [playoffStatus, setPlayoffStatus] = useState<PlayoffStatus>('none');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // Configuration state
  const [topTeamCount, setTopTeamCount] = useState(8);
  const [bottomTeamCount, setBottomTeamCount] = useState(7);
  const [rounds, setRounds] = useState(2);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  useEffect(() => {
    loadInitialData();
  }, []);
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);
      const matches = await competitionService.getCompetitionMatches();
      const regularMatches = matches.filter(match => !match.is_playoff_match);
      const calculatedStandings = calculateStandings(teamsData, regularMatches);
      setStandings(calculatedStandings);
      const playoffData = await playoffService.getPlayoffMatches();
      setPlayoffMatches(playoffData);
      if (playoffData.length === 0) {
        setPlayoffStatus('none');
      } else if (playoffData.some(m => m.is_playoff_finalized)) {
        setPlayoffStatus('finalized');
      } else {
        setPlayoffStatus('concept');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const calculateStandings = (teams: any[], matches: CompetitionMatch[]): TeamStanding[] => {
    const standings: {
      [key: number]: TeamStanding;
    } = {};
    teams.forEach(team => {
      standings[team.team_id] = {
        team_id: team.team_id,
        team_name: team.team_name,
        points: 0,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        position: 0
      };
    });
    matches.forEach(match => {
      if (match.home_score !== null && match.away_score !== null && match.home_team_id && match.away_team_id) {
        const homeTeam = standings[match.home_team_id];
        const awayTeam = standings[match.away_team_id];
        if (homeTeam && awayTeam) {
          homeTeam.matches_played++;
          awayTeam.matches_played++;
          homeTeam.goals_for += match.home_score;
          homeTeam.goals_against += match.away_score;
          awayTeam.goals_for += match.away_score;
          awayTeam.goals_against += match.home_score;
          if (match.home_score > match.away_score) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
          } else if (match.home_score < match.away_score) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
          } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
          }
        }
      }
    });
    const sorted = Object.values(standings).map(team => ({
      ...team,
      goal_difference: team.goals_for - team.goals_against
    })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
    return sorted.map((team, index) => ({
      ...team,
      position: index + 1
    }));
  };
  const handleGeneratePositionBasedPlayoffs = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Datums vereist",
        description: "Selecteer een geldige start- en einddatum voor de playoffs.",
        variant: "destructive"
      });
      return;
    }
    setActionLoading(true);
    try {
      const topPositions = Array.from({
        length: topTeamCount
      }, (_, i) => i + 1);
      const bottomPositions = Array.from({
        length: bottomTeamCount
      }, (_, i) => topTeamCount + i + 1);
      const result = await playoffService.generatePositionBasedPlayoffs(topPositions, bottomPositions, rounds, startDate, endDate);
      if (result.success) {
        toast({
          title: "Planning aangemaakt",
          description: result.message
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout bij genereren",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating playoffs:', error);
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de playoffs.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };
  const handleFinalizePlayoffs = async () => {
    setActionLoading(true);
    try {
      const standingsMap = new Map<number, number>();
      standings.forEach(team => {
        standingsMap.set(team.position, team.team_id);
      });
      const result = await playoffService.finalizePlayoffs(standingsMap);
      if (result.success) {
        toast({
          title: "Playoffs gefinaliseerd",
          description: result.message
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout bij finaliseren",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error finalizing playoffs:', error);
      toast({
        title: "Fout bij finaliseren",
        description: "Er is een fout opgetreden bij het finaliseren.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };
  const handleUnfinalizePlayoffs = async () => {
    setActionLoading(true);
    try {
      const result = await playoffService.unfinalizePlayoffs();
      if (result.success) {
        toast({
          title: "Finalisatie ongedaan gemaakt",
          description: result.message
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error unfinalizing playoffs:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };
  const handleDeletePlayoffs = async () => {
    setActionLoading(true);
    try {
      const result = await playoffService.deletePlayoffMatches();
      if (result.success) {
        toast({
          title: "Playoffs verwijderd",
          description: result.message
        });
        await loadInitialData();
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting playoffs:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };
  const handleConfirmedAction = () => {
    switch (confirmAction) {
      case 'finalize':
        handleFinalizePlayoffs();
        break;
      case 'unfinalize':
        handleUnfinalizePlayoffs();
        break;
      case 'delete':
        handleDeletePlayoffs();
        break;
    }
  };
  const getTeamDisplay = (match: PlayoffMatch, isHome: boolean) => {
    if (isHome) {
      if (match.home_team_name) return match.home_team_name;
      if (match.home_position) return `${match.home_position}e`;
      return 'Onbekend';
    } else {
      if (match.away_team_name) return match.away_team_name;
      if (match.away_position) return `${match.away_position}e`;
      return 'Onbekend';
    }
  };
  const hasPlayoffMatches = playoffMatches.length > 0;
  const topPlayoffMatches = playoffMatches.filter(m => m.playoff_type === 'top');
  const bottomPlayoffMatches = playoffMatches.filter(m => m.playoff_type === 'bottom');
  const confirmDialogContent = {
    finalize: {
      title: 'Playoffs Finaliseren?',
      description: 'Teams worden definitief toegewezen op basis van de huidige stand. Zorg dat de competitie is afgelopen.',
      actionLabel: 'Finaliseer',
      variant: 'default' as const
    },
    unfinalize: {
      title: 'Finalisatie Ongedaan Maken?',
      description: 'Teams worden weer vervangen door posities. Je kunt later opnieuw finaliseren met een nieuwe stand.',
      actionLabel: 'Maak Ongedaan',
      variant: 'default' as const
    },
    delete: {
      title: 'Playoffs Verwijderen?',
      description: 'Alle playoff wedstrijden worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.',
      actionLabel: 'Verwijder',
      variant: 'destructive' as const
    }
  };
  return <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Play-Off Beheer</h2>
        </div>
        <WorkflowStepper status={playoffStatus} />
      </div>

      <section className="space-y-4 sm:space-y-6">
        {/* Competitie Stand */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              Huidige Stand
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Posities voor playoff planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div> : isMobile ?
          // Mobile: Card-based layout
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {standings.map(team => <MobileStandingsCard key={team.team_id} team={team} isTopTeam={team.position <= topTeamCount} isBottomTeam={team.position > topTeamCount && team.position <= topTeamCount + bottomTeamCount} />)}
              </div> :
          // Desktop: Table layout
          <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Pos</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">GS</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">G</TableHead>
                      <TableHead className="text-center">V</TableHead>
                      <TableHead className="text-center">DS</TableHead>
                      <TableHead className="text-center">Ptn</TableHead>
                      <TableHead className="text-center">Playoff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map(team => {
                  const isTopTeam = team.position <= topTeamCount;
                  const isBottomTeam = team.position > topTeamCount && team.position <= topTeamCount + bottomTeamCount;
                  return <TableRow key={team.team_id} className={cn(isTopTeam && "bg-green-50 dark:bg-green-950/30", isBottomTeam && "bg-amber-50 dark:bg-amber-950/30")}>
                          <TableCell className="font-bold">{team.position}</TableCell>
                          <TableCell className="font-medium">{team.team_name}</TableCell>
                          <TableCell className="text-center">{team.matches_played}</TableCell>
                          <TableCell className="text-center">{team.wins}</TableCell>
                          <TableCell className="text-center">{team.draws}</TableCell>
                          <TableCell className="text-center">{team.losses}</TableCell>
                          <TableCell className="text-center">{team.goal_difference}</TableCell>
                          <TableCell className="text-center font-semibold">{team.points}</TableCell>
                          <TableCell className="text-center">
                            {isTopTeam && <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                Top
                              </Badge>}
                            {isBottomTeam && <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">
                                Bottom
                              </Badge>}
                          </TableCell>
                        </TableRow>;
                })}
                  </TableBody>
                </Table>
              </div>}
          </CardContent>
        </Card>

        {/* Playoff Configuration & Generation */}
        {playoffStatus === 'none' && <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Planning Genereren</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Maak een concept planning aan op basis van posities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates - Always visible */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Start
                  </Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Einde
                  </Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11" />
                </div>
              </div>

              {/* Mobile: Collapsible advanced options */}
              <div className="sm:hidden">
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Geavanceerde Opties</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", advancedOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Top Playoff Teams</Label>
                      <Select value={topTeamCount.toString()} onValueChange={v => setTopTeamCount(parseInt(v))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[6, 7, 8].map(n => <SelectItem key={n} value={n.toString()}>{n} teams (pos 1-{n})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Bottom Playoff Teams</Label>
                      <Select value={bottomTeamCount.toString()} onValueChange={v => setBottomTeamCount(parseInt(v))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[6, 7, 8].map(n => <SelectItem key={n} value={n.toString()}>{n} teams (pos {topTeamCount + 1}-{topTeamCount + n})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Aantal Rondes</Label>
                      <Select value={rounds.toString()} onValueChange={v => setRounds(parseInt(v))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 ronde</SelectItem>
                          <SelectItem value="2">2 rondes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Desktop: Grid layout for advanced options */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Top Playoff Teams</Label>
                  <Select value={topTeamCount.toString()} onValueChange={v => setTopTeamCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8].map(n => <SelectItem key={n} value={n.toString()}>{n} teams (pos 1-{n})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bottom Playoff Teams</Label>
                  <Select value={bottomTeamCount.toString()} onValueChange={v => setBottomTeamCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8].map(n => <SelectItem key={n} value={n.toString()}>{n} teams (pos {topTeamCount + 1}-{topTeamCount + n})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aantal Rondes</Label>
                  <Select value={rounds.toString()} onValueChange={v => setRounds(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 ronde</SelectItem>
                      <SelectItem value="2">2 rondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              

              {/* Generate Button */}
              <Button onClick={handleGeneratePositionBasedPlayoffs} disabled={actionLoading || !startDate || !endDate} className="w-full h-12 text-base font-medium">
                {actionLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Trophy className="h-5 w-5 mr-2" />}
                Genereer Planning
              </Button>

              <Alert className="bg-muted/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  De planning wordt aangemaakt met posities. Bij finalisatie worden echte teams toegewezen.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>}

        {/* Concept Status Card */}
        {playoffStatus === 'concept' && <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Concept Planning</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Wachten op eindstand om te finaliseren</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => setConfirmAction('finalize')} disabled={actionLoading} className="flex-1 h-11">
                  {actionLoading && confirmAction === 'finalize' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Finaliseer
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction('delete')} disabled={actionLoading} className="h-11 text-destructive border-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijder
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Finalized Status Card */}
        {playoffStatus === 'finalized' && <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Playoffs Gefinaliseerd</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Teams zijn toegewezen aan de wedstrijden</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setConfirmAction('unfinalize')} disabled={actionLoading} className="flex-1 h-11">
                  {actionLoading && confirmAction === 'unfinalize' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
                  Terug naar Concept
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction('delete')} disabled={actionLoading} className="h-11 text-destructive border-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijder
                </Button>
              </div>
            </CardContent>
          </Card>}

        {/* Playoff Matches Display */}
        {hasPlayoffMatches && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Playoff Matches */}
            {topPlayoffMatches.length > 0 && <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">Top</Badge>
                    Top Playoffs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topPlayoffMatches.map(match => <MobileMatchCard key={match.match_id} match={match} getTeamDisplay={getTeamDisplay} />)}
                </CardContent>
              </Card>}

            {/* Bottom Playoff Matches */}
            {bottomPlayoffMatches.length > 0 && <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">Bottom</Badge>
                    Bottom Playoffs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bottomPlayoffMatches.map(match => <MobileMatchCard key={match.match_id} match={match} getTeamDisplay={getTeamDisplay} />)}
                </CardContent>
              </Card>}
          </div>}

        {/* Empty State */}
        {!hasPlayoffMatches && playoffStatus === 'none' && !loading && <Card>
            <CardContent className="text-center py-10 sm:py-12">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Geen Playoff Planning</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
                Configureer de instellingen hierboven en genereer een planning op basis van posities.
              </p>
            </CardContent>
          </Card>}
      </section>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction && confirmDialogContent[confirmAction].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && confirmDialogContent[confirmAction].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-11 sm:h-10">Annuleer</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedAction} disabled={actionLoading} className={cn("h-11 sm:h-10", confirmAction === 'delete' && "bg-destructive hover:bg-destructive/90")}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {confirmAction && confirmDialogContent[confirmAction].actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default AdminPlayoffPage;