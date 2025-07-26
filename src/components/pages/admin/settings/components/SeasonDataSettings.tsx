import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Edit, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { seasonService, type SeasonData } from "@/services";

const SeasonDataSettings: React.FC = () => {
  const { toast } = useToast();
  const [seasonData, setSeasonData] = useState<SeasonData>({
    season_start_date: '',
    season_end_date: ''
  });
  const [localSeasonData, setLocalSeasonData] = useState<SeasonData>(seasonData);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSeasonData();
  }, []);

  const loadSeasonData = async () => {
    setIsLoading(true);
    try {
      console.log('\uD83D\uDD04 Loading season data...');
      const seasonData = await seasonService.getSeasonData();
      console.log('\u2705 Season data loaded:', { season_start_date: seasonData.season_start_date });
      
      setSeasonData(seasonData);
      setLocalSeasonData(seasonData);
    } catch (error) {
      console.error('\u274c Error loading season data:', error);
      toast({
        title: "Fout",
        description: "Kon seizoensdata niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
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

      // Save to application_settings
      const result = await seasonService.saveSeasonData(localSeasonData);
      
      if (result.success) {
        setSeasonData(localSeasonData);
        setHasChanges(false);
        
        toast({
          title: "Seizoensdata opgeslagen",
          description: result.message,
        });
        
        setIsEditDialogOpen(false);
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

  const handleCancel = () => {
    setLocalSeasonData(seasonData);
    setHasChanges(false);
    setIsEditDialogOpen(false);
  };

  const handleInputChange = (field: keyof SeasonData, value: string) => {
    setLocalSeasonData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const validation = seasonService.validateSeasonData(localSeasonData);
  const isValid = validation.isValid;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Seizoensdata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer de start- en einddatum van het seizoen.
              <br />
              <strong>Let op:</strong> Wijzigingen vereisen een herstart van de applicatie.
            </p>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seizoensperiode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-purple-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-600">Startdatum</h4>
                      <p className="text-sm text-gray-600">{new Date(seasonData.season_start_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                    <Button
                      className="btn-action-edit"
                      onClick={handleEdit}
                    >
                      <Edit />
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-purple-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-600">Einddatum</h4>
                      <p className="text-sm text-gray-600">{new Date(seasonData.season_end_date).toLocaleDateString('nl-NL')}</p>
                    </div>
                    <Button
                      className="btn-action-edit"
                      onClick={handleEdit}
                    >
                      <Edit />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-100 border-purple-light mx-4 sm:mx-auto">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-xl text-center text-purple-light">
              Bewerk Seizoensdata
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 bg-purple-100 p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="seasonStart">Startdatum</Label>
                <Input 
                  id="seasonStart" 
                  type="date" 
                  value={localSeasonData.season_start_date}
                  onChange={(e) => handleInputChange('season_start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seasonEnd">Einddatum</Label>
                <Input 
                  id="seasonEnd" 
                  type="date" 
                  value={localSeasonData.season_end_date}
                  onChange={(e) => handleInputChange('season_end_date', e.target.value)}
                />
              </div>
              
              {!isValid && hasChanges && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Validatie fout:</strong> {validation.errors.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="bg-purple-100 p-4">
            <Button className="btn-light" onClick={handleCancel}>
              Annuleren
            </Button>
            <Button className="btn-dark" onClick={handleSave} disabled={isLoading || !hasChanges || !isValid}>
              {isLoading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeasonDataSettings; 