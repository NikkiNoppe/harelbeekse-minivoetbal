import React, { useEffect, useMemo, useState } from 'react';
import { Archive, AlertCircle } from 'lucide-react';
import { useArchives } from '@/hooks/useArchives';
import SeasonSelector from './SeasonSelector';
import StandingsArchiveCard from './StandingsArchiveCard';
import CupWinnerCard from './CupWinnerCard';
import CupArchiveCard from './CupArchiveCard';
import PlayoffArchiveCard from './PlayoffArchiveCard';
import { PageHeader, PublicPage, PUBLIC_CARD_CLASS } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Standaard archief-tab — volledig seizoen met eindstanden */
const DEFAULT_ARCHIVE_SEASON = '2025-2026';

const ArchiefPage: React.FC = () => {
  const { data: archives, isLoading, isError, refetch, isFetched } = useArchives();
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
    [archives, selected],
  );

  if (isLoading) {
    return (
      <PublicPage>
        <PageHeader
          title="Archief"
        icon={Archive}
          subtitle="Eindklassementen, playoffs en bekerwinnaars per seizoen."
        />
        <Skeleton className="h-10 w-full max-w-xs" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </PublicPage>
    );
  }

  if (isError) {
    return (
      <PublicPage>
        <PageHeader
          title="Archief"
        icon={Archive}
          subtitle="Eindklassementen, playoffs en bekerwinnaars per seizoen."
        />
        <Card className={PUBLIC_CARD_CLASS} role="alert">
          <CardContent className="py-8 text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Archief kon niet worden geladen</p>
              <p className="text-sm text-muted-foreground mt-1">
                Probeer het opnieuw. Als het probleem blijft, neem contact op met de organisatie.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void refetch()}
              className="min-h-[44px]"
            >
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <PageHeader
        title="Archief"
        icon={Archive}
        subtitle="Eindklassementen, playoffs en bekerwinnaars per seizoen."
      />

      {isFetched && seasons.length === 0 ? (
        <Card className={PUBLIC_CARD_CLASS}>
          <CardContent className="py-12 text-center">
            <Archive className="w-10 h-10 mx-auto text-muted-foreground mb-3" aria-hidden />
            <p className="font-medium text-foreground">Nog geen gearchiveerde seizoenen</p>
            <p className="text-sm text-muted-foreground mt-1">
              Een beheerder kan het huidige seizoen archiveren via de competitie-, playoff- en bekerbeheerpagina.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SeasonSelector seasons={seasons} selected={selected} onSelect={setSelected} />
          <div className="space-y-4 sm:space-y-6">
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
    </PublicPage>
  );
};

export default ArchiefPage;
