
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { AdvancedCompetitionConfig, TeamPreference, VacationPeriod, Team } from "../types-advanced";

interface AIGenerationTabProps {
  config: AdvancedCompetitionConfig;
  selectedTeams: number[];
  teamPreferences: TeamPreference[];
  vacationPeriods: VacationPeriod[];
  isGenerating: boolean;
  onGenerate: (provider: 'openai' | 'abacus') => void;
  onNext: () => void;
  onPrevious: () => void;
}

const AIGenerationTab: React.FC<AIGenerationTabProps> = ({
  config,
  selectedTeams,
  teamPreferences,
  vacationPeriods,
  isGenerating,
  onGenerate,
  onNext,
  onPrevious
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'abacus' | null>(null);

  const handleGenerate = () => {
    if (selectedProvider) {
      onGenerate(selectedProvider);
    }
  };

  const getConfigSummary = () => {
    const selectedVacations = vacationPeriods.filter(vp => 
      config.vacation_periods.includes(vp.id)
    );
    
    return {
      teams: selectedTeams.length,
      duration: config.start_date && config.end_date ? 
        Math.ceil((new Date(config.end_date).getTime() - new Date(config.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0,
      matchesPerWeek: config.matches_per_week,
      vacationPeriods: selectedVacations.length,
      teamPreferences: teamPreferences.filter(tp => 
        tp.preferred_home_day !== undefined || 
        tp.preferred_time_slot || 
        tp.max_travel_distance
      ).length
    };
  };

  const summary = getConfigSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5" />
        <h3 className="text-lg font-semibold">AI Schema Generatie</h3>
      </div>

      {/* Configuratie overzicht */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Configuratie Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.teams}</div>
              <div className="text-sm text-muted-foreground">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.duration}</div>
              <div className="text-sm text-muted-foreground">Weken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.matchesPerWeek}</div>
              <div className="text-sm text-muted-foreground">Wedstrijden/week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.vacationPeriods}</div>
              <div className="text-sm text-muted-foreground">Verlofperiodes</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Competitie Details:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Naam:</strong> {config.name}</p>
              <p><strong>Type:</strong> {config.format_type}</p>
              <p><strong>Periode:</strong> {config.start_date} tot {config.end_date}</p>
              <p><strong>Teams met voorkeuren:</strong> {summary.teamPreferences}/{summary.teams}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider selectie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecteer AI Service</CardTitle>
          <CardDescription>
            Kies welke AI service je wilt gebruiken voor het genereren van het schema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenAI */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProvider === 'openai' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedProvider('openai')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-5 h-5" />
                <h4 className="font-medium">ChatGPT (OpenAI)</h4>
                <Badge variant="secondary">Populair</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Geavanceerde AI voor complexe schema optimalisatie en natuurlijke taal verwerking
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Optimalisatie:</span>
                  <span className="font-medium">Uitstekend</span>
                </div>
                <div className="flex justify-between">
                  <span>Snelheid:</span>
                  <span className="font-medium">Snel</span>
                </div>
                <div className="flex justify-between">
                  <span>Voorkeuren:</span>
                  <span className="font-medium">Zeer goed</span>
                </div>
              </div>
            </div>

            {/* Abacus.ai */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProvider === 'abacus' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedProvider('abacus')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5" />
                <h4 className="font-medium">Abacus.ai</h4>
                <Badge variant="outline">Specialist</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Gespecialiseerd in planning en schema optimalisatie met machine learning
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Optimalisatie:</span>
                  <span className="font-medium">Specialist</span>
                </div>
                <div className="flex justify-between">
                  <span>Snelheid:</span>
                  <span className="font-medium">Zeer snel</span>
                </div>
                <div className="flex justify-between">
                  <span>Voorkeuren:</span>
                  <span className="font-medium">Goed</span>
                </div>
              </div>
            </div>
          </div>

          {!selectedProvider && (
            <div className="mt-4 p-3 border border-orange-200 bg-orange-50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                Selecteer een AI service om het schema te kunnen genereren
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generatie actie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema Genereren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleGenerate}
              disabled={!selectedProvider || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereren met {selectedProvider?.toUpperCase()}...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Genereer Schema met {selectedProvider?.toUpperCase() || 'AI'}
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Dit kan 30-60 seconden duren...</p>
                <p>De AI analyseert alle voorkeuren en constraints</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isGenerating}>
          Vorige: Teams
        </Button>
        <Button onClick={onNext} disabled={true}>
          Volgende: Voorvertoning
        </Button>
      </div>
    </div>
  );
};

export default AIGenerationTab;
