
import React, { useState, useEffect } from "react";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Textarea } from "../../../MINIVOETBAL.UI/components/ui/textarea";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { useToast } from "../../../MINIVOETBAL.UI/hooks/use-toast";
import { MatchFormData } from "../types";
import { teamService, Team } from "@/services/core";
import { refereeService, type Referee } from "@/services/core";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../MINIVOETBAL.UI/components/ui/select";

interface EditMatchFormProps {
  initialData: MatchFormData;
  onSave: (data: MatchFormData) => void;
  onCancel: () => void;
}

export const EditMatchForm: React.FC<EditMatchFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<MatchFormData>(initialData);
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScoreEntered, setIsScoreEntered] = useState(
    initialData.homeScore !== undefined || initialData.awayScore !== undefined
  );
  const { toast } = useToast();

  // Load teams and referees from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, refereesData] = await Promise.all([
          teamService.getAllTeams(),
          refereeService.getReferees()
        ]);
        setTeams(teamsData);
        setReferees(refereesData);
      } catch (error) {
        toast({
          title: "Fout bij laden data",
          description: "Er is een fout opgetreden bij het laden van de data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  const handleInputChange = (field: keyof MatchFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.date || !formData.homeTeam || !formData.awayTeam || !formData.location) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }
    
    if (isScoreEntered) {
      if (formData.homeScore === undefined || formData.awayScore === undefined) {
        toast({
          title: "Fout",
          description: "Vul beide scores in",
          variant: "destructive"
        });
        return;
      }
    }
    
    onSave(formData);
    
    toast({
      title: isScoreEntered 
        ? "Wedstrijdresultaat opgeslagen" 
        : "Wedstrijd opgeslagen",
      description: `${formData.homeTeam} vs ${formData.awayTeam} is succesvol opgeslagen.`
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8">Teams laden...</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum <span className="text-red-500">*</span></Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time">Tijdstip <span className="text-red-500">*</span></Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleInputChange("time", e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="uniqueNumber">Uniek wedstrijdnummer</Label>
        <Input
          id="uniqueNumber"
          value={formData.uniqueNumber || ''}
          onChange={(e) => handleInputChange("uniqueNumber", e.target.value)}
          placeholder="bijv. 0901 (speeldag 09, wedstrijd 01)"
        />
        <p className="text-sm text-muted-foreground">
          Format: SSNN (SS=speeldag, NN=wedstrijdnummer). Voorbeeld: 0901
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="homeTeam">Thuisteam <span className="text-red-500">*</span></Label>
          <Select
            value={formData.homeTeam || "select-home-team"}
            onValueChange={(value) => handleInputChange("homeTeam", value !== "select-home-team" ? value : "")}
          >
            <SelectTrigger id="homeTeam">
              <SelectValue placeholder="Selecteer thuisteam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-home-team">Selecteer thuisteam</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.team_id} value={team.team_name}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awayTeam">Uitteam <span className="text-red-500">*</span></Label>
          <Select
            value={formData.awayTeam || "select-away-team"}
            onValueChange={(value) => handleInputChange("awayTeam", value !== "select-away-team" ? value : "")}
          >
            <SelectTrigger id="awayTeam">
              <SelectValue placeholder="Selecteer uitteam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-away-team">Selecteer uitteam</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.team_id} value={team.team_name}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Locatie <span className="text-red-500">*</span></Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
          required
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Label htmlFor="score-toggle">Score invoeren</Label>
        <input
          id="score-toggle"
          type="checkbox"
          checked={isScoreEntered}
          onChange={() => setIsScoreEntered(!isScoreEntered)}
          className="ml-2 h-4 w-4"
        />
      </div>
      
      {isScoreEntered && (
        <>
          <div className="grid grid-cols-5 gap-4 items-end">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="homeScore">Score thuisteam</Label>
              <Input
                id="homeScore"
                type="number"
                min="0"
                value={formData.homeScore !== null && formData.homeScore !== undefined ? formData.homeScore : ""}
                onChange={(e) => handleInputChange("homeScore", e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
            
            <div className="col-span-1 flex justify-center items-center">
              <span className="text-xl font-bold">-</span>
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="awayScore">Score uitteam</Label>
              <Input
                id="awayScore"
                type="number"
                min="0"
                value={formData.awayScore !== null && formData.awayScore !== undefined ? formData.awayScore : ""}
                onChange={(e) => handleInputChange("awayScore", e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referee">Scheidsrechter</Label>
            <Select
              value={formData.referee || ""}
              onValueChange={(value) => handleInputChange("referee", value)}
            >
              <SelectTrigger id="referee">
                <SelectValue placeholder="Selecteer scheidsrechter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Geen scheidsrechter</SelectItem>
                {referees.map((referee) => (
                  <SelectItem key={referee.user_id} value={referee.username}>
                    {referee.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notities</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => handleInputChange("notes", e.target.value)}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white text-purple-dark border-purple-dark hover:bg-purple-dark hover:text-white">
          Annuleren
        </Button>
        <Button type="submit" className="bg-white text-purple-dark border-purple-dark hover:bg-purple-dark hover:text-white">
          {formData.id ? "Bijwerken" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
};
