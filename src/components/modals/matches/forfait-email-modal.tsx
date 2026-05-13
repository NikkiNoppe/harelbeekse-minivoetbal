import React, { useState, useMemo, useEffect } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_RECIPIENTS = [
  "noppe.nikki@icloud.com",
  "nikkinoppe@hotmail.com",
];

interface TeamManager {
  email: string;
  username: string;
  teamName: string;
}

export interface ForfaitEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeamName: string;
  awayTeamName: string;
  forfaitTeamName: string;
  matchDate?: string | null;
  matchTime?: string | null;
  location?: string | null;
}

export const ForfaitEmailModal: React.FC<ForfaitEmailModalProps> = ({
  open,
  onOpenChange,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  forfaitTeamName,
  matchDate,
  matchTime,
  location,
}) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [managers, setManagers] = useState<TeamManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  useEffect(() => {
    if (!open) return;
    const teamIds = [homeTeamId, awayTeamId].filter((id): id is number => typeof id === "number");
    if (teamIds.length === 0) {
      setManagers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingManagers(true);
      try {
        const { data: tu, error: tuErr } = await supabase
          .from("team_users")
          .select("user_id, team_id")
          .in("team_id", teamIds);
        if (tuErr) throw tuErr;
        const userIds = Array.from(new Set((tu ?? []).map((r) => r.user_id).filter(Boolean))) as number[];
        if (userIds.length === 0) {
          if (!cancelled) setManagers([]);
          return;
        }
        const [{ data: users, error: uErr }, { data: teams, error: tErr }] = await Promise.all([
          supabase.from("users").select("user_id, username, email").in("user_id", userIds),
          supabase.from("teams").select("team_id, team_name").in("team_id", teamIds),
        ]);
        if (uErr) throw uErr;
        if (tErr) throw tErr;
        const teamMap = new Map((teams ?? []).map((t) => [t.team_id, t.team_name]));
        const userMap = new Map((users ?? []).map((u) => [u.user_id, u]));
        const list: TeamManager[] = [];
        const seen = new Set<string>();
        for (const row of tu ?? []) {
          const u = userMap.get(row.user_id as number);
          if (!u || !u.email) continue;
          const key = `${u.email}|${row.team_id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          list.push({
            email: u.email,
            username: u.username,
            teamName: teamMap.get(row.team_id as number) ?? "",
          });
        }
        if (!cancelled) setManagers(list);
      } catch (e) {
        console.error("[forfait-email] load managers failed", e);
        if (!cancelled) setManagers([]);
      } finally {
        if (!cancelled) setLoadingManagers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, homeTeamId, awayTeamId]);

  const allRecipients = useMemo(() => {
    const set = new Set<string>(DEFAULT_RECIPIENTS);
    managers.forEach((m) => set.add(m.email));
    return Array.from(set);
  }, [managers]);

  const selectedEmails = useMemo(
    () => allRecipients.filter((e) => selected[e]),
    [selected, allRecipients]
  );

  const toggle = (email: string) =>
    setSelected((prev) => ({ ...prev, [email]: !prev[email] }));

  const handleSend = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "Geen ontvangers geselecteerd",
        description: "Selecteer minstens één email adres.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-forfait-notification", {
        body: {
          recipients: selectedEmails,
          homeTeamName,
          awayTeamName,
          forfaitTeamName,
          matchDate,
          matchTime,
          location,
        },
      });
      if (error || (data && (data as any).error)) {
        throw new Error(error?.message || (data as any)?.error || "Versturen mislukt");
      }
      toast({
        title: "Email verzonden",
        description: `Verzonden naar ${selectedEmails.length} ontvanger(s).`,
      });
      setSelected({});
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Fout bij verzenden",
        description: e instanceof Error ? e.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const managersByEmail = useMemo(() => {
    const map = new Map<string, TeamManager[]>();
    managers.forEach((m) => {
      const arr = map.get(m.email) ?? [];
      arr.push(m);
      map.set(m.email, arr);
    });
    return map;
  }, [managers]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Forfait melding versturen"
      size="md"
      primaryAction={{
        label: sending ? "Versturen..." : `Verstuur (${selectedEmails.length})`,
        onClick: handleSend,
        loading: sending,
        disabled: sending || selectedEmails.length === 0,
        variant: "destructive",
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: () => onOpenChange(false),
        variant: "secondary",
        disabled: sending,
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Belangrijke beslissing</p>
            <p className="mt-1">
              Je staat op het punt een email te versturen waarin gemeld wordt dat de
              wedstrijd <strong>{homeTeamName} - {awayTeamName}</strong> niet meer doorgaat
              omdat <strong>{forfaitTeamName}</strong> forfait heeft gegeven. Controleer de
              ontvangers zorgvuldig.
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Standaard ontvangers</Label>
          <div className="mt-2 space-y-1 rounded-md border p-3">
            {DEFAULT_RECIPIENTS.map((email) => (
              <label
                key={email}
                className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-muted"
              >
                <Checkbox
                  checked={!!selected[email]}
                  onCheckedChange={() => toggle(email)}
                  disabled={sending}
                />
                <span className="text-sm">{email}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Teamverantwoordelijken</Label>
          <div className="mt-2 space-y-1 rounded-md border p-3">
            {loadingManagers ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Laden...
              </div>
            ) : managers.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">
                Geen teamverantwoordelijken gevonden voor deze teams.
              </p>
            ) : (
              Array.from(managersByEmail.entries()).map(([email, ms]) => (
                <label
                  key={email}
                  className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-muted"
                >
                  <Checkbox
                    checked={!!selected[email]}
                    onCheckedChange={() => toggle(email)}
                    disabled={sending}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{email}</span>
                    <span className="text-xs text-muted-foreground">
                      {ms.map((m) => `${m.username} (${m.teamName})`).join(", ")}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
};
