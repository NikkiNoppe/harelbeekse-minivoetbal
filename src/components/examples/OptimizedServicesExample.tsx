import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Users, UserCheck } from "lucide-react";
import { optimizedRefereeService } from "@/services/optimized/optimizedRefereeService";
import { optimizedPlayerService } from "@/services/optimized/optimizedPlayerService";

// Example component showing optimized service usage
const OptimizedServicesExample: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);

  // Use optimized referee service
  const { data: referees, isLoading: loadingReferees, error: refereeError } = optimizedRefereeService.useReferees();
  const { refereeOptions } = optimizedRefereeService.useRefereeOptions();
  const { invalidateRefereeCache } = optimizedRefereeService.useRefereeCache();

  // Use optimized player service
  const { data: players, isLoading: loadingPlayers, error: playerError } = optimizedPlayerService.usePlayers();
  const { data: teamPlayers, isLoading: loadingTeamPlayers } = optimizedPlayerService.usePlayersByTeam(selectedTeamId);
  const { playerOptions } = optimizedPlayerService.usePlayerOptions();
  const { invalidatePlayerCache } = optimizedPlayerService.usePlayerCache();

  // Loading skeleton
  if (loadingReferees || loadingPlayers) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referees Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Scheidsrechters
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={invalidateRefereeCache}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {refereeError ? (
            <p className="text-red-600">Fout bij laden scheidsrechters</p>
          ) : (
            <div className="space-y-2">
              {referees?.map(referee => (
                <div key={referee.user_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{referee.username}</span>
                  {referee.email && (
                    <span className="text-sm text-gray-600">{referee.email}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Players Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Spelers
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={invalidatePlayerCache}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {playerError ? (
            <p className="text-red-600">Fout bij laden spelers</p>
          ) : (
            <div className="space-y-4">
              {/* All Players */}
              <div>
                <h4 className="font-semibold mb-2">Alle Spelers ({players?.length || 0})</h4>
                <div className="space-y-1">
                  {players?.slice(0, 5).map(player => (
                    <div key={player.player_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{player.first_name} {player.last_name}</span>
                      <span className="text-sm text-gray-600">Team {player.team_id}</span>
                    </div>
                  ))}
                  {players && players.length > 5 && (
                    <p className="text-sm text-gray-600">... en {players.length - 5} meer</p>
                  )}
                </div>
              </div>

              {/* Team Players */}
              <div>
                <h4 className="font-semibold mb-2">Team Spelers</h4>
                <Select value={selectedTeamId.toString()} onValueChange={(value) => setSelectedTeamId(Number(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Team 1</SelectItem>
                    <SelectItem value="2">Team 2</SelectItem>
                    <SelectItem value="3">Team 3</SelectItem>
                  </SelectContent>
                </Select>
                
                {loadingTeamPlayers ? (
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-1 mt-2">
                    {teamPlayers?.map(player => (
                      <div key={player.player_id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span>{player.first_name} {player.last_name}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(player.birth_date).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Info */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Voordelen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>Caching:</strong> Data wordt 5-10 minuten gecached</p>
            <p>✅ <strong>Background updates:</strong> Automatische refresh bij reconnect</p>
            <p>✅ <strong>Optimistic UI:</strong> Snelle feedback bij acties</p>
            <p>✅ <strong>Error handling:</strong> Robuuste error recovery</p>
            <p>✅ <strong>Type safety:</strong> Volledige TypeScript ondersteuning</p>
            <p>✅ <strong>Backward compatibility:</strong> Originele service functies behouden</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedServicesExample; 