import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import type { ArchivedCupWinner } from '@/services/archiveService';

interface Props {
  cup: ArchivedCupWinner | null;
}

const CupWinnerCard: React.FC<Props> = ({ cup }) => {
  if (!cup) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-purple-800 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Beker</span>
          </div>
          <p className="text-sm text-muted-foreground">Geen bekerwinnaar gearchiveerd voor dit seizoen.</p>
        </CardContent>
      </Card>
    );
  }

  const scoreLine =
    cup.home_score !== null && cup.away_score !== null
      ? `${cup.home_score} - ${cup.away_score}`
      : null;

  return (
    <Card className="overflow-hidden border-amber-200">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto text-amber-500 mb-3 drop-shadow" />
          <div className="text-xs uppercase tracking-widest text-amber-700 font-semibold mb-1">
            Bekerwinnaar
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-900 leading-tight">
            {cup.winner}
          </h3>
          {scoreLine && (
            <div className="mt-4 inline-block bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-amber-200">
              <span className="text-sm font-bold text-amber-900">{scoreLine}</span>
              <span className="text-xs text-amber-700 ml-2">vs {cup.runner_up}</span>
            </div>
          )}
          {cup.match_date && (
            <div className="mt-3 text-xs text-amber-700">
              {new Date(cup.match_date).toLocaleDateString('nl-BE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CupWinnerCard;
