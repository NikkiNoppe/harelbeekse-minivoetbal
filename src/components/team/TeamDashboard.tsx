
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import PlayersList from "./PlayersList";

interface TeamDashboardProps {
  user: {
    id: number;
    username: string;
    role: string;
    teamId?: number;
  };
  teamData: {
    id: number;
    name: string;
    permissions: {
      scores: boolean;
      players: boolean;
    };
  };
}

const mockMatches = [
  { id: 1, opponent: "FC De Kampioenen", date: "2025-05-10", location: "Thuis", result: null },
  { id: 2, opponent: "Bavo United", date: "2025-05-17", location: "Uit", result: null },
  { id: 3, opponent: "Zandberg Boys", date: "2025-05-24", location: "Thuis", result: null },
];

const TeamDashboard: React.FC<TeamDashboardProps> = ({ user, teamData }) => {
  const { toast } = useToast();
  const [matches, setMatches] = useState(mockMatches);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const handleScoreSubmit = () => {
    if (!selectedMatchId || !homeScore || !awayScore) {
      toast({
        title: "Fout",
        description: "Selecteer een wedstrijd en vul beide scores in",
        variant: "destructive",
      });
      return;
    }

    setMatches(
      matches.map((match) => {
        if (match.id === selectedMatchId) {
          return {
            ...match,
            result: `${homeScore}-${awayScore}`,
          };
        }
        return match;
      })
    );

    setHomeScore("");
    setAwayScore("");
    setSelectedMatchId(null);

    toast({
      title: "Score opgeslagen",
      description: "De wedstrijdscore is succesvol opgeslagen",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Dashboard: {teamData.name}</h1>

      <Tabs defaultValue="matches">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matches" disabled={!teamData.permissions.scores}>
            Wedstrijden
          </TabsTrigger>
          <TabsTrigger value="players" disabled={!teamData.permissions.players}>
            Spelerslijst
          </TabsTrigger>
        </TabsList>

        {teamData.permissions.scores && (
          <TabsContent value="matches" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Wedstrijdscores invoeren</CardTitle>
                <CardDescription>
                  Voer de scores van uw wedstrijden in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="match-select" className="block text-sm font-medium">
                      Selecteer wedstrijd
                    </label>
                    <select
                      id="match-select"
                      className="w-full p-2 border rounded-md"
                      value={selectedMatchId || ""}
                      onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                    >
                      <option value="">Kies een wedstrijd</option>
                      {matches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {`${teamData.name} vs ${match.opponent} - ${match.date}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label htmlFor="home-score" className="text-sm font-medium">
                        Thuis score
                      </label>
                      <Input
                        id="home-score"
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-center items-center">
                      <span className="text-xl font-bold">-</span>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="away-score" className="text-sm font-medium">
                        Uit score
                      </label>
                      <Input
                        id="away-score"
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleScoreSubmit}>Score opslaan</Button>

                  <div className="rounded-md border mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tegenstander</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead>Locatie</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell>{match.opponent}</TableCell>
                            <TableCell>{match.date}</TableCell>
                            <TableCell>{match.location}</TableCell>
                            <TableCell>
                              {match.result ? match.result : "Niet ingevuld"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {teamData.permissions.players && (
          <TabsContent value="players" className="space-y-4 mt-4">
            <PlayersList teamId={user.teamId || 0} teamName={teamData.name} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TeamDashboard;
