import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Shield, Users, Trophy, Award, Phone, 
  AlertCircle, MapPin, Palette, Calendar
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Loading skeleton
const ProfileSkeleton = memo(() => (
  <div className="space-y-6 animate-slide-up">
    <PageHeader title="Profiel" />
    
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
));

// Error component
const ProfileError = memo(() => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Profiel" />
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Fout bij laden</h3>
            <p className="text-muted-foreground mb-6">
              Kon profielgegevens niet laden
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Terug
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Role badge component
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    admin: { label: "Administrator", variant: "default" },
    player_manager: { label: "Team Manager", variant: "secondary" },
    referee: { label: "Scheidsrechter", variant: "outline" },
  };

  const config = roleConfig[role.toLowerCase()] || { label: role, variant: "outline" as const };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};

// Team card component
const TeamCard: React.FC<{
  team: {
    team_id: number;
    team_name: string;
    club_colors?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  };
}> = memo(({ team }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/teams`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
              team.club_colors ? "" : "bg-primary"
            )} style={team.club_colors ? { backgroundColor: team.club_colors } : {}}>
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{team.team_name}</CardTitle>
              {team.club_colors && (
                <div className="flex items-center gap-2 mt-1">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{team.club_colors}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {team.contact_person && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{team.contact_person}</span>
          </div>
        )}
        {team.contact_email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`mailto:${team.contact_email}`}
              className="text-primary hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {team.contact_email}
            </a>
          </div>
        )}
        {team.contact_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`tel:${team.contact_phone}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {team.contact_phone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TeamCard.displayName = 'TeamCard';

// Main profile page component
const UserProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { profileData, isLoading, error } = useUserProfile();
  const navigate = useNavigate();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Only show error for real errors, not missing data
  // profileData should always exist now (fallback to auth user)
  if (error && !profileData) {
    return <ProfileError />;
  }

  // profileData should always be available now (has fallback)
  if (!profileData) {
    // This should not happen, but just in case
    return <ProfileSkeleton />;
  }

  const { user, teams } = profileData;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Mijn Profiel" />

      {/* User Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-bold mb-2">{user.username}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={user.role} />
                {teams.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.email ? (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <a 
                href={`mailto:${user.email}`}
                className="text-primary hover:underline truncate"
              >
                {user.email}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground italic">Geen e-mailadres beschikbaar</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Section */}
      {teams.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <Users className="h-5 w-5" />
              Mijn Teams
            </h2>
            <Badge variant="outline">{teams.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.team_id} team={team} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <Users className="h-5 w-5" />
              Mijn Teams
            </h2>
          </div>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="text-center py-3">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Geen Teams</h3>
                <p className="text-muted-foreground">
                  Je bent momenteel niet gekoppeld aan een team.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snelle Acties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.role === 'player_manager' && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/admin/players')}
            >
              <Users className="h-4 w-4 mr-2" />
              Spelers Beheren
            </Button>
          )}
          {user.role === 'admin' && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/users')}
              >
                <User className="h-4 w-4 mr-2" />
                Gebruikers Beheren
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/settings')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Instellingen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(UserProfilePage);

