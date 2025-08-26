import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TeamSeasonalFairness, SeasonalFairnessMetrics } from "@/services/core/teamPreferencesService";
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FairnessPreviewProps {
  fairnessMetrics: SeasonalFairnessMetrics;
  teamFairness: TeamSeasonalFairness[];
}

export const FairnessPreview: React.FC<FairnessPreviewProps> = ({
  fairnessMetrics,
  teamFairness
}) => {
  const getFairnessIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getFairnessColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreIcon = (averageScore: number, overallAverage: number) => {
    const diff = averageScore - overallAverage;
    if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return diff > 0 ? 
      <TrendingUp className="h-3 w-3 text-green-500" /> : 
      <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  // Sort teams: problematic teams first, then by average score
  const sortedTeamFairness = [...teamFairness].sort((a, b) => {
    // Teams with deficits first
    if (a.fairnessDeficit > 0 && b.fairnessDeficit === 0) return -1;
    if (b.fairnessDeficit > 0 && a.fairnessDeficit === 0) return 1;
    
    // If both have deficits or both don't, sort by average score (ascending)
    return a.averageScore - b.averageScore;
  });

  return (
    <div className="space-y-4">
      {/* Overall Fairness Score */}
      <Card className={`border-2 ${getFairnessColor(fairnessMetrics.fairnessScore)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getFairnessIcon(fairnessMetrics.fairnessScore)}
            Seasonal Fairness Score
            <Badge variant="outline" className="ml-auto">
              {Math.round(fairnessMetrics.fairnessScore)}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={fairnessMetrics.fairnessScore} 
            className="h-2 mb-3"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Gemiddelde</div>
              <div className="font-semibold">{fairnessMetrics.overallAverage.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Spreiding (σ)</div>
              <div className="font-semibold">{fairnessMetrics.standardDeviation.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Min Score</div>
              <div className="font-semibold">{fairnessMetrics.minScore.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Score</div>
              <div className="font-semibold">{fairnessMetrics.maxScore.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Aanbevelingen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fairnessMetrics.recommendations.map((rec, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
              >
                <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Team Fairness Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTeamFairness.map((team) => (
              <div 
                key={team.teamId}
                className={`p-3 rounded-lg border ${
                  team.fairnessDeficit > 0 
                    ? 'bg-red-50 border-red-200' 
                    : team.averageScore < fairnessMetrics.overallAverage 
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold flex items-center gap-2">
                    {getScoreIcon(team.averageScore, fairnessMetrics.overallAverage)}
                    {team.teamName}
                  </div>
                  <div className="text-sm font-mono">
                    {team.averageScore.toFixed(2)} avg
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Wedstrijden: </span>
                    <span className="font-medium">{team.totalMatches}</span>
                  </div>
                  <div>
                    <span>Totaal Score: </span>
                    <span className="font-medium">{team.cumulativeScore.toFixed(1)}</span>
                  </div>
                  <div>
                    <span>Deficit: </span>
                    <span className={`font-medium ${team.fairnessDeficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {team.fairnessDeficit.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span>Status: </span>
                    <Badge 
                      variant={team.fairnessDeficit > 0 ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {team.fairnessDeficit > 0 ? "Boost Nodig" : "Goed"}
                    </Badge>
                  </div>
                </div>
                
                {team.fairnessDeficit > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    → Prioriteit voor betere timeslots in volgende planning
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};