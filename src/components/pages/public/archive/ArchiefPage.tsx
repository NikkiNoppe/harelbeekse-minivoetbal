import React, { useEffect, useMemo, useState } from "react";
import { Archive, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useArchives } from "@/hooks/useArchives";
import {
  archiveHasCup,
  archiveHasPlayoff,
  archiveHasStandings,
  parseSeasonLabelStartYear,
} from "@/lib/archiveManualUtils";
import type { SeasonArchive } from "@/services/archiveService";
import SeasonSelector from "./SeasonSelector";
import SeasonArchiveLayout from "./SeasonArchiveLayout";
import { PageHeader, PublicPage, PUBLIC_CARD_CLASS } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function archiveHasContent(entry: SeasonArchive): boolean {
  return (
    archiveHasStandings(entry.competition_standings) ||
    archiveHasCup(entry.cup_winner) ||
    archiveHasPlayoff(entry.playoff)
  );
}

function sortSeasonLabelsDesc(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const ya = parseSeasonLabelStartYear(a) ?? 0;
    const yb = parseSeasonLabelStartYear(b) ?? 0;
    return yb - ya;
  });
}

const ArchiefPage: React.FC = () => {
  const { data: archives, isLoading, isError, refetch, isFetched } = useArchives();
  const [searchParams, setSearchParams] = useSearchParams();
  const seasonFromUrl = searchParams.get("season");
  const [selected, setSelected] = useState<string | null>(null);

  const seasons = useMemo(() => {
    const labels = (archives || [])
      .filter(archiveHasContent)
      .map((a) => a.season_label);
    return sortSeasonLabelsDesc(Array.from(new Set(labels)));
  }, [archives]);

  useEffect(() => {
    if (seasons.length === 0) {
      if (selected !== null) setSelected(null);
      return;
    }

    if (seasonFromUrl && seasons.includes(seasonFromUrl)) {
      if (selected !== seasonFromUrl) setSelected(seasonFromUrl);
      return;
    }

    if (selected && seasons.includes(selected)) return;

    setSelected(seasons[0]);
  }, [seasons, selected, seasonFromUrl]);

  const selectSeason = (label: string) => {
    setSelected(label);
    const next = new URLSearchParams(searchParams);
    next.set("season", label);
    setSearchParams(next, { replace: true });
  };

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
              Een beheerder vult klassement, beker of play-offs aan via Instellingen → Historisch
              archief, of via seizoensafsluiting.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SeasonSelector seasons={seasons} selected={selected} onSelect={selectSeason} />
          <SeasonArchiveLayout archive={active} />
        </>
      )}
    </PublicPage>
  );
};

export default ArchiefPage;
