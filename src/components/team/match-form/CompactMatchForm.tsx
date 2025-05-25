
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "./types";
import { updateMatchForm, lockMatchForm } from "./matchFormService";
import { Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompactMatchFormProps {
  match: MatchFormData;
  onComplete: () => void;
  isAdmin: boolean;
  isReferee: boolean;
}

// Mock referees data - replace with actual Supabase query later
const MOCK_REFEREES = [
  { id: 1, name: "Jan Janssen" },
  { id: 2, name: "Marie Pieters" },
  { id: 3, name: "Tom Van Der Berg" },
  { id: 4, name: "Lisa Vermeulen" }
];

// Mock players data
const MOCK_PLAYERS = {
  home: [
    { id: 1, name: "Speler 1", jerseyNumber: 1 },
    { id: 2, name: "Speler 2", jerseyNumber: 2 },
    { id: 3, name: "Speler 3", jerseyNumber: 3 },
    { id: 4, name: "Speler 4", jerseyNumber: 4 },
    { id: 5, name: "Speler 5", jerseyNumber: 5 },
    { id: 6, name: "Speler 6", jerseyNumber: 6 },
    { id: 7, name: "Speler 7", jerseyNumber: 7 },
    { id: 8, name: "Speler 8", jerseyNumber: 8 }
  ],
  away: [
    { id: 9, name: "Speler A", jerseyNumber: 1 },
    { id: 10, name: "Speler B", jerseyNumber: 2 },
    { id: 11, name: "Speler C", jerseyNumber: 3 },
    { id: 12, name: "Speler D", jerseyNumber: 4 },
    { id: 13, name: "Speler E", jerseyNumber: 5 },
    { id: 14, name: "Speler F", jerseyNumber: 6 },
    { id: 15, name: "Speler G", jerseyNumber: 7 },
    { id: 16, name: "Speler H", jerseyNumber: 8 }
  ]
};

const CompactMatchForm: React.FC<CompactMatchFormProps> = ({
  match,
  onComplete,
  isAdmin,
  isReferee
}) => {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [selectedReferee, setSelectedReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [playerCards, setPlayerCards] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;

  const handleCardChange = (playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  };

  const handleSubmit = async () => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Fout",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        referee: selectedReferee,
        refereeNotes,
        isCompleted: true
      };

      await updateMatchForm(updatedMatch);
      
      // If referee is submitting, lock the form
      if (isReferee && !match.isLocked) {
        await lockMatchForm(match.matchId);
        updatedMatch.isLocked = true;
      }
      
      toast({
        title: isReferee ? "Formulier vergrendeld" : "Opgeslagen",
        description: isReferee 
          ? "Het wedstrijdformulier is definitief afgesloten."
          : "De wijzigingen zijn opgeslagen."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary text-white">
                {match.uniqueNumber}
              </Badge>
              {match.isLocked && <Lock className="h-4 w-4 text-gray-500" />}
            </div>
            <div className="text-sm text-muted-foreground">
              {match.date} om {match.time} - {match.location}
              {match.matchday && ` | ${match.matchday}`}
            </div>
          </div>
          <CardTitle className="text-lg">
            {match.homeTeamName} vs {match.awayTeamName}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Score and Referee Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wedstrijdgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="homeScore">{match.homeTeamName}</Label>
              <Input
                id="homeScore"
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={!canEdit}
                className="text-center text-lg font-bold"
              />
            </div>
            
            <div className="flex justify-center items-center">
              <span className="text-2xl font-bold">-</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="awayScore">{match.awayTeamName}</Label>
              <Input
                id="awayScore"
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={!canEdit}
                className="text-center text-lg font-bold"
              />
            </div>
          </div>

          {/* Referee Selection */}
          <div className="space-y-2">
            <Label htmlFor="referee">Scheidsrechter</Label>
            <Select
              value={selectedReferee}
              onValueChange={setSelectedReferee}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer scheidsrechter" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_REFEREES.map((referee) => (
                  <SelectItem key={referee.id} value={referee.name}>
                    {referee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Players Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team Players */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{match.homeTeamName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_PLAYERS.home.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary w-6">{player.jerseyNumber}</span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                  {showRefereeFields && canEdit && (
                    <Select
                      value={playerCards[player.id] || "none"}
                      onValueChange={(value) => handleCardChange(player.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        <SelectItem value="yellow">Geel</SelectItem>
                        <SelectItem value="double_yellow">2x Geel</SelectItem>
                        <SelectItem value="red">Rood</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Away Team Players */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{match.awayTeamName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_PLAYERS.away.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary w-6">{player.jerseyNumber}</span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                  {showRefereeFields && canEdit && (
                    <Select
                      value={playerCards[player.id] || "none"}
                      onValueChange={(value) => handleCardChange(player.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        <SelectItem value="yellow">Geel</SelectItem>
                        <SelectItem value="double_yellow">2x Geel</SelectItem>
                        <SelectItem value="red">Rood</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referee Notes */}
      {showRefereeFields && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notities scheidsrechter</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={refereeNotes}
              onChange={(e) => setRefereeNotes(e.target.value)}
              disabled={!canEdit}
              placeholder="Bijzonderheden, opmerkingen..."
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canEdit}
          className="flex items-center gap-2 px-8"
        >
          <Save className="h-4 w-4" />
          {isReferee ? "Bevestigen & Vergrendelen" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
};

export default CompactMatchForm;
