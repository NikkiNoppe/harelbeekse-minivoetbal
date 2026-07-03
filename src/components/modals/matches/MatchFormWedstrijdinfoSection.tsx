import React from "react";
import { Loader2 } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlinePlayerRetry } from "@/components/modals";
import { MatchFormSectionCard } from "@/components/modals/matches/MatchFormSectionCard";
import type { Referee } from "@/services/core";

const fieldLabelClass = "text-xs font-medium text-[var(--color-700)]";
const fieldInputClass = "input-login-style h-9 min-h-[44px] text-sm";

interface MatchFormWedstrijdinfoSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  time: string;
  location: string;
  matchday: string;
  onFieldChange: (field: "date" | "time" | "location" | "matchday", value: string) => void;
  isAdmin: boolean;
  isTeamManager: boolean;
  canEdit: boolean;
  refereeSelectValue: string;
  selectedReferee: string;
  onRefereeChange: (value: string) => void;
  loadingReferees: boolean;
  referees: Referee[];
  refereesError: Error | null;
  onRefetchReferees: () => Promise<unknown>;
  selectedRefereeExists: boolean;
}

export function MatchFormWedstrijdinfoSection({
  open,
  onOpenChange,
  date,
  time,
  location,
  matchday,
  onFieldChange,
  isAdmin,
  isTeamManager,
  canEdit,
  refereeSelectValue,
  selectedReferee,
  onRefereeChange,
  loadingReferees,
  referees,
  refereesError,
  onRefetchReferees,
  selectedRefereeExists,
}: MatchFormWedstrijdinfoSectionProps) {
  return (
    <MatchFormSectionCard open={open} onOpenChange={onOpenChange} title="Wedstrijdinfo" compact>
      <CardContent className="space-y-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="match-date" className={fieldLabelClass}>
              Datum
            </Label>
            <Input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => onFieldChange("date", e.target.value)}
              disabled={!isAdmin}
              className={fieldInputClass}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-time" className={fieldLabelClass}>
              Tijd
            </Label>
            <Input
              id="match-time"
              type="time"
              value={time}
              onChange={(e) => onFieldChange("time", e.target.value)}
              disabled={!isAdmin}
              className={fieldInputClass}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-matchday" className={fieldLabelClass}>
              Speeldag
            </Label>
            <Input
              id="match-matchday"
              value={matchday}
              onChange={(e) => onFieldChange("matchday", e.target.value)}
              disabled={!isAdmin}
              placeholder="Speeldag"
              className={fieldInputClass}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="match-referee" className={fieldLabelClass}>
              Scheidsrechter
            </Label>
            <Select
              value={refereeSelectValue}
              onValueChange={(v) => onRefereeChange(v === "__none__" ? "" : v)}
              disabled={isTeamManager || !canEdit || loadingReferees}
            >
              <SelectTrigger
                id="match-referee"
                className="dropdown-login-style h-9 min-h-[44px] w-full text-sm"
              >
                <SelectValue
                  placeholder={
                    loadingReferees
                      ? "Laden…"
                      : selectedReferee || "Selecteer scheidsrechter"
                  }
                />
                {loadingReferees && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
                )}
              </SelectTrigger>
              <SelectContent
                className="dropdown-content-login-style z-modal bg-card"
                style={{ backgroundColor: "white" }}
              >
                {loadingReferees ? (
                  <SelectItem
                    value="loading"
                    disabled
                    className="dropdown-item-login-style text-center"
                    aria-busy="true"
                  >
                    <div className="flex items-center justify-center gap-2 py-1">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm">Laden…</span>
                    </div>
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="__none__" className="dropdown-item-login-style text-muted-foreground">
                      Geen scheidsrechter
                    </SelectItem>
                    {selectedReferee && !selectedRefereeExists && (
                      <SelectItem value={selectedReferee} className="dropdown-item-login-style opacity-75">
                        {selectedReferee}
                      </SelectItem>
                    )}
                    {referees.length > 0 ? (
                      referees.map((referee) => (
                        <SelectItem
                          key={referee.user_id}
                          value={referee.username}
                          className="dropdown-item-login-style"
                        >
                          {referee.username}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value="no-referees"
                        disabled
                        className="dropdown-item-login-style text-center text-muted-foreground"
                      >
                        Geen scheidsrechters beschikbaar
                      </SelectItem>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
            {!loadingReferees && referees.length === 0 && !selectedReferee && (
              refereesError ? (
                <InlinePlayerRetry
                  onRetry={onRefetchReferees}
                  isLoading={loadingReferees}
                  error={refereesError}
                  itemCount={referees.length}
                  emptyMessage="Geen scheidsrechters gevonden"
                  className="mt-1"
                />
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">Nog geen scheidsrechter toegewezen</p>
              )
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="match-location" className={fieldLabelClass}>
            Locatie
          </Label>
          <Input
            id="match-location"
            value={location}
            onChange={(e) => onFieldChange("location", e.target.value)}
            disabled={!isAdmin}
            placeholder="Wedstrijdlocatie"
            className={fieldInputClass}
          />
        </div>
      </CardContent>
    </MatchFormSectionCard>
  );
}
