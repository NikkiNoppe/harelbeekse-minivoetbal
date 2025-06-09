
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { AdvancedCompetitionConfig } from "../../types-advanced";

interface FormatConfigurationCardProps {
  config: AdvancedCompetitionConfig;
  setConfig: (config: AdvancedCompetitionConfig) => void;
}

const FormatConfigurationCard: React.FC<FormatConfigurationCardProps> = ({
  config,
  setConfig
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Format Configuratie
        </CardTitle>
        <CardDescription>
          Configureer de basis instellingen voor de competitie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="competition-name">Competitie Naam</Label>
            <Input
              id="competition-name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="Bijv. Lente Competitie 2025"
            />
          </div>
          
          <div>
            <Label htmlFor="format-type">Format Type</Label>
            <Select 
              value={config.format_type} 
              onValueChange={(value) => setConfig({ ...config, format_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Reguliere Competitie</SelectItem>
                <SelectItem value="playoff">Met Playoffs</SelectItem>
                <SelectItem value="cup">Beker Systeem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-date">Start Datum</Label>
            <Input
              id="start-date"
              type="date"
              value={config.start_date}
              onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="end-date">Eind Datum</Label>
            <Input
              id="end-date"
              type="date"
              value={config.end_date}
              onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="matches-per-week">Wedstrijden per week</Label>
            <Input
              id="matches-per-week"
              type="number"
              min="1"
              max="14"
              value={config.matches_per_week}
              onChange={(e) => setConfig({ ...config, matches_per_week: parseInt(e.target.value) || 7 })}
            />
          </div>

          {config.format_type === 'playoff' && (
            <div>
              <Label htmlFor="playoff-teams">Aantal playoff teams</Label>
              <Input
                id="playoff-teams"
                type="number"
                min="2"
                max="8"
                value={config.playoff_teams || 4}
                onChange={(e) => setConfig({ ...config, playoff_teams: parseInt(e.target.value) || 4 })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormatConfigurationCard;
