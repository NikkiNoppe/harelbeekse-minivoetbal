import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seasonService, type SeasonData } from "@/services/seasonService";

const SeasonDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Load season data from JSON file
  const [seasonData, setSeasonData] = useState<SeasonData>(() => seasonService.getSeasonData());
  const [localSeasonData, setLocalSeasonData] = useState<SeasonData>(seasonData);
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: keyof SeasonData, value: string) => {
    setLocalSeasonData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate the data before saving
      const validation = seasonService.validateSeasonData(localSeasonData);
      if (!validation.isValid) {
        toast({
          title: "Validatie fout",
          description: validation.errors.join(", "),
          variant: "destructive"
        });
        return;
      }

      // Save to JSON file
      const result = await seasonService.saveSeasonData(localSeasonData);
      
      if (result.success) {
        setSeasonData(localSeasonData);
        setHasChanges(false);
        
        toast({
          title: "Seizoensdata opgeslagen",
          description: result.message,
        });
      } else {
        toast({
          title: "Fout bij opslaan",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Kon seizoensdata niet opslaan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLocalSeasonData(seasonData);
    setHasChanges(false);
  };

  const validation = seasonService.validateSeasonData(localSeasonData);
  const isValid = validation.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Seizoensdata Beheer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Belangrijk:</strong> Configureer hier de begin- en einddatum van het volledige seizoen 
              waar gespeeld kan worden. Deze data wordt gebruikt voor het genereren van competitieschema's.
            </p>
          </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-start">Seizoen Startdatum</Label>
                <Input
                  id="season-start"
                  type="date"
                  value={localSeasonData.season_start_date}
                  onChange={(e) => handleInputChange('season_start_date', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Wanneer het seizoen officieel begint
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-end">Seizoen Einddatum</Label>
                <Input
                  id="season-end"
                  type="date"
                  value={localSeasonData.season_end_date}
                  onChange={(e) => handleInputChange('season_end_date', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Wanneer het seizoen officieel eindigt
                </p>
              </div>
            </div>

          {!isValid && hasChanges && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Validatie fout:</strong> {validation.errors.join(", ")}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || !isValid || isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Opslaan..." : "Opslaan"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Herstellen
            </Button>
          </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Huidige Seizoensdata:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Seizoen:</strong> {seasonData.season_start_date} - {seasonData.season_end_date}</p>
                <p><strong>Seizoen lengte:</strong> {
                  Math.ceil((new Date(seasonData.season_end_date).getTime() - new Date(seasonData.season_start_date).getTime()) / (1000 * 60 * 60 * 24))
                } dagen</p>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonDataSettings; 