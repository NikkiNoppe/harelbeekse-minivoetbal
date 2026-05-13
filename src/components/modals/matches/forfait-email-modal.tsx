import React, { useState, useMemo, useEffect } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, Loader2, ChevronDown, Copy, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_RECIPIENTS = [
  "noppe.nikki@icloud.com",
  "sandrine.vergote@harelbeke.be",
];

interface TeamManager {
  email: string;
  username: string;
  teamName: string;
}

const addTeamRecipient = (
  list: TeamManager[],
  seen: Set<string>,
  recipient: { team_id: number; team_name?: string | null; email?: string | null; username?: string | null }
) => {
  const email = recipient.email?.trim();
  if (!email) return;

  const key = `${email.toLowerCase()}|${recipient.team_id}`;
  if (seen.has(key)) return;

  seen.add(key);
  list.push({
    email,
    username: recipient.username?.trim() || "Team contact",
    teamName: recipient.team_name ?? "",
  });
};

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
  const [waOpen, setWaOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const teamIds = [homeTeamId, awayTeamId].filter(
      (id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0
    );
    const teamNames = [homeTeamName, awayTeamName].map((name) => name.trim()).filter(Boolean);
    if (teamIds.length === 0 && teamNames.length === 0) {
      setManagers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingManagers(true);
      const list: TeamManager[] = [];
      const seen = new Set<string>();
      try {
        if (teamIds.length > 0) {
          const { data, error } = await withUserContext(async () =>
            await (supabase as any).rpc("get_team_recipients", { p_team_ids: teamIds })
          );
          if (error) throw error;

          for (const row of (data ?? []) as Array<{
            team_id: number;
            team_name: string;
            email: string;
            username: string;
          }>) {
            addTeamRecipient(list, seen, row);
          }
        }
      } catch (e) {
        console.warn("[forfait-email] RPC recipients unavailable, falling back to teams.contact_email", e);
      }

      try {
        let contactRows: Array<{
          team_id: number;
          team_name: string;
          contact_person: string | null;
          contact_email: string | null;
        }> = [];

        if (teamIds.length > 0) {
          const { data, error } = await supabase
            .from("teams")
            .select("team_id, team_name, contact_person, contact_email")
            .in("team_id", teamIds);
          if (error) throw error;
          contactRows = data ?? [];
        }

        if (contactRows.length === 0 && teamNames.length > 0) {
          const { data, error } = await supabase
            .from("teams")
            .select("team_id, team_name, contact_person, contact_email")
            .in("team_name", teamNames);
          if (error) throw error;
          contactRows = data ?? [];
        }

        contactRows.forEach((row) =>
          addTeamRecipient(list, seen, {
            team_id: row.team_id,
            team_name: row.team_name,
            email: row.contact_email,
            username: row.contact_person || "Team contact",
          })
        );

        if (!cancelled) setManagers(list);
      } catch (e) {
        console.error("[forfait-email] load team contacts failed", e);
        if (!cancelled) setManagers(list);
      } finally {
        if (!cancelled) setLoadingManagers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, homeTeamId, awayTeamId, homeTeamName, awayTeamName]);

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
      if (error || (data as any)?.error) {
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

        {(() => {
          const dateStr = matchDate
            ? new Date(matchDate + "T00:00:00").toLocaleDateString("nl-BE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : null;
          const lines: string[] = [
            `⚠️ *Forfait* — ${homeTeamName} - ${awayTeamName}`,
            "",
            `Het team *${forfaitTeamName}* heeft forfait gegeven. De wedstrijd gaat *niet* door.`,
          ];
          if (dateStr) lines.push("", `📅 ${dateStr}${matchTime ? ` om ${matchTime}` : ""}`);
          if (location) lines.push(`📍 ${location}`);
          lines.push("", "Gelieve hier rekening mee te houden.", "", "— Harelbeekse Minivoetbal");
          const message = lines.join("\n");
          const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

          const copyText = async () => {
            try {
              await navigator.clipboard.writeText(message);
              toast({ title: "Gekopieerd", description: "Bericht staat in je klembord." });
            } catch {
              toast({ title: "Kopiëren mislukt", variant: "destructive" });
            }
          };

          return (
            <Collapsible
              open={waOpen}
              onOpenChange={setWaOpen}
              className="rounded-xl border border-border bg-card shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">WhatsApp / copy bericht</div>
                    <div className="text-xs text-muted-foreground">
                      Kant-en-klare tekst om door te sturen via WhatsApp.
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      waOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 border-t border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-2"
                      onClick={copyText}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopieer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1.5 bg-[#25D366] px-2 text-white hover:bg-[#1ebe57]"
                      onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Open WhatsApp
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={message}
                    className="min-h-[140px] w-full resize-y rounded-md border border-border bg-background p-2 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })()}
      </div>
    </AppModal>
  );
};
