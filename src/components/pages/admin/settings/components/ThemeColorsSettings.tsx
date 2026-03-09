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
  type ThemeColors,
  type ColorScale,
} from "@/lib/colorUtils";

const SCALE_LABELS: Record<keyof ColorScale, string> = {
  50: "50",
  100: "100",
  200: "200",
  300: "300",
  400: "400",
  500: "500",
  600: "600",
  700: "700",
  800: "800",
  900: "900",
};

const ThemeColorsSettings: React.FC = () => {
  const { theme, isLoading, saveTheme, isSaving } = useThemeColorsAdmin();
  const [localTheme, setLocalTheme] = useState<ThemeColors>(theme);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleBaseColorChange = (hex: string) => {
    const newTheme = generateThemeFromBase(hex);
    setLocalTheme(newTheme);
    setHasChanges(true);
    // Live preview
    applyThemeToCSS(newTheme);
  };

  const handleAccentColorChange = (hex: string) => {
    const updated = { ...localTheme, primaryLight: hex };
    // Also update scale 400 to match
    updated.scale = { ...updated.scale, 400: hex };
    setLocalTheme(updated);
    setHasChanges(true);
    applyThemeToCSS(updated);
  };

  const handleSave = () => {
    saveTheme(localTheme);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalTheme(DEFAULT_THEME);
    setHasChanges(true);
    applyThemeToCSS(DEFAULT_THEME);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Laden...</div>;
  }

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

      {/* Color Pickers */}
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
          {(Object.keys(SCALE_LABELS) as Array<keyof ColorScale>).map((key) => (
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

      {/* Live Preview */}
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--color-700)" }}>
          Live Preview
        </h4>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Primaire Knop</Button>
          <Button size="sm" variant="outline">Outline Knop</Button>
          <Button size="sm" variant="secondary">Secundair</Button>
          <Badge>Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg" style={{ background: "var(--color-50)", border: "1px solid var(--color-200)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--color-700)" }}>Lichte kaart</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-500)" }}>Achtergrond kleur 50</p>
          </div>
          <div className="p-4 rounded-lg text-white" style={{ background: "var(--color-600)" }}>
            <p className="text-sm font-medium">Donkere kaart</p>
            <p className="text-xs mt-1 opacity-80">Achtergrond kleur 600</p>
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
