import React from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Textarea } from "@shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Settings, Trophy, Users, Calendar } from "lucide-react";
import { AdvancedCompetitionConfig } from "../types-advanced";

interface FormatConfigTabProps {
  config: AdvancedCompetitionConfig;
  setConfig: (config: AdvancedCompetitionConfig) => void;
  onNext: () => void;
}

const FormatConfigTab: React.FC<FormatConfigTabProps> = ({ config, setConfig, onNext }) => {
  const handleConfigChange = (field: keyof AdvancedCompetitionConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const isValid = config.name && config.format_type && config.matches_per_week > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Competitieformat Configuratie</h3>
      </div>

      <div className="grid gap-6">
        {/* Basis configuratie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Basis Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="competitionName">Competitienaam</Label>
              <Input
                id="competitionName"
                value={config.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="Bijv. Winter Competitie 2025"
              />
            </div>

            <div>
              <Label htmlFor="formatType">Type Competitie</Label>
              <Select value={config.format_type} onValueChange={(value) => handleConfigChange('format_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer competitietype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Reguliere Competitie</SelectItem>
                  <SelectItem value="playoff">Competitie met Playoffs</SelectItem>
                  <SelectItem value="cup">Beker Toernooi</SelectItem>
                  <SelectItem value="custom">Custom Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Speelschema configuratie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Speelschema
            </CardTitle>
            <CardDescription>
              Configureer hoeveel wedstrijden er per week gespeeld worden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="matchesPerWeek">Wedstrijden per week</Label>
              <Input
                id="matchesPerWeek"
                type="number"
                min="1"
                max="21"
                value={config.matches_per_week}
                onChange={(e) => handleConfigChange('matches_per_week', parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Standard: 7 wedstrijden per week (optimaal voor meeste competities)
              </p>
            </div>

            {config.format_type === 'regular' && (
              <div>
                <Label htmlFor="totalRounds">Aantal rondes</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  value={config.total_rounds || ''}
                  onChange={(e) => handleConfigChange('total_rounds', parseInt(e.target.value) || undefined)}
                  placeholder="Bijv. 2 (heen en terug)"
                />
              </div>
            )}

            {config.format_type === 'playoff' && (
              <div>
                <Label htmlFor="playoffTeams">Teams in playoffs</Label>
                <Input
                  id="playoffTeams"
                  type="number"
                  min="2"
                  value={config.playoff_teams || ''}
                  onChange={(e) => handleConfigChange('playoff_teams', parseInt(e.target.value) || undefined)}
                  placeholder="Bijv. 4"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom configuratie */}
        {config.format_type === 'custom' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Regels</CardTitle>
              <CardDescription>
                Beschrijf speciale regels of eisen voor deze competitie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Bijv. Extra rust tussen wedstrijden, speciale toernooiregels, etc."
                value={config.config_data?.custom_rules || ''}
                onChange={(e) => handleConfigChange('config_data', {
                  ...config.config_data,
                  custom_rules: e.target.value
                })}
                rows={4}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid}>
          Volgende: Planning
        </Button>
      </div>
    </div>
  );
};

export default FormatConfigTab;
