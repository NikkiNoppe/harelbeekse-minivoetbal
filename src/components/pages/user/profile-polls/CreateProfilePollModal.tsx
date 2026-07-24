import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/modals/base/app-modal";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import type {
  CreateProfilePollPayload,
  ProfilePollTargetRole,
} from "@/services/profilePoll/profilePollService";

interface CreateProfilePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProfilePollPayload) => Promise<void>;
}

const ROLE_OPTIONS: { value: ProfilePollTargetRole; label: string }[] = [
  { value: "player_manager", label: "Teamverantwoordelijken" },
  { value: "referee", label: "Scheidsrechters" },
];

function defaultEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoEndDate(localDatetime: string): string {
  return new Date(localDatetime).toISOString();
}

export function CreateProfilePollModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProfilePollModalProps) {
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: "opt_1", label: "" },
    { id: "opt_2", label: "" },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [targetRoles, setTargetRoles] = useState<ProfilePollTargetRole[]>([
    "player_manager",
    "referee",
  ]);
  const [endDateLocal, setEndDateLocal] = useState(defaultEndDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setQuestion("");
      setOptions([
        { id: `opt_${Date.now()}_1`, label: "" },
        { id: `opt_${Date.now()}_2`, label: "" },
      ]);
      setAllowMultiple(false);
      setTargetRoles(["player_manager", "referee"]);
      setEndDateLocal(defaultEndDate());
      setError(null);
    }
  }, [isOpen]);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: `opt_${Date.now()}`, label: "" },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, label: string) => {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, label } : o)),
    );
  };

  const toggleRole = (role: ProfilePollTargetRole, checked: boolean) => {
    setTargetRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role),
    );
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmedQuestion = question.trim();
    const validOptions = options.filter((o) => o.label.trim());

    if (!trimmedQuestion) {
      setError("Vul een vraag in");
      return;
    }
    if (validOptions.length < 2) {
      setError("Vul minstens 2 opties in");
      return;
    }
    if (targetRoles.length === 0) {
      setError("Selecteer minstens één doelgroep");
      return;
    }
    if (new Date(endDateLocal) <= new Date()) {
      setError("Einddatum moet in de toekomst liggen");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || undefined,
        question: trimmedQuestion,
        options: validOptions.map((o) => ({ id: o.id, label: o.label.trim() })),
        allow_multiple: allowMultiple,
        target_roles: targetRoles,
        end_date: toIsoEndDate(endDateLocal),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon poll niet aanmaken");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Nieuwe profielpoll"
      size="lg"
      primaryAction={{
        label: "Lanceren",
        onClick: handleSubmit,
        loading: isSubmitting,
        disabled: isSubmitting,
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: onClose,
        variant: "secondary",
        disabled: isSubmitting,
      }}
    >
      <div className="space-y-4 py-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Poll voor teamverantwoordelijken en/of scheidsrechters
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="poll-title">Titel (optioneel)</Label>
          <Input
            id="poll-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Extra speelmoment"
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="poll-question">Vraag *</Label>
          <Textarea
            id="poll-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Bijv. Voorkeur voor extra speelmoment?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Opties * (min. 2)</Label>
          <div className="space-y-2">
            {options.map((opt, index) => (
              <div key={opt.id} className="flex gap-2">
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Optie ${index + 1}`}
                  className="min-h-[44px] flex-1"
                />
                <Button
                  type="button"
                  variant="unstyled"
                  className="btn btn--icon btn--danger shrink-0"
                  disabled={options.length <= 2}
                  onClick={() => removeOption(index)}
                  aria-label="Optie verwijderen"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-2" />
            Optie toevoegen
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 py-1 min-h-[44px]">
          <Label htmlFor="allow-multiple" className="cursor-pointer">
            Meerdere keuzes toestaan
          </Label>
          <Switch
            id="allow-multiple"
            checked={allowMultiple}
            onCheckedChange={setAllowMultiple}
          />
        </div>

        <div className="space-y-2">
          <Label>Doelgroep *</Label>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="flex items-center gap-3 min-h-[44px] cursor-pointer"
              >
                <Checkbox
                  checked={targetRoles.includes(role.value)}
                  onCheckedChange={(checked) =>
                    toggleRole(role.value, checked === true)
                  }
                />
                <span className="text-sm">{role.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="poll-end">Einddatum *</Label>
          <Input
            id="poll-end"
            type="datetime-local"
            value={endDateLocal}
            onChange={(e) => setEndDateLocal(e.target.value)}
            className="min-h-[44px]"
          />
        </div>
      </div>
    </AppModal>
  );
}
