
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Button } from "@shared/components/ui/button";
import { MatchFormData } from "../types";
import { toast } from "@shared/hooks/use-toast";
import { Lock, Unlock } from "lucide-react";
import { matchService } from "@shared/services/matchService";

interface AdminMatchDataSectionProps {
  match: MatchFormData;
  onMatchUpdate: (matchId: number, updates: Partial<MatchFormData>) => Promise<void>;
  canEdit: boolean;
  isSaving?: boolean;
  onLockToggle?: () => void;
}

export const AdminMatchDataSection: React.FC<AdminMatchDataSectionProps> = ({
  match,
  onMatchUpdate,
  canEdit,
  isSaving = false,
  onLockToggle
}) => {
  const [date, setDate] = useState(match.date);
  const [time, setTime] = useState(match.time);
  const [location, setLocation] = useState(match.location);
  const [matchday, setMatchday] = useState(match.matchday);
  
  const handleSave = async () => {
    try {
      const metadata = {
        matchId: match.matchId,
        date,
        time,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        location,
        matchday
      };
      
      await matchService.updateMatchMetadata(metadata);
      
      toast({
        description: "Match details updated successfully",
      });
    } catch (error) {
      console.error("Error updating match:", error);
      toast({
        description: "Failed to update match details",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center justify-between">
          Admin: Match Details
          {onLockToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLockToggle}
              className="flex items-center gap-2"
            >
              {match.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {match.isLocked ? "Unlock" : "Lock"} Match
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admin-date">Date</Label>
            <Input
              id="admin-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!canEdit || isSaving}
            />
          </div>
          <div>
            <Label htmlFor="admin-time">Time</Label>
            <Input
              id="admin-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!canEdit || isSaving}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="admin-location">Location</Label>
          <Input
            id="admin-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={!canEdit || isSaving}
          />
        </div>

        <div>
          <Label htmlFor="admin-matchday">Matchday</Label>
          <Input
            id="admin-matchday"
            value={matchday}
            onChange={(e) => setMatchday(e.target.value)}
            disabled={!canEdit || isSaving}
          />
        </div>

        <Button 
          onClick={handleSave}
          disabled={!canEdit || isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};
