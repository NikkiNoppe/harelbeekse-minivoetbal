import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Mail, Phone, Palette, Clock } from "lucide-react";
import { useTeams, usePublicTeams } from "@/hooks/useTeams";
import { useAuth } from "@/components/pages/login/AuthProvider";
import { TeamCardSkeleton } from "@/components/ui/skeleton";

const TeamsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Use different hooks based on authentication status
  const { 
    data: authenticatedTeams, 
    isLoading: authLoading, 
    error: authError, 
    refetch: authRefetch 
  } = useTeams();
  
  const { 
    data: publicTeams, 
    isLoading: publicLoading, 
    error: publicError, 
    refetch: publicRefetch 
  } = usePublicTeams();
  
  // Select appropriate data based on authentication
  const teams = isAuthenticated ? authenticatedTeams : publicTeams;
  const isLoading = isAuthenticated ? authLoading : publicLoading;
  const error = isAuthenticated ? authError : publicError;
  const refetch = isAuthenticated ? authRefetch : publicRefetch;

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="team-skeleton">
      {[...Array(6)].map((_, i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </div>
  );

  const ErrorState = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <h3 className="font-semibold">Fout bij laden</h3>
        </div>
        <p className="text-sm text-red-500 mb-4">{error?.message || 'Er is een fout opgetreden bij het laden van teams'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Opnieuw proberen
        </button>
      </CardContent>
    </Card>
  );

  const TeamCard = React.memo(({ team }: { team: any }) => {
    const showFullDetails = isAuthenticated && (team.contact_person || team.contact_email || team.contact_phone || team.club_colors || team.preferred_play_moments);
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary bg-gradient-to-r from-background to-primary/5 hover:border-l-primary/80">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Team Name Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                {team.team_name}
              </h3>
              {team.club_colors && (
                <div 
                  className="w-4 h-4 rounded-full border border-border flex-shrink-0" 
                  style={{ backgroundColor: team.club_colors }}
                  title={`Clubkleuren: ${team.club_colors}`}
                />
              )}
            </div>

            {/* Team Info */}
            {showFullDetails ? (
              <div className="space-y-2">
                {team.contact_person && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Contactpersoon: {team.contact_person}</span>
                  </div>
                )}
                
                {team.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{team.contact_email}</span>
                  </div>
                )}
                
                {team.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{team.contact_phone}</span>
                  </div>
                )}
                
                {team.preferred_play_moments?.days && team.preferred_play_moments.days.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Voorkeur: {team.preferred_play_moments.days.join(', ')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="italic">
                    {isAuthenticated ? 'Geen aanvullende gegevens beschikbaar' : 'Log in voor contactgegevens'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  TeamCard.displayName = 'TeamCard';

  const Header = () => (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Teams
        </h2>
        {isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-1">
            Volledige teamgegevens beschikbaar
          </p>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      
      <section>
        {!teams || teams.length === 0 ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Geen teams gevonden</h3>
              <p className="text-muted-foreground">Er zijn momenteel geen teams geregistreerd.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.team_id} team={team} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamsPage; 