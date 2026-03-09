import React, { useState, useEffect } from "react";
import { Palette, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useThemeColorsAdmin } from "@/hooks/useThemeColors";
import {
  generateThemeFromBase,
  applyThemeToCSS,
  DEFAULT_THEME,
  DEFAULT_SEMANTIC,
  type ThemeColors,
  type ColorScale,
  type SemanticColor,
} from "@/lib/colorUtils";

const SCALE_LABELS: Record<keyof ColorScale, string> = {
  50: "50", 100: "100", 200: "200", 300: "300", 400: "400",
  500: "500", 600: "600", 700: "700", 800: "800", 900: "900",
};

interface SemanticPickerProps {
  label: string;
  description: string;
  value: SemanticColor;
  onChange: (val: SemanticColor) => void;
}

const SemanticColorPicker: React.FC<SemanticPickerProps> = ({ label, description, value, onChange }) => (
  <Card className="p-4 space-y-3">
    <div>
      <label className="text-sm font-medium" style={{ color: "var(--color-700)" }}>{label}</label>
      <p className="text-xs mt-0.5" style={{ color: "var(--color-500)" }}>{description}</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[
        { key: "base" as const, label: "Base" },
        { key: "bg" as const, label: "Achtergrond" },
      ].map(({ key, label: l }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <input
            type="color"
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
            style={{ borderColor: "var(--color-200)" }}
          />
          <span className="text-[10px] font-medium" style={{ color: "var(--color-500)" }}>{l}</span>
          <code className="text-[9px] font-mono" style={{ color: "var(--color-400)" }}>{value[key]}</code>
        </div>
      ))}
    </div>
  </Card>
);

const ThemeColorsSettings: React.FC = () => {
  const { theme, isLoading, saveTheme, isSaving } = useThemeColorsAdmin();
  const [localTheme, setLocalTheme] = useState<ThemeColors>(theme);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const updateAndPreview = (updated: ThemeColors) => {
    setLocalTheme(updated);
    setHasChanges(true);
    applyThemeToCSS(updated);
  };

  const handleBaseColorChange = (hex: string) => {
    const newTheme = generateThemeFromBase(hex);
    updateAndPreview({
      ...newTheme,
      destructive: localTheme.destructive,
      success: localTheme.success,
      warning: localTheme.warning,
      info: localTheme.info,
    });
  };

  const handleAccentColorChange = (hex: string) => {
    updateAndPreview({
      ...localTheme,
      primaryLight: hex,
      scale: { ...localTheme.scale, 400: hex },
    });
  };

  const handleSemanticChange = (key: 'destructive' | 'success' | 'warning' | 'info', value: SemanticColor) => {
    updateAndPreview({ ...localTheme, [key]: value });
  };

  const handleSave = () => {
    saveTheme(localTheme);
    setHasChanges(false);
  };

  const handleReset = () => {
    updateAndPreview(DEFAULT_THEME);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Laden...</div>;
  }

  const destructive = localTheme.destructive ?? DEFAULT_SEMANTIC.destructive;
  const success = localTheme.success ?? DEFAULT_SEMANTIC.success;
  const warning = localTheme.warning ?? DEFAULT_SEMANTIC.warning;
  const info = localTheme.info ?? DEFAULT_SEMANTIC.info;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-primary-base)" }}>
          <Palette className="h-5 w-5" />
          Kleurenpalet Beheer
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Standaard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>

      {/* Primary Color Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <label className="text-sm font-medium" style={{ color: "var(--color-700)" }}>
            Hoofdkleur (Primary)
          </label>
          <p className="text-xs" style={{ color: "var(--color-500)" }}>
            De basistint waarop het hele palet wordt berekend.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={localTheme.primaryBase}
              onChange={(e) => handleBaseColorChange(e.target.value)}
              className="w-14 h-14 rounded-lg cursor-pointer border-2 p-0.5"
              style={{ borderColor: "var(--color-200)" }}
            />
            <code className="text-sm font-mono px-2 py-1 rounded" style={{ background: "var(--color-50)", color: "var(--color-700)" }}>
              {localTheme.primaryBase}
            </code>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <label className="text-sm font-medium" style={{ color: "var(--color-700)" }}>
            Accentkleur (Light)
          </label>
          <p className="text-xs" style={{ color: "var(--color-500)" }}>
            Lichtere variant voor achtergronden, hovers en accenten.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={localTheme.primaryLight}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="w-14 h-14 rounded-lg cursor-pointer border-2 p-0.5"
              style={{ borderColor: "var(--color-200)" }}
            />
            <code className="text-sm font-mono px-2 py-1 rounded" style={{ background: "var(--color-50)", color: "var(--color-700)" }}>
              {localTheme.primaryLight}
            </code>
          </div>
        </Card>
      </div>

      {/* Generated Palette */}
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-700)" }}>
          Gegenereerd Palet
        </h4>
        <div className="flex gap-1 rounded-lg overflow-hidden">
          {(Object.keys(SCALE_LABELS) as unknown as Array<keyof ColorScale>).map((key) => (
            <div key={key} className="flex-1 text-center">
              <div
                className="h-16 w-full transition-colors"
                style={{ backgroundColor: localTheme.scale[key] }}
              />
              <div className="py-1.5 space-y-0.5">
                <div className="text-[10px] font-semibold" style={{ color: "var(--color-600)" }}>
                  {SCALE_LABELS[key]}
                </div>
                <div className="text-[9px] font-mono" style={{ color: "var(--color-400)" }}>
                  {localTheme.scale[key]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Semantic Colors */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-700)" }}>
          Semantische Kleuren
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SemanticColorPicker
            label="Destructive (Verwijderen)"
            description="Verwijder-knoppen, foutmeldingen"
            value={destructive}
            onChange={(v) => handleSemanticChange('destructive', v)}
          />
          <SemanticColorPicker
            label="Success (Succes)"
            description="Bevestigingsmeldingen, voltooide acties"
            value={success}
            onChange={(v) => handleSemanticChange('success', v)}
          />
          <SemanticColorPicker
            label="Warning (Waarschuwing)"
            description="Waarschuwingsberichten, aandachtspunten"
            value={warning}
            onChange={(v) => handleSemanticChange('warning', v)}
          />
          <SemanticColorPicker
            label="Info (Informatie)"
            description="Informatieve berichten, tips"
            value={info}
            onChange={(v) => handleSemanticChange('info', v)}
          />
        </div>
      </div>

      {/* Live Preview */}
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-700)" }}>
          Live Preview
        </h4>

        {/* Buttons */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Knoppen</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Primaire Knop</Button>
            <Button size="sm" variant="outline">Outline Knop</Button>
            <Button size="sm" variant="secondary">Secundair</Button>
            <Button
              size="sm"
              style={{ backgroundColor: destructive.base, color: "#ffffff", borderColor: destructive.base }}
            >
              Verwijderen
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{ color: destructive.base, borderColor: destructive.border ?? destructive.base }}
            >
              Danger Outline
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Badges</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge>Primary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge style={{ backgroundColor: success.bg, color: success.base, border: "none" }}>Succes</Badge>
            <Badge style={{ backgroundColor: warning.bg, color: warning.base, border: "none" }}>Waarschuwing</Badge>
            <Badge style={{ backgroundColor: destructive.bg, color: destructive.base, border: "none" }}>Fout</Badge>
            <Badge style={{ backgroundColor: info.bg, color: info.base, border: "none" }}>Info</Badge>
          </div>
        </div>

        {/* Cards */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Kaarten</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "var(--color-50)", border: "1px solid var(--color-200)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--color-700)" }}>Lichte kaart</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-500)" }}>Kleur 50</p>
            </div>
            <div className="p-3 rounded-lg text-white" style={{ background: "var(--color-600)" }}>
              <p className="text-xs font-medium">Donkere kaart</p>
              <p className="text-[10px] mt-0.5 opacity-80">Kleur 600</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: success.bg, border: `1px solid ${success.base}33` }}>
              <p className="text-xs font-medium" style={{ color: success.base }}>Succes</p>
              <p className="text-[10px] mt-0.5" style={{ color: success.base }}>Bevestigd</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: destructive.bg, border: `1px solid ${destructive.base}33` }}>
              <p className="text-xs font-medium" style={{ color: destructive.base }}>Fout</p>
              <p className="text-[10px] mt-0.5" style={{ color: destructive.base }}>Afgewezen</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Meldingen</p>
          <div className="space-y-2">
            {[
              { c: info, label: "ℹ️ Dit is een informatieve melding." },
              { c: success, label: "✅ Actie is succesvol uitgevoerd." },
              { c: warning, label: "⚠️ Let op, er zijn onopgeslagen wijzigingen." },
              { c: destructive, label: "❌ Er is een fout opgetreden." },
            ].map(({ c, label }, i) => (
              <div key={i} className="p-2.5 rounded-md text-xs" style={{ backgroundColor: c.bg, color: c.base, borderLeft: `3px solid ${c.base}` }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {hasChanges && (
        <p className="text-xs text-center" style={{ color: "var(--color-warning)" }}>
          ⚠️ Je hebt onopgeslagen wijzigingen. Klik op "Opslaan" om het palet permanent toe te passen.
        </p>
      )}
    </div>
  );
};

export default ThemeColorsSettings;
