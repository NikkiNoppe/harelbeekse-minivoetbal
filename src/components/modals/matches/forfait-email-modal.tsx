import React, { useState, useMemo } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_RECIPIENTS = [
  "noppe.nikki@icloud.com",
  "nikkinoppe@hotmail.com",
];

export interface ForfaitEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  const recipients = DEFAULT_RECIPIENTS;
  const selectedEmails = useMemo(
    () => recipients.filter((e) => selected[e]),
    [selected, recipients]
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
          <Label className="text-sm font-medium">Selecteer ontvangers</Label>
          <div className="mt-2 space-y-2 rounded-md border p-3">
            {recipients.map((email) => (
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
      </div>
    </AppModal>
  );
};
