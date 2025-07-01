
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Loader2, Bot } from "lucide-react";
import { AIGeneratedSchedule } from "../../types-advanced";

interface GenerationActionsCardProps {
  selectedProvider: 'openai' | 'abacus' | null;
  isValid: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onNext: () => void;
  generatedSchedule?: AIGeneratedSchedule | null;
}

const GenerationActionsCard: React.FC<GenerationActionsCardProps> = ({
  selectedProvider,
  isValid,
  isGenerating,
  onGenerate,
  onNext,
  generatedSchedule
}) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema Genereren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={onGenerate}
              disabled={!selectedProvider || !isValid || isGenerating}
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

            {!isValid && !isGenerating && (
              <div className="text-center text-sm text-red-600">
                <p>Vul alle verplichte velden in om te kunnen genereren</p>
              </div>
            )}

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
        <div></div>
        <Button onClick={onNext} disabled={!generatedSchedule}>
          Volgende: Voorvertoning
        </Button>
      </div>
    </>
  );
};

export default GenerationActionsCard;
