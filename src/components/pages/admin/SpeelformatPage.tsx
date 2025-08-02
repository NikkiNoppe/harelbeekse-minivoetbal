import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy, 
  Award, 
  Target, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Archive, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tournament {
  id: string;
  name: string;
  type: "competition" | "cup" | "playoffs";
  status: "active" | "draft" | "completed" | "archived";
  description: string;
  teams: number;
  matches: number;
  startDate?: string;
  endDate?: string;
  lastModified: string;
}

const SpeelformatPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockTournaments: Tournament[] = [
      {
        id: "comp-2024",
        name: "Competitie 2024",
        type: "competition",
        status: "active",
        description: "Reguliere competitie met 16 teams in een dubbele poule",
        teams: 16,
        matches: 240,
        startDate: "2024-01-15",
        endDate: "2024-05-30",
        lastModified: "2024-01-10"
      },
      {
        id: "cup-2024",
        name: "Beker 2024",
        type: "cup",
        status: "draft",
        description: "Knockout toernooi voor alle teams",
        teams: 16,
        matches: 15,
        startDate: "2024-03-01",
        endDate: "2024-04-15",
        lastModified: "2024-01-08"
      },
      {
        id: "playoffs-2024",
        name: "Play-Offs 2024",
        type: "playoffs",
        status: "draft",
        description: "Play-offs voor de top 8 teams van de competitie",
        teams: 8,
        matches: 7,
        startDate: "2024-06-01",
        endDate: "2024-06-30",
        lastModified: "2024-01-05"
      }
    ];

    setTimeout(() => {
      setTournaments(mockTournaments);
      setLoading(false);
    }, 1000);
  }, []);

  const getTournamentIcon = (type: Tournament["type"]) => {
    switch (type) {
      case "competition":
        return <Trophy className="h-5 w-5" />;
      case "cup":
        return <Award className="h-5 w-5" />;
      case "playoffs":
        return <Target className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: Tournament["status"]) => {
    const variants = {
      active: "default",
      draft: "secondary",
      completed: "outline",
      archived: "destructive"
    } as const;

    const labels = {
      active: "Actief",
      draft: "Concept",
      completed: "Voltooid",
      archived: "Gearchiveerd"
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  };

  const handleAction = (action: string, tournament: Tournament) => {
    toast({
      title: `${action} - ${tournament.name}`,
      description: `Actie "${action}" wordt uitgevoerd voor ${tournament.name}`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Speelformat Beheer</h2>
            <p className="text-muted-foreground">
              Centraal beheer voor alle toernooien en speelformaten
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Speelformat Beheer</h2>
          <p className="text-muted-foreground">
            Centraal beheer voor alle toernooien en speelformaten
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Nieuw Toernooi
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Actief</p>
                <p className="text-2xl font-bold">{tournaments.filter(t => t.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Concepten</p>
                <p className="text-2xl font-bold">{tournaments.filter(t => t.status === 'draft').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Teams</p>
                <p className="text-2xl font-bold">{tournaments.reduce((acc, t) => acc + t.teams, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Wedstrijden</p>
                <p className="text-2xl font-bold">{tournaments.reduce((acc, t) => acc + t.matches, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getTournamentIcon(tournament.type)}
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                </div>
                {getStatusBadge(tournament.status)}
              </div>
              <CardDescription className="text-sm">
                {tournament.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tournament Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Teams</p>
                  <p className="font-medium">{tournament.teams}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wedstrijden</p>
                  <p className="font-medium">{tournament.matches}</p>
                </div>
                {tournament.startDate && (
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-medium">{new Date(tournament.startDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                )}
                {tournament.endDate && (
                  <div>
                    <p className="text-muted-foreground">Einde</p>
                    <p className="font-medium">{new Date(tournament.endDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleAction("Bewerken", tournament)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bewerken
                  </Button>
                  {tournament.status === 'active' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAction("Pauzeren", tournament)}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAction("Activeren", tournament)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleAction("Dupliceren", tournament)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Dupliceren
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction("Herladen", tournament)}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction("Archiveren", tournament)}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Last Modified */}
              <p className="text-xs text-muted-foreground">
                Laatst gewijzigd: {new Date(tournament.lastModified).toLocaleDateString('nl-NL')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Gebruik de Speelformat pagina voor een overzicht van alle toernooien. 
          Voor gedetailleerd beheer van individuele toernooien, navigeer naar de specifieke secties 
          (Competitie, Beker, Play-Offs) in het zijmenu.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SpeelformatPage;