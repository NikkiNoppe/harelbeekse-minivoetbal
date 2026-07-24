import React, { useEffect, useMemo, useState } from "react";
import { Archive, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useSeasonDataScope } from "@/hooks/useSeasonDataScope";
import {
  useArchives,
  useArchiveCompetition,
  useArchiveCup,
  useArchivePlayoff,
  useDeleteArchive,
} from "@/hooks/useArchives";
import {
  deriveSeasonLabel,
  type ArchivedCupWinner,
  type ArchivedPlayoff,
  type ArchivedPlayoffRanking,
  type ArchivedStanding,
  type SeasonArchive,
} from "@/services/archiveService";
import {
  archiveHasCup,
  archiveHasPlayoff,
  archiveHasStandings,
  buildHistoricalSeasonLabels,
  createEmptyStandingRow,
  flattenDivisionStandings,
  groupStandingsByDivision,
  isValidSeasonLabel,
  MAX_HISTORICAL_SEASONS,
  mergeSeasonLabelOptions,
  parseSeasonLabelStartYear,
  validateArchivedStandings,
} from "@/lib/archiveManualUtils";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS, SectionIcon } from "@/components/layout";

type DivisionDraft = {
  name: string;
  rows: Array<{ position: number; team_name: string; points: number }>;
};

function standingToDraft(s: ArchivedStanding) {
  return {
    position: s.position,
    team_name: s.team_name,
    points: s.points,
  };
}

function draftToStanding(
  row: { position: number; team_name: string; points: number },
  division: string | null,
): ArchivedStanding {
  return {
    ...createEmptyStandingRow(row.position, division),
    team_name: row.team_name.trim(),
    points: Number(row.points) || 0,
  };
}

function emptyDivision(name = ""): DivisionDraft {
  return {
    name,
    rows: [
      { position: 1, team_name: "", points: 0 },
      { position: 2, team_name: "", points: 0 },
      { position: 3, team_name: "", points: 0 },
    ],
  };
}

function emptyRankingRow(position: number): ArchivedPlayoffRanking {
  return { position, team_name: "", total_points: 0 };
}

function archiveHasAnyContent(entry: SeasonArchive): boolean {
  return (
    archiveHasStandings(entry.competition_standings) ||
    archiveHasCup(entry.cup_winner) ||
    archiveHasPlayoff(entry.playoff)
  );
}

function SectionBadges({ entry }: { entry: SeasonArchive | null }) {
  if (!entry) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        variant="outline"
        className={
          archiveHasStandings(entry.competition_standings)
            ? "border-primary/40 bg-primary/5 text-primary"
            : "text-muted-foreground"
        }
      >
        Klassement
      </Badge>
      <Badge
        variant="outline"
        className={
          archiveHasCup(entry.cup_winner)
            ? "border-primary/40 bg-primary/5 text-primary"
            : "text-muted-foreground"
        }
      >
        Beker
      </Badge>
      <Badge
        variant="outline"
        className={
          archiveHasPlayoff(entry.playoff)
            ? "border-primary/40 bg-primary/5 text-primary"
            : "text-muted-foreground"
        }
      >
        Play-offs
      </Badge>
    </div>
  );
}

const ManualArchiveSettings: React.FC = () => {
  const { toast } = useToast();
  const { getSeasonData } = useSeasonDataScope();
  const { data: archives, isLoading } = useArchives();
  const archiveCompetition = useArchiveCompetition();
  const archiveCup = useArchiveCup();
  const archivePlayoff = useArchivePlayoff();
  const deleteArchive = useDeleteArchive();

  const [baseLabel, setBaseLabel] = useState("2025-2026");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SeasonArchive | null>(null);
  const [filledListOpen, setFilledListOpen] = useState(false);

  const [includeStandings, setIncludeStandings] = useState(true);
  const [includeCup, setIncludeCup] = useState(false);
  const [includePlayoff, setIncludePlayoff] = useState(false);

  const [divisions, setDivisions] = useState<DivisionDraft[]>([emptyDivision()]);
  const [cupWinner, setCupWinner] = useState("");
  const [cupRunnerUp, setCupRunnerUp] = useState("");
  const [cupHomeScore, setCupHomeScore] = useState("");
  const [cupAwayScore, setCupAwayScore] = useState("");
  const [cupDate, setCupDate] = useState("");
  const [po1, setPo1] = useState<ArchivedPlayoffRanking[]>([
    emptyRankingRow(1),
    emptyRankingRow(2),
  ]);
  const [po2, setPo2] = useState<ArchivedPlayoffRanking[]>([
    emptyRankingRow(1),
    emptyRankingRow(2),
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const season = await getSeasonData();
        const label = deriveSeasonLabel(
          season.season_start_date,
          season.season_end_date,
        );
        setBaseLabel(label);
        setSelectedLabel((prev) => prev || label);
      } catch {
        setSelectedLabel((prev) => prev || "2025-2026");
      }
    })();
  }, [getSeasonData]);

  const seasonOptions = useMemo(() => {
    const suggested = buildHistoricalSeasonLabels(baseLabel, MAX_HISTORICAL_SEASONS);
    const existing = (archives ?? []).map((a) => a.season_label);
    return mergeSeasonLabelOptions(suggested, existing);
  }, [archives, baseLabel]);

  const filledArchives = useMemo(() => {
    return [...(archives ?? [])]
      .filter(archiveHasAnyContent)
      .sort((a, b) => {
        const ya = parseSeasonLabelStartYear(a.season_label) ?? 0;
        const yb = parseSeasonLabelStartYear(b.season_label) ?? 0;
        return yb - ya;
      });
  }, [archives]);

  const archiveByLabel = useMemo(() => {
    const map = new Map<string, SeasonArchive>();
    for (const a of archives ?? []) map.set(a.season_label, a);
    return map;
  }, [archives]);

  const activeArchive = useMemo(
    () => (archives ?? []).find((a) => a.season_label === selectedLabel) ?? null,
    [archives, selectedLabel],
  );

  useEffect(() => {
    if (!selectedLabel) return;
    const entry = (archives ?? []).find((a) => a.season_label === selectedLabel);

    if (entry?.competition_standings?.length) {
      const groups = groupStandingsByDivision(entry.competition_standings);
      setDivisions(
        groups.map((g) => ({
          name: g.division ?? "",
          rows: g.standings.map(standingToDraft),
        })),
      );
      setIncludeStandings(true);
    } else {
      setDivisions([emptyDivision()]);
      setIncludeStandings(true);
    }

    if (entry?.cup_winner?.winner) {
      setIncludeCup(true);
      setCupWinner(entry.cup_winner.winner);
      setCupRunnerUp(entry.cup_winner.runner_up ?? "");
      setCupHomeScore(
        entry.cup_winner.home_score != null ? String(entry.cup_winner.home_score) : "",
      );
      setCupAwayScore(
        entry.cup_winner.away_score != null ? String(entry.cup_winner.away_score) : "",
      );
      setCupDate(entry.cup_winner.match_date?.slice(0, 10) ?? "");
    } else {
      setIncludeCup(false);
      setCupWinner("");
      setCupRunnerUp("");
      setCupHomeScore("");
      setCupAwayScore("");
      setCupDate("");
    }

    if (
      (entry?.playoff?.top_ranking?.length ?? 0) > 0 ||
      (entry?.playoff?.bottom_ranking?.length ?? 0) > 0
    ) {
      setIncludePlayoff(true);
      setPo1(
        entry!.playoff!.top_ranking.length
          ? entry!.playoff!.top_ranking
          : [emptyRankingRow(1), emptyRankingRow(2)],
      );
      setPo2(
        entry!.playoff!.bottom_ranking.length
          ? entry!.playoff!.bottom_ranking
          : [emptyRankingRow(1), emptyRankingRow(2)],
      );
    } else {
      setIncludePlayoff(false);
      setPo1([emptyRankingRow(1), emptyRankingRow(2)]);
      setPo2([emptyRankingRow(1), emptyRankingRow(2)]);
    }
  }, [selectedLabel, archives]);

  const buildStandingsPayload = (): ArchivedStanding[] => {
    const groups = divisions.map((d) => ({
      division: d.name.trim() || null,
      standings: d.rows
        .filter((r) => r.team_name.trim())
        .map((r, idx) =>
          draftToStanding(
            {
              position: r.position || idx + 1,
              team_name: r.team_name,
              points: r.points,
            },
            d.name.trim() || null,
          ),
        ),
    }));
    return flattenDivisionStandings(groups);
  };

  const buildCupPayload = (): ArchivedCupWinner => {
    const hs = cupHomeScore === "" ? null : Number(cupHomeScore);
    const as = cupAwayScore === "" ? null : Number(cupAwayScore);
    return {
      winner: cupWinner.trim(),
      runner_up: cupRunnerUp.trim(),
      home_score: hs != null && Number.isFinite(hs) ? hs : null,
      away_score: as != null && Number.isFinite(as) ? as : null,
      match_date: cupDate.trim() || null,
      final: {
        label: "Bekerfinale",
        home_team: cupWinner.trim() || "Winnaar",
        away_team: cupRunnerUp.trim() || "Finalist",
        home_score: hs != null && Number.isFinite(hs) ? hs : null,
        away_score: as != null && Number.isFinite(as) ? as : null,
        winner: cupWinner.trim() || null,
      },
    };
  };

  const buildPlayoffPayload = (): ArchivedPlayoff => ({
    top_ranking: po1
      .filter((r) => r.team_name.trim())
      .map((r, i) => ({
        position: r.position || i + 1,
        team_name: r.team_name.trim(),
        total_points: Number(r.total_points) || 0,
      })),
    bottom_ranking: po2
      .filter((r) => r.team_name.trim())
      .map((r, i) => ({
        position: r.position || i + 1,
        team_name: r.team_name.trim(),
        total_points: Number(r.total_points) || 0,
      })),
  });

  const handleSave = async () => {
    const label = selectedLabel.trim();
    if (!isValidSeasonLabel(label)) {
      toast({
        title: "Ongeldig seizoenlabel",
        description: "Gebruik het formaat YYYY-YYYY (bv. 2024-2025).",
        variant: "destructive",
      });
      return;
    }

    if (!includeStandings && !includeCup && !includePlayoff) {
      toast({
        title: "Niets te bewaren",
        description: "Schakel minstens klassement, beker of play-offs in.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (includeStandings) {
        const standings = buildStandingsPayload();
        const err = validateArchivedStandings(standings);
        if (err) {
          toast({ title: "Klassement ongeldig", description: err, variant: "destructive" });
          return;
        }
        await archiveCompetition.mutateAsync({ label, standings });
      }

      if (includeCup) {
        if (!cupWinner.trim()) {
          toast({
            title: "Beker onvolledig",
            description: "Vul de bekerwinnaar in.",
            variant: "destructive",
          });
          return;
        }
        await archiveCup.mutateAsync({ label, cup: buildCupPayload() });
      }

      if (includePlayoff) {
        const playoff = buildPlayoffPayload();
        if (
          playoff.top_ranking.length === 0 &&
          playoff.bottom_ranking.length === 0
        ) {
          toast({
            title: "Play-offs onvolledig",
            description: "Voeg minstens één team toe aan PO1 of PO2.",
            variant: "destructive",
          });
          return;
        }
        await archivePlayoff.mutateAsync({ label, playoff });
      }

      toast({
        title: "Archief bewaard",
        description: `Seizoen ${label} staat nu op de publieke Archief-pagina.`,
        action: (
          <ToastAction
            altText="Bekijk archief"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const org = params.get("org");
              const q = new URLSearchParams();
              if (org) q.set("org", org);
              q.set("season", label);
              window.location.assign(`/archief?${q.toString()}`);
            }}
          >
            Bekijken
          </ToastAction>
        ),
      });
    } catch (e) {
      toast({
        title: "Opslaan mislukt",
        description: e instanceof Error ? e.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyCustomLabel = () => {
    const t = customLabel.trim();
    if (!isValidSeasonLabel(t)) {
      toast({
        title: "Ongeldig label",
        description: "Gebruik YYYY-YYYY.",
        variant: "destructive",
      });
      return;
    }
    setSelectedLabel(t);
    setCustomLabel("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const label = deleteTarget.season_label;
    try {
      await deleteArchive.mutateAsync(deleteTarget.id);
      toast({
        title: "Archief verwijderd",
        description: `Seizoen ${label} is van de Archief-pagina gehaald.`,
      });
      if (selectedLabel === label) {
        const next = filledArchives.find((a) => a.season_label !== label);
        setSelectedLabel(next?.season_label ?? baseLabel);
      }
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Verwijderen mislukt",
        description: e instanceof Error ? e.message : "Onbekende fout",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-md")}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-brand-dark">
          <SectionIcon icon={Archive} />
          Historisch archief aanvullen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Vul tot {MAX_HISTORICAL_SEASONS} voorgaande seizoenen manueel in voor de publieke
          Archief-pagina (klassement met optionele reeksen, beker, play-offs).
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-busy>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Archief laden…
          </div>
        ) : (
          <>
            <Collapsible
              open={filledListOpen}
              onOpenChange={setFilledListOpen}
              className="rounded-lg border border-primary/15 overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-[44px] items-center gap-2 px-3 py-2.5 text-left",
                    "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  )}
                  aria-expanded={filledListOpen}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      filledListOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-brand-dark">
                    Ingevulde seizoenen
                  </span>
                  <Badge variant="secondary" className="rounded-full shrink-0">
                    {filledArchives.length}
                  </Badge>
                  {!filledListOpen && filledArchives.length > 0 ? (
                    <span className="ml-auto truncate text-xs text-muted-foreground max-w-[50%] sm:max-w-none">
                      {filledArchives.map((a) => a.season_label).join(" · ")}
                    </span>
                  ) : null}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-primary/10">
                <div className="p-2 space-y-1.5">
                  {filledArchives.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-2">
                      Nog geen seizoenen met archiefdata. Kies hieronder een label om te
                      beginnen.
                    </p>
                  ) : (
                    <ul className="space-y-1" aria-label="Ingevulde archiefseizoenen">
                      {filledArchives.map((entry) => {
                        const active = entry.season_label === selectedLabel;
                        return (
                          <li key={entry.id}>
                            <div
                              className={cn(
                                "flex items-center gap-2 rounded-md border px-2 py-1.5",
                                active
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-transparent hover:bg-muted/40",
                              )}
                            >
                              <button
                                type="button"
                                className="min-h-[44px] min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() => {
                                  setSelectedLabel(entry.season_label);
                                  setFilledListOpen(false);
                                }}
                                aria-pressed={active}
                                aria-label={`Bewerk seizoen ${entry.season_label}`}
                              >
                                <span className="font-semibold text-brand-dark shrink-0 tabular-nums">
                                  {entry.season_label}
                                </span>
                                <SectionBadges entry={entry} />
                              </button>
                              <Button
                                type="button"
                                className="btn btn--icon btn--danger shrink-0"
                                aria-label={`Verwijder archief ${entry.season_label}`}
                                onClick={() => setDeleteTarget(entry)}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="archive-season">Seizoen bewerken</Label>
                  <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                    <SelectTrigger id="archive-season" className="min-h-[44px]">
                      <SelectValue placeholder="Kies seizoen" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasonOptions.map((label) => {
                        const entry = archiveByLabel.get(label);
                        const filled = entry ? archiveHasAnyContent(entry) : false;
                        return (
                          <SelectItem key={label} value={label}>
                            {label}
                            {filled ? " · ingevuld" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <SectionBadges entry={activeArchive} />
              </div>
              {activeArchive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] w-full sm:w-auto gap-2 text-destructive hover:text-destructive border-destructive/30"
                  aria-label={`Verwijder archiefseizoen ${activeArchive.season_label}`}
                  onClick={() => setDeleteTarget(activeArchive)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Verwijder seizoen {activeArchive.season_label}
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="archive-custom-label">Ander label (YYYY-YYYY)</Label>
                <Input
                  id="archive-custom-label"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="bv. 2018-2019"
                  className="min-h-[44px]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={applyCustomLabel}
              >
                Selecteren
              </Button>
            </div>

            {/* Klassement */}
            <div className="rounded-lg border border-primary/15 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                <Label htmlFor="include-standings" className="font-medium">
                  Klassement invullen
                </Label>
                <Switch
                  id="include-standings"
                  checked={includeStandings}
                  onCheckedChange={setIncludeStandings}
                />
              </div>
              {includeStandings ? (
                <div className="space-y-4">
                  {divisions.map((div, di) => (
                    <div
                      key={`div-${di}`}
                      className="space-y-2 rounded-md border border-dashed border-primary/20 p-2"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          aria-label={`Reeks ${di + 1} naam`}
                          placeholder="Reeksnaam (optioneel, bv. Eerste klasse)"
                          value={div.name}
                          onChange={(e) => {
                            const next = [...divisions];
                            next[di] = { ...div, name: e.target.value };
                            setDivisions(next);
                          }}
                          className="min-h-[44px]"
                        />
                        <Button
                          type="button"
                          variant="unstyled"
                          className="btn btn--danger min-h-[44px] gap-2"
                          aria-label={`Reeks ${di + 1} verwijderen`}
                          disabled={divisions.length <= 1}
                          onClick={() =>
                            setDivisions((prev) => prev.filter((_, i) => i !== di))
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Reeks weg
                        </Button>
                      </div>
                      {div.rows.map((row, ri) => (
                        <div
                          key={`row-${di}-${ri}`}
                          className="grid grid-cols-[4rem_1fr_4.5rem_auto] gap-2 items-center"
                        >
                          <Input
                            type="number"
                            min={1}
                            aria-label={`Positie ${ri + 1}`}
                            value={row.position}
                            onChange={(e) => {
                              const next = [...divisions];
                              const rows = [...div.rows];
                              rows[ri] = {
                                ...row,
                                position: Number(e.target.value) || 1,
                              };
                              next[di] = { ...div, rows };
                              setDivisions(next);
                            }}
                            className="min-h-[44px]"
                          />
                          <Input
                            aria-label={`Team ${ri + 1}`}
                            placeholder="Teamnaam"
                            value={row.team_name}
                            onChange={(e) => {
                              const next = [...divisions];
                              const rows = [...div.rows];
                              rows[ri] = { ...row, team_name: e.target.value };
                              next[di] = { ...div, rows };
                              setDivisions(next);
                            }}
                            className="min-h-[44px]"
                          />
                          <Input
                            type="number"
                            aria-label={`Punten ${ri + 1}`}
                            value={row.points}
                            onChange={(e) => {
                              const next = [...divisions];
                              const rows = [...div.rows];
                              rows[ri] = {
                                ...row,
                                points: Number(e.target.value) || 0,
                              };
                              next[di] = { ...div, rows };
                              setDivisions(next);
                            }}
                            className="min-h-[44px]"
                          />
                          <Button
                            type="button"
                            variant="unstyled"
                            className="btn btn--icon btn--danger"
                            aria-label={`Rij ${ri + 1} verwijderen`}
                            onClick={() => {
                              const next = [...divisions];
                              const remaining = div.rows.filter((_, i) => i !== ri);
                              next[di] = {
                                ...div,
                                rows:
                                  remaining.length > 0
                                    ? remaining
                                    : [{ position: 1, team_name: "", points: 0 }],
                              };
                              setDivisions(next);
                            }}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] gap-1"
                        onClick={() => {
                          const next = [...divisions];
                          next[di] = {
                            ...div,
                            rows: [
                              ...div.rows,
                              {
                                position: div.rows.length + 1,
                                team_name: "",
                                points: 0,
                              },
                            ],
                          };
                          setDivisions(next);
                        }}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                        Rij
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px] gap-1"
                    onClick={() =>
                      setDivisions((prev) => [
                        ...prev,
                        emptyDivision(
                          prev.length === 0 ? "Eerste klasse" : "Tweede klasse",
                        ),
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Reeks toevoegen
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Beker */}
            <div className="rounded-lg border border-primary/15 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                <Label htmlFor="include-cup" className="font-medium">
                  Beker invullen
                </Label>
                <Switch
                  id="include-cup"
                  checked={includeCup}
                  onCheckedChange={setIncludeCup}
                />
              </div>
              {includeCup ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cup-winner">Winnaar</Label>
                    <Input
                      id="cup-winner"
                      value={cupWinner}
                      onChange={(e) => setCupWinner(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cup-runner">Finalist</Label>
                    <Input
                      id="cup-runner"
                      value={cupRunnerUp}
                      onChange={(e) => setCupRunnerUp(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cup-hs">Score winnaar</Label>
                    <Input
                      id="cup-hs"
                      type="number"
                      value={cupHomeScore}
                      onChange={(e) => setCupHomeScore(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cup-as">Score finalist</Label>
                    <Input
                      id="cup-as"
                      type="number"
                      value={cupAwayScore}
                      onChange={(e) => setCupAwayScore(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="cup-date">Datum (optioneel)</Label>
                    <Input
                      id="cup-date"
                      type="date"
                      value={cupDate}
                      onChange={(e) => setCupDate(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Play-offs */}
            <div className="rounded-lg border border-primary/15 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                <Label htmlFor="include-playoff" className="font-medium">
                  Play-offs invullen
                </Label>
                <Switch
                  id="include-playoff"
                  checked={includePlayoff}
                  onCheckedChange={setIncludePlayoff}
                />
              </div>
              {includePlayoff ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["PO1 (bovenste helft)", po1, setPo1],
                      ["PO2 (onderste helft)", po2, setPo2],
                    ] as const
                  ).map(([title, rows, setRows]) => (
                    <div key={title} className="space-y-2">
                      <p className="text-sm font-medium text-brand-dark">{title}</p>
                      {rows.map((row, i) => (
                        <div
                          key={`${title}-${i}`}
                          className="grid grid-cols-[3.5rem_1fr_4rem] gap-2"
                        >
                          <Input
                            type="number"
                            min={1}
                            aria-label={`${title} positie ${i + 1}`}
                            value={row.position}
                            onChange={(e) => {
                              const next = [...rows];
                              next[i] = {
                                ...row,
                                position: Number(e.target.value) || 1,
                              };
                              setRows(next);
                            }}
                            className="min-h-[44px]"
                          />
                          <Input
                            aria-label={`${title} team ${i + 1}`}
                            placeholder="Team"
                            value={row.team_name}
                            onChange={(e) => {
                              const next = [...rows];
                              next[i] = { ...row, team_name: e.target.value };
                              setRows(next);
                            }}
                            className="min-h-[44px]"
                          />
                          <Input
                            type="number"
                            aria-label={`${title} punten ${i + 1}`}
                            value={row.total_points ?? 0}
                            onChange={(e) => {
                              const next = [...rows];
                              next[i] = {
                                ...row,
                                total_points: Number(e.target.value) || 0,
                              };
                              setRows(next);
                            }}
                            className="min-h-[44px]"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] gap-1"
                        onClick={() =>
                          setRows([
                            ...rows,
                            emptyRankingRow(rows.length + 1),
                          ])
                        }
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                        Rij
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Bestaande archiefvelden voor dit seizoen worden per sectie overschreven
                (merge). Soft-close van matches is niet nodig.
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              className="min-h-[44px] w-full sm:w-auto"
              disabled={saving || !selectedLabel}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                  Bewaren…
                </>
              ) : (
                "Archief bewaren"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>

      <AppAlertModal
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Archiefseizoen verwijderen?"
        description={
          <DestructiveConfirmDescription
            message={`Seizoen ${deleteTarget?.season_label ?? ""} verdwijnt van de publieke Archief-pagina. Dit kan niet ongedaan worden gemaakt.`}
          />
        }
        confirmAction={{
          label: deleteArchive.isPending ? "Verwijderen…" : "Verwijderen",
          onClick: () => void handleDeleteConfirm(),
          variant: "destructive",
          disabled: deleteArchive.isPending,
          loading: deleteArchive.isPending,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setDeleteTarget(null),
          variant: "secondary",
        }}
      />
    </>
  );
};

export default ManualArchiveSettings;
