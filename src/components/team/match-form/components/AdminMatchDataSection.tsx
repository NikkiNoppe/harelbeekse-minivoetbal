
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateMatchData } from "../../match/matchUpdateService";
import { MatchFormData } from "../types";
import { Calendar, MapPin, Users, Settings } from "lucide-react";

interface AdminMatchDataSectionProps {
  match: MatchFormData;
  onMatchUpdate: (updatedMatch: MatchFormData) => void;
  canEdit: boolean;
}

const AdminMatchDataSection: React.FC<AdminMatchDataSectionProps> = ({
  match,
  onMatchUpdate,
  canEdit
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    date: match.date || "",
    time: match.time || "",
    location: match.location || "",
    homeTeamName: match.homeTeamName || "",
    awayTeamName: match.awayTeamName || "",
    speeldag: match.matchday || ""
  });

  const handleSave = async () => {
    if (!canEdit) return;

    setIsUpdating(true);
    try {
      const result = await updateMatchData({
        match_id: match.matchId,
        location: formData.location,
        speeldag: formData.speeldag
      });

      if (result.success) {
        toast({
          title: "Succesvol",
          description: "Wedstrijdgegevens zijn bijgewerkt"
        });

        // Update the local match data
        const updatedMatch: MatchFormData = {
          ...match,
          location: formData.location,
          matchday: formData.speeldag
        };
        onMatchUpdate(updatedMatch);
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
          <Settings className="h-5 w-5" />
          Admin: Wedstrijdgegevens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admin-date" className="text-sm font-medium">
              <Calendar className="h-4 w-4 inline mr-1" />
              Datum
            </Label>
            <Input
              id="admin-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="admin-time" className="text-sm font-medium">
              Tijd
            </Label>
            <Input
              id="admin-time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="admin-location" className="text-sm font-medium">
              <MapPin className="h-4 w-4 inline mr-1" />
              Locatie
            </Label>
            <Input
              id="admin-location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              disabled={!canEdit}
              placeholder="Sporthal/Veld"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="admin-speeldag" className="text-sm font-medium">
              Speeldag
            </Label>
            <Input
              id="admin-speeldag"
              value={formData.speeldag}
              onChange={(e) => setFormData({...formData, speeldag: e.target.value})}
              disabled={!canEdit}
              placeholder="Speeldag 1"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              <Users className="h-4 w-4 inline mr-1" />
              Thuis Team
            </Label>
            <Input
              value={formData.homeTeamName}
              disabled
              className="mt-1 bg-gray-100"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Uit Team
            </Label>
            <Input
              value={formData.awayTeamName}
              disabled
              className="mt-1 bg-gray-100"
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminMatchDataSection;
