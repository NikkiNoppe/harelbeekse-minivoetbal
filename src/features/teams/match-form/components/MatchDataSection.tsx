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
    <Card className="border-2 shadow-lg" style={{ borderColor: "var(--purple-200)", background: "var(--purple-200)" }}>
      <CardHeader className="rounded-t-lg" style={{ background: "var(--main-color-dark)" }}>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          ⚽ Wedstrijdgegevens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Score Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="homeScore" className="font-semibold">{match.homeTeamName}</Label>
            <Input
              id="homeScore"
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => onHomeScoreChange(e.target.value)}
              disabled={!canEdit || !canEditMatchData}
              className="text-center text-lg font-bold border-2"
            />
          </div>
          
          <div className="flex justify-center items-center">
            <span className="text-3xl font-bold text-[var(--main-color-dark)]">-</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="awayScore" className="font-semibold">{match.awayTeamName}</Label>
            <Input
              id="awayScore"
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => onAwayScoreChange(e.target.value)}
              disabled={!canEdit || !canEditMatchData}
              className="text-center text-lg font-bold border-2"
            />
          </div>
        </div>

        {/* Referee Selection */}
        <div className="space-y-2">
          <Label htmlFor="referee" className="font-semibold">Scheidsrechter</Label>
          <Select
            value={selectedReferee}
            onValueChange={onRefereeChange}
            disabled={!canEdit || !canEditMatchData}
          >
            <SelectTrigger className="border-2 bg-[var(--purple-200)] text-[var(--main-color-dark)] focus:ring-2 focus:ring-[var(--main-color-dark)]">
              <SelectValue placeholder="Selecteer scheidsrechter" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--purple-200)] text-[var(--main-color-dark)] border-2 border-[var(--main-color-dark)] shadow-lg z-50">
              {MOCK_REFEREES.map((referee) => (
                <SelectItem
                  key={referee.id}
                  value={referee.name}
                  className="data-[highlighted]:bg-[var(--main-color-dark)] data-[highlighted]:text-white transition-all"
                >
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
