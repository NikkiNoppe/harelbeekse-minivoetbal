
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MOCK_TEAMS } from "@/data/mockData";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PastMatch, MatchFormData } from "@/components/user/tabs/MatchTab";
import { Badge } from "@/components/ui/badge";

interface FormMessageProps {
  children: React.ReactNode;
  type?: "error" | "info" | "success";
}

export const FormMessage: React.FC<FormMessageProps> = ({ children, type = "info" }) => {
  const bgColor = 
    type === "error" ? "bg-red-50 text-red-700 border-red-200" :
    type === "success" ? "bg-green-50 text-green-700 border-green-200" :
    "bg-blue-50 text-blue-700 border-blue-200";
  
  return (
    <div className={`p-4 rounded-md border ${bgColor}`}>
      {children}
    </div>
  );
};

interface FormMenuItemProps {
  title: string | React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}

export const FormMenuItem: React.FC<FormMenuItemProps> = ({ title, subtitle, onClick }) => {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-md border hover:bg-slate-100 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div>
        <h4 className="font-medium">{title}</h4>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

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
  const [isScoreEntered, setIsScoreEntered] = useState(
    initialData.homeScore !== undefined || initialData.awayScore !== undefined
  );
  const { toast } = useToast();
  
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
  
  const teamOptions = MOCK_TEAMS.map(team => ({
    value: team.name,
    label: team.name
  }));
  
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
              {teamOptions.map((team) => (
                <SelectItem key={team.value} value={team.value}>
                  {team.label}
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
              {teamOptions.map((team) => (
                <SelectItem key={team.value} value={team.value}>
                  {team.label}
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
            <Input
              id="referee"
              value={formData.referee || ""}
              onChange={(e) => handleInputChange("referee", e.target.value)}
            />
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit">
          {formData.id ? "Bijwerken" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
};

interface PastMatchesListProps {
  matches: PastMatch[];
}

export const PastMatchesList: React.FC<PastMatchesListProps> = ({ matches }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Wedstrijd</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Locatie</TableHead>
            <TableHead>Scheidsrechter</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                {match.uniqueNumber ? (
                  <Badge variant="outline" className="bg-primary text-white">
                    {match.uniqueNumber}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {match.date}
                </div>
              </TableCell>
              <TableCell>
                {match.homeTeam} vs {match.awayTeam}
              </TableCell>
              <TableCell className="font-bold">
                {match.homeScore} - {match.awayScore}
              </TableCell>
              <TableCell>{match.location}</TableCell>
              <TableCell>{match.referee}</TableCell>
            </TableRow>
          ))}
          {matches.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Geen wedstrijden gevonden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
