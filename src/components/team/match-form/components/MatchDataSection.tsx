
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchFormData } from "../types";

interface MatchDataSectionProps {
  match: MatchFormData;
  homeScore: string;
  awayScore: string;
  selectedReferee: string;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
  onRefereeChange: (value: string) => void;
  canEdit: boolean;
  canEditMatchData: boolean;
}

const MOCK_REFEREES = [
  { id: 1, name: "Jan Janssen" },
  { id: 2, name: "Marie Pieters" },
  { id: 3, name: "Tom Van Der Berg" },
  { id: 4, name: "Lisa Vermeulen" }
];

export const MatchDataSection: React.FC<MatchDataSectionProps> = ({
  match,
  homeScore,
  awayScore,
  selectedReferee,
  onHomeScoreChange,
  onAwayScoreChange,
  onRefereeChange,
  canEdit,
  canEditMatchData
}) => {
  return (
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
              onChange={(e) => onHomeScoreChange(e.target.value)}
              disabled={!canEdit || !canEditMatchData}
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
              onChange={(e) => onAwayScoreChange(e.target.value)}
              disabled={!canEdit || !canEditMatchData}
              className="text-center text-lg font-bold"
            />
          </div>
        </div>

        {/* Referee Selection */}
        <div className="space-y-2">
          <Label htmlFor="referee">Scheidsrechter</Label>
          <Select
            value={selectedReferee}
            onValueChange={onRefereeChange}
            disabled={!canEdit || !canEditMatchData}
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
  );
};
