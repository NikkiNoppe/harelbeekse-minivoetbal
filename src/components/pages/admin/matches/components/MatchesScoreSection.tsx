import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MatchesScoreSectionProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: string;
  awayScore: string;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
  disabled: boolean;
}

export const MatchesScoreSection: React.FC<MatchesScoreSectionProps> = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  onHomeScoreChange,
  onAwayScoreChange,
  disabled
}) => {
  // Validation: check if scores are valid numbers
  const isValidScore = (score: string) => {
    if (!score || score === "") return false;
    const num = parseInt(score);
    return !isNaN(num) && num >= 0 && num <= 99;
  };

  const homeScoreValid = useMemo(() => isValidScore(homeScore), [homeScore]);
  const awayScoreValid = useMemo(() => isValidScore(awayScore), [awayScore]);
  const bothScoresValid = homeScoreValid && awayScoreValid;

  // Format score for display (show "-" if empty)
  const displayHomeScore = homeScore || "";
  const displayAwayScore = awayScore || "";

  return (
    <div className="space-y-4 pb-2">
      {/* Section Title */}
      <div className="text-center">
        <h3 className="text-xl font-bold" style={{ color: 'var(--primary)', paddingTop: '8px', paddingBottom: '8px' }}>
          Score
        </h3>
      </div>

      {/* Score Inputs Container */}
      <div className="relative">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-end">
          {/* Home Team Score */}
          <div className="space-y-2">
            <Label 
              htmlFor="home-score" 
              className="text-sm font-semibold text-center block"
              style={{ color: 'var(--accent)' }}
            >
              {homeTeamName}
            </Label>
            <div className="relative">
              <Input
                id="home-score"
                type="number"
                min="0"
                max="99"
                value={displayHomeScore}
                onChange={(e) => onHomeScoreChange(e.target.value)}
                disabled={disabled}
                className={cn(
                  "input-login-style text-center text-3xl font-bold h-16 md:h-20",
                  "border-2 transition-all",
                  homeScoreValid 
                    ? "border-[var(--accent)] bg-[var(--color-50)]" 
                    : "border-[var(--color-300)]",
                  "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                )}
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  padding: '1rem'
                }}
                aria-label={`Score voor ${homeTeamName}`}
              />
            </div>
          </div>

          {/* Score Separator */}
          <div className="flex items-center justify-center pb-2">
            <span 
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--accent)' }}
              aria-label="tegen"
            >
              -
            </span>
          </div>

          {/* Away Team Score */}
          <div className="space-y-2">
            <Label 
              htmlFor="away-score" 
              className="text-sm font-semibold text-center block"
              style={{ color: 'var(--accent)' }}
            >
              {awayTeamName}
            </Label>
            <div className="relative">
              <Input
                id="away-score"
                type="number"
                min="0"
                max="99"
                value={displayAwayScore}
                onChange={(e) => onAwayScoreChange(e.target.value)}
                disabled={disabled}
                className={cn(
                  "input-login-style text-center text-3xl font-bold h-16 md:h-20",
                  "border-2 transition-all",
                  awayScoreValid 
                    ? "border-[var(--accent)] bg-[var(--color-50)]" 
                    : "border-[var(--color-300)]",
                  "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                )}
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  padding: '1rem'
                }}
                aria-label={`Score voor ${awayTeamName}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MatchesScoreSection);

