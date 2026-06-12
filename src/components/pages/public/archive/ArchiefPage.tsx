import React, { useEffect, useMemo, useState } from 'react';
import { useArchives } from '@/hooks/useArchives';
import SeasonSelector from './SeasonSelector';
import StandingsArchiveCard from './StandingsArchiveCard';
import CupWinnerCard from './CupWinnerCard';
import CupArchiveCard from './CupArchiveCard';
import PlayoffArchiveCard from './PlayoffArchiveCard';
import { Archive, Loader2 } from 'lucide-react';

/** Standaard archief-tab — volledig seizoen met eindstanden */
const DEFAULT_ARCHIVE_SEASON = '2025-2026';

const ArchiefPage: React.FC = () => {
  const { data: archives, isLoading, isError, refetch } = useArchives();
  const [selected, setSelected] = useState<string | null>(null);

  const seasons = useMemo(() => {
    const set = new Set<string>();
    (archives || []).forEach((a) => set.add(a.season_label));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [archives]);

  useEffect(() => {
    if (!selected && seasons.length > 0) {
      setSelected(
        seasons.includes(DEFAULT_ARCHIVE_SEASON)
          ? DEFAULT_ARCHIVE_SEASON
          : seasons[0],
      );
    }
  }, [seasons, selected]);

  const active = useMemo(
    () => (archives || []).find((a) => a.season_label === selected) || null,
    [archives, selected]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-purple-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Archief laden...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-purple-100 space-y-3">
        <p className="text-purple-800 font-medium">Archief kon niet worden geladen</p>
        <p className="text-sm text-muted-foreground">
          Probeer het opnieuw. Als het probleem blijft, neem contact op met de organisatie.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="min-h-[44px] px-4 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Archive className="w-5 h-5 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900">Archief</h1>
          <p className="text-sm text-muted-foreground">
            Eindklassementen, playoffs en bekerwinnaars per seizoen.
          </p>
        </div>
      </div>

      {seasons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-purple-100">
          <Archive className="w-10 h-10 mx-auto text-purple-300 mb-3" />
          <p className="text-purple-800 font-medium">Nog geen gearchiveerde seizoenen</p>
          <p className="text-sm text-muted-foreground mt-1">
            Een beheerder kan het huidige seizoen archiveren via de competitie-, playoff- en bekerbeheerpagina.
          </p>
        </div>
      ) : (
        <>
          <SeasonSelector seasons={seasons} selected={selected} onSelect={setSelected} />
          <div className="space-y-6">
            <CupWinnerCard
              cup={active?.cup_winner ?? null}
              playoff={active?.playoff ?? null}
            />
            <CupArchiveCard cup={active?.cup_winner ?? null} />
            <PlayoffArchiveCard entry={active?.playoff ?? null} />
            <StandingsArchiveCard standings={active?.competition_standings ?? []} />
          </div>
        </>
      )}
    </div>
  );
};

export default ArchiefPage;
