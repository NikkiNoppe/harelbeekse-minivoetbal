import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suspensionService, PlayerCard, Suspension } from "@/services/suspensionService";
const SuspensionsTab: React.FC = () => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: playerCards,
    isLoading: loadingCards
  } = useQuery({
    queryKey: ['playerCards'],
    queryFn: suspensionService.getPlayerCards
  });
  const {
    data: suspensions,
    isLoading: loadingSuspensions
  } = useQuery({
    queryKey: ['suspensions'],
    queryFn: suspensionService.getActiveSuspensions
  });
  const handleRefresh = async () => {
    try {
      await suspensionService.refreshPlayerCards();
      queryClient.invalidateQueries({
        queryKey: ['playerCards']
      });
      queryClient.invalidateQueries({
        queryKey: ['suspensions']
      });
      toast({
        title: "Vernieuwd",
        description: "Kaarten en schorsingen zijn bijgewerkt."
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het vernieuwen.",
        variant: "destructive"
      });
    }
  };
  const getStatusBadge = (status: 'active' | 'pending' | 'completed') => {
    if (status === 'active') {
      return <Badge className="badge-purple">Actief</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="badge-purple">In afwachting</Badge>;
    }
    return <Badge className="badge-purple">Afgerond</Badge>;
  };
  const topYellowCardPlayers = playerCards?.filter(player => player.yellowCards > 0)?.sort((a, b) => b.yellowCards - a.yellowCards)?.slice(0, 10) || [];
  if (loadingCards || loadingSuspensions) {
    return <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Schorsingen laden...</span>
      </div>;
  }
  return <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Actuele Schorsingen</h2>
        
      </div>

      <section>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Speler</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Aantal Wedstrijden</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspensions && suspensions.length > 0 ? suspensions.map((suspension, index) => <TableRow key={`${suspension.playerId}-${index}`} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{suspension.playerName}</TableCell>
                      <TableCell>{suspension.teamName}</TableCell>
                      <TableCell>{suspension.reason}</TableCell>
                      <TableCell className="text-center">{suspension.matches}</TableCell>
                      <TableCell>
                        {getStatusBadge(suspension.status)}
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Geen actieve schorsingen
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mt-8">Gele Kaarten Register</h2>
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spelers met Meeste Gele Kaarten</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Speler</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Geel</TableHead>
                      <TableHead className="text-center">Rood</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topYellowCardPlayers.length > 0 ? topYellowCardPlayers.map(player => <TableRow key={player.playerId} className="hover:bg-muted/20">
                          <TableCell>{player.playerName}</TableCell>
                          <TableCell>{player.teamName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {[...Array(player.yellowCards)].map((_, i) => <div key={i} className="h-5 w-3 bg-yellow-400 rounded-sm"></div>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {[...Array(player.redCards)].map((_, i) => <div key={i} className="h-5 w-3 bg-red-500 rounded-sm"></div>)}
                            </div>
                          </TableCell>
                        </TableRow>) : <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Geen kaarten geregistreerd
                        </TableCell>
                      </TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schorsingsregels</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium">Gele Kaarten</h4>
                  <p className="text-muted-foreground">
                    Schorsingen na gele kaarten:
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>3 gele kaarten: 1 wedstrijd schorsing</li>
                    <li>5 gele kaarten: 2 opeenvolgende wedstrijden</li>
                  </ul>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-medium">Rode Kaarten</h4>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    <li>Rode kaart: onmiddellijke uitsluiting ZONDER vervanging</li>
                    <li>Minimum schorsing: 1 wedstrijd</li>
                    <li>Minnelijke schikking mogelijk</li>
                  </ul>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-medium">Beroepsprocedure</h4>
                  <p className="text-muted-foreground">
                    Clubs kunnen binnen 7 werkdagen na de wedstrijd beroep aantekenen tegen een rode kaart.
                  </p>
                  <p className="text-muted-foreground">
                    Dit gebeurd schriftelijk via noppe.nikki@icloud.com.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>;
};
export default SuspensionsTab;