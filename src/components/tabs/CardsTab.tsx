import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCards, CardData } from "@/services/matchDataService";
import { sortDatesDesc } from "@/lib/dateUtils";

interface PlayerCardSummary {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  isSuspended: boolean;
  suspensionReason?: string;
  cards: CardData[];
}

const CardsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [cardTypeFilter, setCardTypeFilter] = useState("");

  const { data: allCards, isLoading } = useQuery({
    queryKey: ['allCards'],
    queryFn: fetchAllCards
  });

  // Group cards by player and calculate suspensions
  const playerCardSummaries: PlayerCardSummary[] = React.useMemo(() => {
    if (!allCards) return [];

    const playerGroups = allCards.reduce((acc, card) => {
      const key = `${card.playerId}-${card.playerName}`;
      if (!acc[key]) {
        acc[key] = {
          playerId: card.playerId,
          playerName: card.playerName,
          teamName: card.teamName,
          cards: []
        };
      }
      acc[key].cards.push(card);
      return acc;
    }, {} as Record<string, { playerId: number; playerName: string; teamName: string; cards: CardData[] }>);

    return Object.values(playerGroups).map(group => {
      const yellowCards = group.cards.filter(card => card.cardType === 'yellow').length;
      const redCards = group.cards.filter(card => card.cardType === 'red').length;
      
      // Calculate suspension
      let isSuspended = false;
      let suspensionReason = "";
      
      if (redCards > 0) {
        isSuspended = true;
        suspensionReason = `${redCards} rode kaart${redCards > 1 ? 'en' : ''}`;
      } else if (yellowCards >= 2) {
        isSuspended = true;
        suspensionReason = `${yellowCards} gele kaarten`;
      }

      return {
        playerId: group.playerId,
        playerName: group.playerName,
        teamName: group.teamName,
        yellowCards,
        redCards,
        totalCards: yellowCards + redCards,
        isSuspended,
        suspensionReason,
        cards: group.cards.sort((a, b) => sortDatesDesc(a.matchDate, b.matchDate))
      };
    }).sort((a, b) => b.totalCards - a.totalCards);
  }, [allCards]);

  // Get unique team names for filtering
  const teamNames = [...new Set(allCards?.map(card => card.teamName) || [])];

  const filteredSummaries = playerCardSummaries.filter(summary => {
    if (searchTerm && !summary.playerName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !summary.teamName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (teamFilter && summary.teamName !== teamFilter) {
      return false;
    }
    if (cardTypeFilter === 'yellow' && summary.yellowCards === 0) {
      return false;
    }
    if (cardTypeFilter === 'red' && summary.redCards === 0) {
      return false;
    }
    if (cardTypeFilter === 'suspended' && !summary.isSuspended) {
      return false;
    }
    return true;
  });

  const totalYellowCards = allCards?.filter(card => card.cardType === 'yellow').length || 0;
  const totalRedCards = allCards?.filter(card => card.cardType === 'red').length || 0;
  const suspendedPlayers = playerCardSummaries.filter(p => p.isSuspended).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <div>
                <p className="text-2xl font-bold">{totalYellowCards}</p>
                <p className="text-sm text-muted-foreground">Gele Kaarten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <div>
                <p className="text-2xl font-bold">{totalRedCards}</p>
                <p className="text-sm text-muted-foreground">Rode Kaarten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
              <div>
                <p className="text-2xl font-bold">{suspendedPlayers}</p>
                <p className="text-sm text-muted-foreground">Geschorst</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <div>
                <p className="text-2xl font-bold">{totalYellowCards + totalRedCards}</p>
                <p className="text-sm text-muted-foreground">Totaal Kaarten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Kaarten Overzicht</CardTitle>
          <CardDescription>
            Alle gele en rode kaarten uit wedstrijdformulieren
          </CardDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <Label htmlFor="search">Zoeken</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Speler of team..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="team-filter">Team</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger id="team-filter">
                  <SelectValue placeholder="Alle teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle teams</SelectItem>
                  {teamNames.map((team, idx) => (
                    <SelectItem key={idx} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="card-type-filter">Kaarttype</Label>
              <Select value={cardTypeFilter} onValueChange={setCardTypeFilter}>
                <SelectTrigger id="card-type-filter">
                  <SelectValue placeholder="Alle kaarten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle kaarten</SelectItem>
                  <SelectItem value="yellow">Gele kaarten</SelectItem>
                  <SelectItem value="red">Rode kaarten</SelectItem>
                  <SelectItem value="suspended">Geschorste spelers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTeamFilter("");
                  setCardTypeFilter("");
                }}
              >
                Filters wissen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Kaarten laden...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speler</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Gele Kaarten</TableHead>
                    <TableHead className="text-center">Rode Kaarten</TableHead>
                    <TableHead className="text-center">Totaal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Laatste Kaart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map((summary) => (
                    <TableRow key={`${summary.playerId}-${summary.playerName}`}>
                      <TableCell className="font-medium">{summary.playerName}</TableCell>
                      <TableCell>{summary.teamName}</TableCell>
                      <TableCell className="text-center">
                        {summary.yellowCards > 0 && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            {summary.yellowCards}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.redCards > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            {summary.redCards}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {summary.totalCards}
                      </TableCell>
                      <TableCell className="text-center">
                        {summary.isSuspended ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Geschorst
                          </Badge>
                        ) : (
                          <Badge variant="outline">Actief</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {summary.cards.length > 0 && (
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${summary.cards[0].cardType === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                              <span>{summary.cards[0].matchDate}</span>
                              <Badge variant="outline" className="text-xs">
                                {summary.cards[0].uniqueNumber}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSummaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Geen kaarten gevonden met de huidige filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardsTab;
