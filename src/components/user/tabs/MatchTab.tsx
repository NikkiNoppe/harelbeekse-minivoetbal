import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MOCK_TEAMS } from "@/components/Layout";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Check, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// Mock player data
const MOCK_PLAYERS = {
  1: [
    { id: 1, name: "Jan Verbeke", number: 1 },
    { id: 2, name: "Pieter Jansens", number: 2 },
    { id: 3, name: "Karel Decoene", number: 3 },
    { id: 4, name: "Thomas Vanneste", number: 4 },
    { id: 5, name: "Dries Mortelmans", number: 5 },
    { id: 6, name: "Lucas Mertens", number: 6 },
    { id: 7, name: "Mathias Delvaux", number: 7 },
    { id: 8, name: "Simon Verstraete", number: 8 },
    { id: 9, name: "Jonas Van Damme", number: 9 },
    { id: 10, name: "Koen Vandecasteele", number: 10 },
  ],
  2: [
    { id: 11, name: "Dmitri Petrenko", number: 1 },
    { id: 12, name: "Alexei Volkov", number: 2 },
    { id: 13, name: "Ivan Truu", number: 3 },
    { id: 14, name: "Sergei Kozlov", number: 4 },
    { id: 15, name: "Vladislav Makarov", number: 5 },
    { id: 16, name: "Mikhail Popov", number: 6 },
    { id: 17, name: "Oleg Sokolov", number: 7 },
    { id: 18, name: "Viktor Baranov", number: 8 },
    { id: 19, name: "Nikolai Fedorov", number: 9 },
    { id: 20, name: "Boris Morozov", number: 10 },
  ],
  3: [
    { id: 21, name: "Tom Daelemans", number: 1 },
    { id: 22, name: "Bart Verstappen", number: 2 },
    { id: 23, name: "Jeroen De Smet", number: 3 },
    { id: 24, name: "Koen Van Hoof", number: 4 },
    { id: 25, name: "Steven Janssens", number: 5 },
    { id: 26, name: "Peter Coppens", number: 6 },
    { id: 27, name: "David Van Dyck", number: 7 },
  ],
  4: [
    { id: 28, name: "Marc Goossens", number: 1 },
    { id: 29, name: "Tim Verlinden", number: 2 },
    { id: 30, name: "Stijn Peeters", number: 3 },
    { id: 31, name: "Nick Willems", number: 4 },
    { id: 32, name: "Wim De Vos", number: 5 },
    { id: 33, name: "Hans Vermeulen", number: 6 },
    { id: 34, name: "Joris Vercammen", number: 7 },
    { id: 35, name: "Sven Govaerts", number: 8 },
  ]
};

// Mock matches
const MOCK_MATCHES = [
  {
    id: 1,
    date: new Date('2025-05-24'),
    homeTeamId: 1,
    awayTeamId: 2,
    location: "Sporthal De Dageraad",
    time: "20:00",
    status: "upcoming",
    matchday: "Speeldag 11"
  },
  {
    id: 2,
    date: new Date('2025-05-24'),
    homeTeamId: 3,
    awayTeamId: 4,
    location: "Sporthal De Dageraad",
    time: "21:15",
    status: "upcoming",
    matchday: "Speeldag 11"
  },
  {
    id: 3,
    date: new Date('2025-05-31'),
    homeTeamId: 5,
    awayTeamId: 6,
    location: "Sporthal De Dageraad",
    time: "20:00",
    status: "upcoming",
    matchday: "Speeldag 12"
  }
];

interface Player {
  id: number;
  name: string;
  number: number;
}

interface SelectedPlayer extends Player {
  yellowCard?: boolean;
  redCard?: boolean;
}

interface Match {
  id: number;
  date: Date;
  homeTeamId: number;
  awayTeamId: number;
  location: string;
  time: string;
  status: string;
  matchday: string;
}

const MatchTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<SelectedPlayer[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<SelectedPlayer[]>([]);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [refereeComment, setRefereeComment] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Get matches for selected date
  const matchesOnDate = MOCK_MATCHES.filter(match => 
    selectedDate && match.date.toDateString() === selectedDate.toDateString()
  );
  
  // Filter upcoming matches (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingMatches = MOCK_MATCHES.filter(match => {
    return match.date >= today && match.date <= nextWeek;
  });
  
  // Get matches for current user's team if they're a team admin
  const userTeamMatches = user?.teamId 
    ? MOCK_MATCHES.filter(match => 
        match.homeTeamId === user.teamId || match.awayTeamId === user.teamId
      ) 
    : [];
  
  // Handle selecting a match
  const handleSelectMatch = (matchId: number) => {
    const match = MOCK_MATCHES.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
    
      // Reset form
      setHomeTeamPlayers([]);
      setAwayTeamPlayers([]);
      setHomeScore("");
      setAwayScore("");
      setRefereeComment("");
      setIsSubmitted(false);
    }
  };
  
  // Handle add/remove player from lineup
  const handleTogglePlayer = (player: Player, isHome: boolean) => {
    if (isSubmitted) return; // Prevent changes if already submitted
    
    if (isHome) {
      // Check if player is already in the lineup
      const playerIndex = homeTeamPlayers.findIndex(p => p.id === player.id);
      
      if (playerIndex !== -1) {
        // Remove player
        setHomeTeamPlayers(homeTeamPlayers.filter(p => p.id !== player.id));
      } else {
        // Add player if not exceeding 8 players
        if (homeTeamPlayers.length < 8) {
          setHomeTeamPlayers([...homeTeamPlayers, player]);
        } else {
          toast({
            title: "Maximum bereikt",
            description: "Je kunt maximaal 8 spelers selecteren",
            variant: "destructive",
          });
        }
      }
    } else {
      // Same logic for away team
      const playerIndex = awayTeamPlayers.findIndex(p => p.id === player.id);
      
      if (playerIndex !== -1) {
        setAwayTeamPlayers(awayTeamPlayers.filter(p => p.id !== player.id));
      } else {
        if (awayTeamPlayers.length < 8) {
          setAwayTeamPlayers([...awayTeamPlayers, player]);
        } else {
          toast({
            title: "Maximum bereikt",
            description: "Je kunt maximaal 8 spelers selecteren",
            variant: "destructive",
          });
        }
      }
    }
  };
  
  // Handle yellow card
  const handleYellowCard = (playerId: number, isHome: boolean) => {
    if (!user?.role || user.role === "team") return;
    
    if (isHome) {
      setHomeTeamPlayers(homeTeamPlayers.map(p => 
        p.id === playerId ? { ...p, yellowCard: !p.yellowCard } : p
      ));
    } else {
      setAwayTeamPlayers(awayTeamPlayers.map(p => 
        p.id === playerId ? { ...p, yellowCard: !p.yellowCard } : p
      ));
    }
  };
  
  // Handle red card
  const handleRedCard = (playerId: number, isHome: boolean) => {
    if (!user?.role || user.role === "team") return;
    
    if (isHome) {
      setHomeTeamPlayers(homeTeamPlayers.map(p => 
        p.id === playerId ? { ...p, redCard: !p.redCard } : p
      ));
    } else {
      setAwayTeamPlayers(awayTeamPlayers.map(p => 
        p.id === playerId ? { ...p, redCard: !p.redCard } : p
      ));
    }
  };
  
  // Submit match sheet
  const handleSubmitMatchSheet = () => {
    if (!selectedMatch) return;
    
    if (user?.role === "team") {
      toast({
        title: "Spelersopstelling bevestigd",
        description: "De spelersopstelling is opgeslagen",
      });
    } else if (user?.role === "referee" || user?.role === "admin") {
      // Validate scores
      if (homeScore === "" || awayScore === "") {
        toast({
          title: "Score ontbreekt",
          description: "Vul alstublieft de score in voor beide teams",
          variant: "destructive",
        });
        return;
      }
      
      // Update standings (in a real app this would update the database)
      const homeScoreNum = parseInt(homeScore);
      const awayScoreNum = parseInt(awayScore);
      
      setIsSubmitted(true);
      toast({
        title: "Wedstrijdblad bevestigd",
        description: "Het wedstrijdblad is definitief opgeslagen",
      });
    }
  };
  
  // Format date for display
  const formatMatchDate = (date: Date) => {
    return format(date, "EEEE d MMMM", { locale: nl });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijdkalender</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Selecteer een datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-2"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: nl })
                    ) : (
                      <span>Kies een datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Beschikbare wedstrijden</Label>
              <Select 
                onValueChange={(value) => handleSelectMatch(parseInt(value))}
                disabled={matchesOnDate.length === 0}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Selecteer een wedstrijd" />
                </SelectTrigger>
                <SelectContent>
                  {matchesOnDate.map(match => {
                    const homeTeam = MOCK_TEAMS.find(t => t.id === match.homeTeamId);
                    const awayTeam = MOCK_TEAMS.find(t => t.id === match.awayTeamId);
                    return (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        {homeTeam?.name} vs {awayTeam?.name} ({match.time})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {matchesOnDate.length === 0 && selectedDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Geen wedstrijden gepland op deze datum
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming matches section - new addition */}
      <Card>
        <CardHeader>
          <CardTitle>Aankomende Wedstrijden</CardTitle>
          <CardDescription>
            Wedstrijden in de komende 7 dagen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map(match => {
                const homeTeam = MOCK_TEAMS.find(t => t.id === match.homeTeamId);
                const awayTeam = MOCK_TEAMS.find(t => t.id === match.awayTeamId);
                const isUserTeam = user?.teamId && (match.homeTeamId === user.teamId || match.awayTeamId === user.teamId);
                
                return (
                  <div 
                    key={match.id} 
                    className={`border rounded-md p-3 hover:bg-slate-800 transition-colors ${
                      isUserTeam ? "border-orange-500/30 bg-slate-800/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-transparent text-orange-400 border-orange-400/20">
                          {match.matchday}
                        </Badge>
                        {isUserTeam && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                            Jouw team
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-muted-foreground" />
                        <span>{match.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{homeTeam?.name}</div>
                      <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium">VS</div>
                      <div className="font-medium">{awayTeam?.name}</div>
                    </div>
                    
                    <div className="flex justify-between mt-3">
                      <div className="text-sm text-muted-foreground">
                        {formatMatchDate(match.date)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {match.location}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDate(match.date);
                          handleSelectMatch(match.id);
                        }}
                      >
                        Wedstrijdblad invullen
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Er zijn geen wedstrijden gepland in de komende week
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedMatch && (
        <>
          <Card className={isSubmitted ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle>
                Wedstrijdblad
                {isSubmitted && (
                  <span className="ml-2 text-sm text-orange-400">(Vergrendeld)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team */}
                <MatchTeamSection 
                  team={MOCK_TEAMS.find(t => t.id === selectedMatch.homeTeamId)}
                  players={MOCK_PLAYERS[selectedMatch.homeTeamId] || []}
                  selectedPlayers={homeTeamPlayers}
                  onTogglePlayer={(player) => handleTogglePlayer(player, true)}
                  onYellowCard={(playerId) => handleYellowCard(playerId, true)}
                  onRedCard={(playerId) => handleRedCard(playerId, true)}
                  disabled={isSubmitted}
                  isReferee={user?.role === "referee" || user?.role === "admin"}
                  score={homeScore}
                  onScoreChange={setHomeScore}
                  isTeamManager={user?.role === "team" && user?.teamId === selectedMatch.homeTeamId}
                />
                
                {/* Away Team */}
                <MatchTeamSection 
                  team={MOCK_TEAMS.find(t => t.id === selectedMatch.awayTeamId)}
                  players={MOCK_PLAYERS[selectedMatch.awayTeamId] || []}
                  selectedPlayers={awayTeamPlayers}
                  onTogglePlayer={(player) => handleTogglePlayer(player, false)}
                  onYellowCard={(playerId) => handleYellowCard(playerId, false)}
                  onRedCard={(playerId) => handleRedCard(playerId, false)}
                  disabled={isSubmitted}
                  isReferee={user?.role === "referee" || user?.role === "admin"}
                  score={awayScore}
                  onScoreChange={setAwayScore}
                  isTeamManager={user?.role === "team" && user?.teamId === selectedMatch.awayTeamId}
                />
              </div>
              
              {/* Referee Comments - Only visible to referees and admins */}
              {(user?.role === "referee" || user?.role === "admin") && (
                <div className="mt-6">
                  <Label htmlFor="referee-comment">Scheidsrechter commentaar</Label>
                  <Textarea 
                    id="referee-comment"
                    placeholder="Opmerkingen over de wedstrijd..."
                    className="mt-2"
                    value={refereeComment}
                    onChange={(e) => setRefereeComment(e.target.value)}
                    disabled={isSubmitted}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSubmitMatchSheet}
                disabled={isSubmitted}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                {user?.role === "team" 
                  ? "Opstelling bevestigen" 
                  : "Wedstrijdblad bevestigen"}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

interface MatchTeamSectionProps {
  team: any;
  players: Player[];
  selectedPlayers: SelectedPlayer[];
  onTogglePlayer: (player: Player) => void;
  onYellowCard: (playerId: number) => void;
  onRedCard: (playerId: number) => void;
  disabled: boolean;
  isReferee: boolean;
  score: string;
  onScoreChange: (value: string) => void;
  isTeamManager: boolean;
}

const MatchTeamSection: React.FC<MatchTeamSectionProps> = ({
  team,
  players,
  selectedPlayers,
  onTogglePlayer,
  onYellowCard,
  onRedCard,
  disabled,
  isReferee,
  score,
  onScoreChange,
  isTeamManager
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{team?.name}</h3>
        {isReferee && (
          <div className="flex items-center">
            <Label className="mr-2">Score:</Label>
            <Input 
              type="number"
              min="0"
              className="w-16"
              value={score}
              onChange={(e) => onScoreChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      
      <div className="border rounded-md">
        <div className="bg-slate-800 p-2 font-medium rounded-t-md flex items-center justify-between">
          <span>Spelerslijst</span>
          <span className="text-sm text-muted-foreground">
            {selectedPlayers.length}/8 geselecteerd
          </span>
        </div>
        
        <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
          {players.map((player) => {
            const isSelected = selectedPlayers.some(p => p.id === player.id);
            const selectedPlayer = selectedPlayers.find(p => p.id === player.id);
            
            return (
              <div 
                key={player.id} 
                className={`p-2 rounded-md flex items-center justify-between ${
                  isSelected 
                    ? "bg-slate-700 border border-orange-500/30" 
                    : "bg-slate-800 hover:bg-slate-700"
                } ${disabled ? "opacity-75" : ""}`}
              >
                <div className="flex items-center">
                  <span className="font-mono w-6 text-center mr-2">
                    #{player.number}
                  </span>
                  <span>{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && isReferee && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`px-2 ${selectedPlayer?.yellowCard ? "bg-yellow-500/20 text-yellow-400" : ""}`}
                        onClick={() => onYellowCard(player.id)}
                        disabled={disabled}
                      >
                        🟨
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`px-2 ${selectedPlayer?.redCard ? "bg-red-500/20 text-red-400" : ""}`}
                        onClick={() => onRedCard(player.id)}
                        disabled={disabled}
                      >
                        🟥
                      </Button>
                    </>
                  )}
                  {(isTeamManager || isReferee) && (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onTogglePlayer(player)}
                      disabled={disabled}
                    >
                      {isSelected ? "Verwijderen" : "Toevoegen"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {players.length === 0 && (
            <p className="text-center py-4 text-muted-foreground">
              Geen spelers beschikbaar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchTab;
