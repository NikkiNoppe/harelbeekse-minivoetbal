import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, AlertCircle } from "lucide-react";

interface AIProviderCardProps {
  selectedProvider: 'openai' | 'abacus' | null;
  setSelectedProvider: (provider: 'openai' | 'abacus' | null) => void;
}

const AIProviderCard: React.FC<AIProviderCardProps> = ({
  selectedProvider,
  setSelectedProvider
}) => {
  return (
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
          </div>
        </div>

        {!selectedProvider && (
          <div className="mt-4 p-3 border border-purple-200 bg-purple-50 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-purple-800">
              Selecteer een AI service om het schema te kunnen genereren
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProviderCard;
