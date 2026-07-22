import React, { useState, useEffect } from "react";
import { Palette, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useThemeColorsAdmin } from "@/hooks/useThemeColors";
import {
  generateThemeFromBase,
  applyThemeToCSS,
  type ThemeColors,
  type ColorScale,
} from "@/lib/colorUtils";
import { applyThemeToDocument } from "@/lib/themeDocument";
import { SectionIcon } from "@/components/layout";

const SCALE_LABELS: Record<keyof ColorScale, string> = {
  50: "50", 100: "100", 200: "200", 300: "300", 400: "400",
  500: "500", 600: "600", 700: "700", 800: "800", 900: "900",
};

/** Behoud semantische kleuren uit DB bij palet-wijzigingen (niet bewerkbaar in UI). */
function withStoredSemantics(next: ThemeColors, current: ThemeColors): ThemeColors {
  return {
    ...next,
    destructive: current.destructive,
    success: current.success,
    warning: current.warning,
    info: current.info,
  };
}

const ThemeColorsSettings: React.FC = () => {
  const { theme, isLoading, saveTheme, isSaving } = useThemeColorsAdmin();
  const [localTheme, setLocalTheme] = useState<ThemeColors>(theme);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
    setHasChanges(false);
  }, [theme]);

  /** Live preview tijdens bewerken — restore bij sluiten via org-hub hook. */
  useEffect(() => {
    if (isLoading) return;
    applyThemeToCSS(localTheme);
    void applyThemeToDocument(localTheme);
  }, [localTheme, isLoading]);

  const updateAndPreview = (updated: ThemeColors) => {
    setLocalTheme(updated);
    setHasChanges(true);
  };

  const handleBaseColorChange = (hex: string) => {
    updateAndPreview(withStoredSemantics(generateThemeFromBase(hex), localTheme));
  };

  const handleAccentColorChange = (hex: string) => {
    updateAndPreview({
      ...localTheme,
      primaryLight: hex,
      scale: { ...localTheme.scale, 400: hex },
    });
  };

  const handleSave = () => {
    saveTheme(localTheme);
    setHasChanges(false);
  };

  const handleReset = () => {
    updateAndPreview(theme);
    setHasChanges(false);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-primary-base)" }}>
          <SectionIcon icon={Palette} />
          Kleurenpalet Beheer
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="btn btn--secondary min-h-[44px]"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-1" aria-hidden />
            Standaard
          </Button>
          <Button
            type="button"
            className="btn btn--primary min-h-[44px]"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-1" aria-hidden />
            {isSaving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>

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
              aria-label="Hoofdkleur kiezen"
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
              aria-label="Accentkleur kiezen"
            />
            <code className="text-sm font-mono px-2 py-1 rounded" style={{ background: "var(--color-50)", color: "var(--color-700)" }}>
              {localTheme.primaryLight}
            </code>
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-700)" }}>
          Gegenereerd Palet
        </h4>
        <div className="flex gap-1 rounded-lg overflow-hidden">
          {(Object.keys(SCALE_LABELS) as unknown as Array<keyof ColorScale>).map((key) => (
            <div key={key} className="flex-1 text-center min-w-0">
              <div
                className="h-16 w-full transition-colors"
                style={{ backgroundColor: localTheme.scale[key] }}
              />
              <div className="py-1.5 space-y-0.5">
                <div className="text-[10px] font-semibold" style={{ color: "var(--color-600)" }}>
                  {SCALE_LABELS[key]}
                </div>
                <div className="text-[10px] font-mono truncate px-0.5" style={{ color: "var(--color-400)" }}>
                  {localTheme.scale[key]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-700)" }}>
          Live Preview
        </h4>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Knoppen</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button type="button" className="btn btn--primary" size="sm">
              Primaire Knop
            </Button>
            <Button type="button" size="sm" variant="outline">
              Outline Knop
            </Button>
            <Button type="button" className="btn btn--secondary" size="sm">
              Secundair
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Badges</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge>Primary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-500)" }}>Kaarten</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "var(--color-50)", border: "1px solid var(--color-200)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--color-700)" }}>Lichte kaart</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-500)" }}>Kleur 50</p>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{
                background: "var(--color-600)",
                color: "#ffffff",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "#ffffff" }}>
                Donkere kaart
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--color-primary-light)" }}
              >
                Kleur 600
              </p>
            </div>
          </div>
        </div>
      </Card>

      {hasChanges && (
        <p className="text-xs text-center" style={{ color: "var(--color-warning)" }}>
          Je hebt onopgeslagen wijzigingen. Klik op Opslaan om het palet permanent toe te passen.
        </p>
      )}
    </div>
  );
};

export default ThemeColorsSettings;
