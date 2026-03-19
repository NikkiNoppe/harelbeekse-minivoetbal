import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Shield, Users, Trophy, Award, Phone, 
  AlertCircle, MapPin, Calendar, Clock, ArrowRight,
  CheckCircle, Lock, Edit2, Save, X, Loader2, ChevronDown, History,
  Wallet, MessageSquare, TrendingDown, CreditCard, Download, FileSpreadsheet, FileJson
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageHeader } from "@/components/layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { useRefereeMatches } from "@/hooks/useRefereeMatches";
import { formatDateWithDay, formatTimeForDisplay, isoToLocalDateTime } from "@/lib/dateUtils";
import { shouldAutoLockMatch } from "@/lib/matchLockUtils";
import MatchesCard from "@/components/pages/admin/matches/components/MatchesCard";
import { WedstrijdformulierModal } from "@/components/modals/matches/wedstrijdformulier-modal";
import { MatchFormData } from "@/components/pages/admin/matches/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamModal } from "@/components/modals";
import { useToast } from "@/hooks/use-toast";
import { teamService } from "@/services/core";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { withUserContext } from "@/lib/supabaseUtils";
import { supabase } from "@/integrations/supabase/client";
import RefereeNotesCard from "./RefereeNotesCard";
import { useTeamPlayerStats, type PlayerStat } from "@/hooks/useTeamPlayerStats";

// Loading skeleton
const ProfileSkeleton = memo(() => (
  <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
    <PageHeader title="Profiel" />
    
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 sm:h-7 w-32 sm:w-48" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
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

// Helper function to parse multiple colors from a string
// Supports formats like: "name-#HEX1-#HEX2", "#FF0000-#FFFFFF", "rood-wit", "#FF0000, #FFFFFF"
const parseColors = (colorString: string): string[] => {
  if (!colorString) return [];
  
  // Helper to convert hex/rgb to hex
  const getHexFromColor = (color: string): string => {
    if (color.startsWith('#')) {
      return color;
    }
    if (color.startsWith('rgb')) {
      const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
      if (!result) return '#000000';
      const r = parseInt(result[1], 10);
      const g = parseInt(result[2], 10);
      const b = parseInt(result[3], 10);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#000000';
  };
  
  // Check if it's the new format: "name-#HEX1-#HEX2" or "name-#HEX1"
  // Extract only hex colors (parts starting with #)
  const parts = colorString.split('-').map(p => p.trim()).filter(p => p.length > 0);
  const hexColors = parts.filter(part => part.startsWith('#') || /^#[0-9A-Fa-f]{6}$/i.test(part));
  
  // If we found hex colors in the new format, return only those
  if (hexColors.length > 0) {
    return hexColors.map(color => {
      // Ensure it starts with #
      if (color.startsWith('#')) {
        return color;
      }
      // If it's a 6-digit hex without #, add it
      if (/^[0-9A-Fa-f]{6}$/i.test(color)) {
        return `#${color}`;
      }
      return getHexFromColor(color);
    }).filter(c => c && c.length > 0);
  }
  
  // Fallback to old format parsing
  // Try to split by common separators
  const separators = ['-', ',', ' ', '/'];
  let colors: string[] = [];
  
  for (const sep of separators) {
    if (colorString.includes(sep)) {
      colors = colorString.split(sep).map(c => c.trim()).filter(c => c.length > 0);
      if (colors.length > 1) break;
    }
  }
  
  // If no separator found, return single color
  if (colors.length === 0) {
    colors = [colorString.trim()];
  }
  
  // Convert all to hex format for display, but filter out non-hex parts
  return colors.map(color => {
    // If it's already hex or rgb, use it
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return getHexFromColor(color);
    }
    // Try to parse as hex (might be missing #)
    if (/^[0-9A-Fa-f]{6}$/i.test(color)) {
      return `#${color}`;
    }
    // Skip non-hex color names in the new format
    // Only return if it's a valid hex/rgb color
    return null;
  }).filter((c): c is string => c !== null && c.length > 0);
};

// Helper function to get color style for display (supports multiple colors)
const getColorStyle = (clubColors: string | null | undefined): React.CSSProperties => {
  if (!clubColors) return {};
  const colors = parseColors(clubColors);
  if (colors.length === 0) return {};
  if (colors.length === 1) {
    return { backgroundColor: colors[0] };
  }
  // Multiple colors: use gradient (diagonal split) for background elements
  return {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 50%, ${colors[1]} 50%, ${colors[1]} 100%)`
  };
};

// Component to render color preview with support for multiple colors
const ColorPreview: React.FC<{ 
  clubColors: string | null | undefined; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ clubColors, size = 'md', className = '' }) => {
  // Use useMemo to ensure colors are recalculated when clubColors changes
  const colors = useMemo(() => parseColors(clubColors || ''), [clubColors]);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  if (colors.length === 0) {
    return (
      <div className={cn("rounded-full border border-primary/30 shadow-sm bg-muted", sizeClasses[size], className)} />
    );
  }
  
  if (colors.length === 1) {
    return (
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", sizeClasses[size], className)}
        style={{ backgroundColor: colors[0] }}
      />
    );
  }
  
  // Multiple colors: show as two circles side by side
  const circleSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12';
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", circleSize)}
        style={{ backgroundColor: colors[0] }}
      />
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", circleSize)}
        style={{ backgroundColor: colors[1] }}
      />
    </div>
  );
};

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

// Sort options for player stats
type PlayerSortOption = 'name' | 'matches' | 'cards';

const sortLabels: Record<PlayerSortOption, string> = {
  name: 'Naam',
  matches: 'Wedstrijden',
  cards: 'Kaarten',
};

const sortPlayers = (players: PlayerStat[], sortBy: PlayerSortOption): PlayerStat[] => {
  return [...players].sort((a, b) => {
    switch (sortBy) {
      case 'matches':
        return b.matchCount - a.matchCount || a.last_name.localeCompare(b.last_name);
      case 'cards':
        // Red first, then most yellows, then name
        if (b.redCards !== a.redCards) return b.redCards - a.redCards;
        if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
        return a.last_name.localeCompare(b.last_name);
      case 'name':
      default:
        return a.last_name.localeCompare(b.last_name);
    }
  });
};

// Team Players Overview Content (without Card wrapper, for use inside collapsible)
const TeamPlayersOverviewContent: React.FC<{ teamId: number }> = memo(({ teamId }) => {
  const { data: players, isLoading } = useTeamPlayerStats(teamId);
  const [sortBy, setSortBy] = useState<PlayerSortOption>('name');

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return sortPlayers(players, sortBy);
  }, [players, sortBy]);

  if (isLoading) {
    return (
      <CardContent className="pt-0 space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    );
  }

  if (!players || players.length === 0) {
    return (
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground italic">Geen spelers gevonden</p>
      </CardContent>
    );
  }

  return (
    <CardContent className="pt-0">
      {/* Sort + count row */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="text-xs">{players.length} spelers</Badge>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sorteer:</span>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as PlayerSortOption)}>
            <SelectTrigger className="h-7 min-h-[32px] w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Naam</SelectItem>
              <SelectItem value="matches">Wedstrijden</SelectItem>
              <SelectItem value="cards">Kaarten</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {sortedPlayers.map((player) => (
          <div
            key={player.player_id}
            className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm font-medium text-foreground truncate mr-3">
              {player.last_name}, {player.first_name}
            </span>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Yellow cards */}
              {player.yellowCards > 0 && (
                <span className="flex items-center gap-1 text-xs" title="Gele kaarten">
                  <span className="w-3 h-4 rounded-[2px] bg-yellow-400 inline-block" />
                  <span className="font-medium text-foreground">{player.yellowCards}</span>
                </span>
              )}
              {/* Red cards */}
              {player.redCards > 0 && (
                <span className="flex items-center gap-1 text-xs" title="Rode kaarten">
                  <span className="w-3 h-4 rounded-[2px] bg-red-500 inline-block" />
                  <span className="font-medium text-foreground">{player.redCards}</span>
                </span>
              )}
              {/* Match count */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Wedstrijden">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-medium">{player.matchCount}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
});
TeamPlayersOverviewContent.displayName = 'TeamPlayersOverviewContent';
// Combined User & Team Info Card Component
const UserTeamInfoCard: React.FC<{
  user: {
    username: string;
    role: string;
    email?: string;
  };
  team: {
    team_id: number;
    team_name: string;
    club_colors?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  } | null;
  onTeamUpdate?: () => void;
}> = memo(({ user, team, onTeamUpdate }) => {
  // Debug: log when component receives new team data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 UserTeamInfoCard received team update:', {
        team_id: team?.team_id,
        club_colors: team?.club_colors,
        contact_person: team?.contact_person
      });
    }
  }, [team?.team_id, team?.club_colors, team?.contact_person, team?.contact_email, team?.contact_phone]);
  const { user: authUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: team?.team_name || '',
    contact_person: team?.contact_person || '',
    contact_email: team?.contact_email || '',
    contact_phone: team?.contact_phone || '',
    club_colors: team?.club_colors || '',
  });
  const formDataRef = useRef(formData);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Keep ref in sync with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Sync form data when team prop changes
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.team_name || '',
        contact_person: team.contact_person || '',
        contact_email: team.contact_email || '',
        contact_phone: team.contact_phone || '',
        club_colors: team.club_colors || '',
      });
    }
  }, [team?.team_name, team?.club_colors, team?.contact_person, team?.contact_email, team?.contact_phone]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (team) {
      // Update formData and ref immediately before opening modal
      const newFormData = {
        name: team.team_name || '',
        contact_person: team.contact_person || '',
        contact_email: team.contact_email || '',
        contact_phone: team.contact_phone || '',
        club_colors: team.club_colors || '',
      };
      setFormData(newFormData);
      formDataRef.current = newFormData; // Update ref immediately
      setIsEditModalOpen(true);
    }
  };

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      formDataRef.current = updated; // Update ref immediately
      return updated;
    });
  }, []);

  const handleSave = async () => {
    if (!team) return;
    
    setIsSaving(true);
    try {
      // Use ref to get the latest formData value, as state updates might be batched
      const currentFormData = formDataRef.current;
      
      const updated = await withUserContext(
        async () => {
          return await teamService.updateTeam(team.team_id, {
            contact_person: currentFormData.contact_person?.trim() || null,
            contact_email: currentFormData.contact_email?.trim() || null,
            contact_phone: currentFormData.contact_phone?.trim() || null,
            club_colors: currentFormData.club_colors || null,
          });
        },
        {
          userId: authUser?.id,
          role: authUser?.role,
          teamIds: String(team.team_id)
        }
      );

      if (updated) {
        toast({
          title: "Succesvol opgeslagen",
          description: "Team gegevens zijn bijgewerkt.",
        });
        setIsEditModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        queryClient.refetchQueries({ queryKey: ['userProfile'] });
        if (onTeamUpdate) onTeamUpdate();
      } else {
        throw new Error('Update returned null');
      }
    } catch (error: any) {
      console.error('❌ Error updating team:', error);
      const errorMessage = error?.message || 'Onbekende fout';
      const errorDetails = error?.details || error?.hint || '';
      
      toast({
        title: "Fout",
        description: errorDetails 
          ? `Kon team gegevens niet bijwerken: ${errorMessage} (${errorDetails})`
          : `Kon team gegevens niet bijwerken: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = useCallback(async () => {
    if (isDownloadingBackup) return;
    setIsDownloadingBackup(true);
    
    try {
      const tables = ['teams', 'players', 'matches', 'users', 'team_users', 'competition_standings', 'costs', 'team_costs', 'application_settings', 'referee_assignments', 'referee_availability', 'monthly_polls', 'poll_match_dates'] as const;
      const backup: Record<string, any[]> = {};
      
      for (const table of tables) {
        let allRows: any[] = [];
        let from = 0;
        const batchSize = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(from, from + batchSize - 1);
          
          if (error) {
            console.error(`Error fetching ${table}:`, error);
            break;
          }
          if (!data || data.length === 0) break;
          allRows = allRows.concat(data);
          if (data.length < batchSize) break;
          from += batchSize;
        }
        
        backup[table] = allRows;
      }
      
      // Add metadata
      const backupData = {
        _metadata: {
          created_at: new Date().toISOString(),
          tables: Object.keys(backup),
          row_counts: Object.fromEntries(Object.entries(backup).map(([k, v]) => [k, v.length]))
        },
        ...backup
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Delay cleanup to give the browser time to start the download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      
      toast({
        title: "Backup gedownload",
        description: `${Object.values(backup).reduce((sum, rows) => sum + rows.length, 0)} rijen uit ${tables.length} tabellen.`,
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Fout",
        description: "Kon backup niet downloaden.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingBackup(false);
    }
  }, [isDownloadingBackup, toast]);

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 truncate">
                  {user.username}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* DB backup button - Admin only */}
              {authUser?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "border-[var(--color-300)]",
                    "bg-white hover:bg-muted/50 hover:border-[var(--color-400)]",
                    "text-muted-foreground hover:text-foreground",
                    "transition-colors duration-150"
                  )}
                  style={{ 
                    height: '32px',
                    width: '32px',
                    minHeight: '32px',
                    maxHeight: '32px',
                    minWidth: '32px',
                    maxWidth: '32px'
                  }}
                  onClick={handleDownloadBackup}
                  disabled={isDownloadingBackup}
                  title="Database backup downloaden"
                  aria-label="Database backup downloaden"
                >
                  {isDownloadingBackup ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </Button>
              )}
              {/* Edit button for team managers */}
              {team && user.role === 'player_manager' && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "border-[var(--color-300)]",
                    "bg-white hover:bg-purple-50 hover:border-[var(--color-400)]",
                    "text-[var(--color-700)] hover:text-[var(--color-900)]",
                    "transition-colors duration-150"
                  )}
                  style={{ 
                    color: 'var(--accent)',
                    height: '32px',
                    width: '32px',
                    minHeight: '32px',
                    maxHeight: '32px',
                    minWidth: '32px',
                    maxWidth: '32px'
                  }}
                  onClick={handleEditClick}
                  title="Team gegevens bewerken"
                  aria-label="Team gegevens bewerken"
                >
                  <Edit2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
          {/* User Email Section */}
          <div className="pb-4 border-b border-primary/20">
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              {user.email ? (
                <a 
                  href={`mailto:${user.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {user.email}
                </a>
              ) : (
                <span className="text-muted-foreground italic">Geen e-mailadres beschikbaar</span>
              )}
            </div>
          </div>

          {/* Team Info Section */}
          {/* For admins: only show team section if they have a team */}
          {/* For non-admins: show team section or "Geen team gekoppeld" message */}
          {user.role === 'admin' ? (
            // Admin: only show if team exists
            team ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {team.team_name}
                  </h3>
                  {team.club_colors && (
                    <ColorPreview 
                      clubColors={team.club_colors}
                      size="sm"
                      className="rounded-full"
                    />
                  )}
                </div>
                
                <div className="space-y-2.5">
                  {team.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{team.contact_person}</span>
                    </div>
                  )}
                  {team.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`mailto:${team.contact_email}`}
                        className="text-primary hover:underline truncate"
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
                      >
                        {team.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : null // Admin without team: show nothing
          ) : (
            // Non-admin: show team info or "Geen team gekoppeld" message
            team ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {team.team_name}
                  </h3>
                  {team.club_colors && (
                    <ColorPreview 
                      clubColors={team.club_colors}
                      size="sm"
                      className="rounded-full"
                    />
                  )}
                </div>
                
                <div className="space-y-2.5">
                  {team.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{team.contact_person}</span>
                    </div>
                  )}
                  {team.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`mailto:${team.contact_email}`}
                        className="text-primary hover:underline truncate"
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
                      >
                        {team.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Only show "Geen team gekoppeld" for team managers without a team
              // Admins and referees don't need to see this message
              user.role === 'player_manager' && (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Geen team gekoppeld
                  </p>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      {/* Edit Team Modal */}
      {team && (
        <TeamModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          editingTeam={team}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSave}
          loading={isSaving}
          hideTeamName={true}
          hidePreferences={true}
        />
      )}
    </>
  );
});

// Custom comparison function for memo to ensure re-render when team data changes
const areTeamInfoEqual = (
  prevProps: {
    user: { username: string; role: string; email?: string };
    team: { team_id: number; team_name: string; club_colors?: string; contact_person?: string; contact_email?: string; contact_phone?: string } | null;
    onTeamUpdate?: () => void;
  },
  nextProps: {
    user: { username: string; role: string; email?: string };
    team: { team_id: number; team_name: string; club_colors?: string; contact_person?: string; contact_email?: string; contact_phone?: string } | null;
    onTeamUpdate?: () => void;
  }
): boolean => {
  // Compare user
  if (prevProps.user.username !== nextProps.user.username ||
      prevProps.user.role !== nextProps.user.role ||
      prevProps.user.email !== nextProps.user.email) {
    return false;
  }
  
  // Compare team - check all relevant fields, especially club_colors
  if (prevProps.team?.team_id !== nextProps.team?.team_id ||
      prevProps.team?.team_name !== nextProps.team?.team_name ||
      prevProps.team?.club_colors !== nextProps.team?.club_colors ||
      prevProps.team?.contact_person !== nextProps.team?.contact_person ||
      prevProps.team?.contact_email !== nextProps.team?.contact_email ||
      prevProps.team?.contact_phone !== nextProps.team?.contact_phone) {
    return false;
  }
  
  // If both are null, they're equal
  if (prevProps.team === null && nextProps.team === null) {
    return true;
  }
  
  // If one is null and the other isn't, they're not equal
  if (prevProps.team === null || nextProps.team === null) {
    return false;
  }
  
  return true;
};

// Create memoized version with custom comparison
const MemoizedUserTeamInfoCard = memo(UserTeamInfoCard, areTeamInfoEqual);
MemoizedUserTeamInfoCard.displayName = 'MemoizedUserTeamInfoCard';

UserTeamInfoCard.displayName = 'UserTeamInfoCard';

// Next Match Card Component - Wrapper with title
const NextMatchCard: React.FC<{
  match: {
    match_id: number;
    match_date: string;
    opponent_name: string;
    home_team_name?: string;
    away_team_name?: string;
    is_home: boolean;
    speeldag?: string;
    location?: string;
    unique_number?: string;
    is_locked?: boolean;
    is_submitted?: boolean;
    home_team_id: number;
    away_team_id: number;
    home_players?: any[];
    away_players?: any[];
    home_score?: number | null;
    away_score?: number | null;
    referee?: string;
    referee_notes?: string;
  };
  teamName: string;
  onSelectMatch: (match: MatchFormData) => void;
}> = memo(({ match, teamName, onSelectMatch }) => {
  // Determine home and away team names
  const homeTeam = match.is_home ? teamName : (match.opponent_name || match.away_team_name || '');
  const awayTeam = match.is_home ? (match.opponent_name || match.away_team_name || '') : teamName;
  
  // Convert ISO date to local date/time format (same as league page)
  const { date, time } = isoToLocalDateTime(match.match_date);
  
  // Determine match status (same logic as league page)
  const getMatchStatus = () => {
    if (match.is_submitted) {
      return { label: "Gespeeld", color: "bg-green-500", icon: CheckCircle };
    }
    
    const isAutoLocked = shouldAutoLockMatch(date, time);
    
    if (match.is_locked || isAutoLocked) {
      return { label: "Gesloten", color: "bg-red-400", icon: Lock };
    }
    
    return { label: "Open", color: "bg-muted", icon: Clock };
  };
  
  const status = getMatchStatus();
  const StatusIcon = status.icon;
  
  // Convert to MatchFormData and open modal
  const handleClick = useCallback(() => {
    const matchFormData: MatchFormData = {
      matchId: match.match_id,
      uniqueNumber: match.unique_number || '',
      date,
      time,
      homeTeamId: match.home_team_id,
      homeTeamName: homeTeam,
      awayTeamId: match.away_team_id,
      awayTeamName: awayTeam,
      location: match.location || 'Te bepalen',
      matchday: match.speeldag || 'Te bepalen',
      isCompleted: !!match.is_submitted,
      isLocked: !!(match.is_locked || shouldAutoLockMatch(date, time)),
      homeScore: match.home_score ?? undefined,
      awayScore: match.away_score ?? undefined,
      referee: match.referee ?? undefined,
      refereeNotes: match.referee_notes ?? undefined,
      homePlayers: match.home_players || [],
      awayPlayers: match.away_players || [],
    };
    onSelectMatch(matchFormData);
  }, [match, homeTeam, awayTeam, date, time, onSelectMatch]);
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Eerstvolgende Wedstrijd
        </h2>
      </div>
      
      <button
        onClick={handleClick}
        className="border-none bg-transparent p-0 transition-all duration-200 text-left w-full group hover:shadow-none hover:border-none hover:bg-transparent cursor-pointer"
      >
        <MatchesCard
          id={undefined}
          home={homeTeam}
          away={awayTeam}
          homeScore={undefined}
          awayScore={undefined}
          date={match.match_date}
          time={time}
          location={match.location || 'Te bepalen'}
          status={undefined}
          badgeSlot={
            <span className="ml-auto flex items-center gap-2">
              {match.unique_number && (
                <span className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 rounded">
                  {match.unique_number}
                </span>
              )}
              <span 
                className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm rounded flex items-center gap-1`}
                style={status.label === "Open" ? { backgroundColor: 'var(--accent)' } : undefined}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </span>
            </span>
          }
        />
      </button>
    </div>
  );
});
NextMatchCard.displayName = 'NextMatchCard';

// Financial Overview Card - Detailed breakdown for team managers
const FinancialOverviewCard: React.FC<{ teamId: number }> = memo(({ teamId }) => {
  const { user } = useAuth();
  
  // Fetch balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['teamBalanceProfile', teamId],
    queryFn: async () => {
      return await withUserContext(async () => {
        const { data, error } = await supabase.rpc('calculate_team_balance_updated', {
          team_id_param: teamId
        });
        if (error) throw error;
        return data as number;
      }, {
        userId: user?.id as number,
        role: user?.role,
        teamIds: String(teamId),
      });
    },
    enabled: !!user && !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch transaction breakdown
  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['teamFinancialBreakdown', teamId],
    queryFn: async () => {
      return await withUserContext(async () => {
        const { data, error } = await supabase
          .from('team_costs')
          .select('amount, cost_setting_id, costs(name, category)')
          .eq('team_id', teamId);
        if (error) throw error;
        
        const transactions = data || [];
        let matchCount = 0;
        let fieldCosts = 0;
        let adminCosts = 0;
        let refereeCosts = 0;
        let fines = 0;
        let deposits = 0;

        transactions.forEach((t: any) => {
          const amount = Number(t.amount != null ? t.amount : ((t.costs as any)?.amount ?? 0));
          const category = t.costs?.category || '';
          const name = (t.costs?.name || '').toLowerCase();

          if (category === 'deposit') {
            deposits += amount;
          } else if (category === 'penalty') {
            fines += Math.abs(amount);
          } else if (category === 'match_cost') {
            if (name.includes('veld')) {
              fieldCosts += Math.abs(amount);
              matchCount++;
            } else if (name.includes('administratie')) {
              adminCosts += Math.abs(amount);
            } else if (name.includes('scheidsrechter')) {
              refereeCosts += Math.abs(amount);
            } else {
              fieldCosts += Math.abs(amount);
            }
          }
        });

        // Match count = field cost entries (one per match played as home)
        return { matchCount, fieldCosts, adminCosts, refereeCosts, fines, deposits };
      }, {
        userId: user?.id as number,
        role: user?.role,
        teamIds: String(teamId),
      });
    },
    enabled: !!user && !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  const balance = balanceData ?? 0;
  const isNegative = balance < 0;
  const isLoading = balanceLoading || breakdownLoading;
  const fmt = (n: number) => `€${n.toFixed(2)}`;

  return (
    <CardContent className="pt-0">
      {isLoading ? (
        <div className="py-4 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Balance hero */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-muted-foreground">Huidig saldo</span>
            <span className={cn(
              "text-xl font-bold tabular-nums",
              isNegative ? "text-destructive" : "text-green-600"
            )}>
              {isNegative ? '−' : ''}€{Math.abs(balance).toFixed(2)}
            </span>
          </div>

          {/* Compact breakdown grid */}
          {breakdown && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-border/50 pt-2.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wedstrijden</span>
                <span className="font-medium tabular-nums text-foreground">{breakdown.matchCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boetes</span>
                <span className="font-medium tabular-nums text-destructive/80">{fmt(breakdown.fines)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Veldkosten</span>
                <span className="font-medium tabular-nums text-foreground">{fmt(breakdown.fieldCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheidsrechter</span>
                <span className="font-medium tabular-nums text-foreground">{fmt(breakdown.refereeCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Administratie</span>
                <span className="font-medium tabular-nums text-foreground">{fmt(breakdown.adminCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stortingen</span>
                <span className="font-medium tabular-nums text-green-600">{fmt(breakdown.deposits)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </CardContent>
  );
});
FinancialOverviewCard.displayName = 'FinancialOverviewCard';

// Admin Message Card Content (without Card wrapper, for use inside collapsible)
const AdminMessageCardContent: React.FC = memo(() => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useQuery({
    queryKey: ['adminMessages', user?.role, user?.id],
    queryFn: async () => {
      const result = await withUserContext(async () => {
        const { data, error } = await supabase
          .from('application_settings')
          .select('setting_value, updated_at')
          .eq('setting_category', 'admin_messages')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(20);
        if (error) return [];
        return data || [];
      }, {
        userId: user?.id as number,
        role: user?.role,
        teamIds: user?.teamId ? String(user.teamId) : '',
      });
      return result;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Client-side filtering based on targeting + date range
  const filteredMessages = useMemo(() => {
    if (!messages || !user) return [];
    const now = new Date();
    
    return messages.filter((msg: any) => {
      const sv = msg.setting_value;
      if (!sv) return false;
      
      // Date range check
      if (sv.start_date && new Date(sv.start_date) > now) return false;
      if (sv.end_date && new Date(sv.end_date) < now) return false;
      
      // Targeting check
      const targetUsers = Array.isArray(sv.target_users) ? sv.target_users : [];
      const targetRoles = Array.isArray(sv.target_roles) ? sv.target_roles : [];
      
      // If specific users are targeted, check if current user is in the list
      if (targetUsers.length > 0) {
        return targetUsers.includes(user.id);
      }
      
      // If roles are targeted, check if current user's role matches
      if (targetRoles.length > 0) {
        return targetRoles.includes(user.role?.toLowerCase());
      }
      
      // No targeting = show to everyone (backwards compat)
      return true;
    });
  }, [messages, user]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30';
      case 'warning': return 'bg-[var(--color-700)]/10 border-[var(--color-700)]/30';
      case 'error': return 'bg-[hsl(var(--destructive))]/10 border-[hsl(var(--destructive))]/30';
      default: return 'bg-[var(--color-500)]/10 border-[var(--color-500)]/30';
    }
  };

  const getTypeAccent = (type: string) => {
    switch (type) {
      case 'success': return 'bg-[hsl(var(--success))]';
      case 'warning': return 'bg-[var(--color-700)]';
      case 'error': return 'bg-[hsl(var(--destructive))]';
      default: return 'bg-[var(--color-500)]';
    }
  };

  return (
    <CardContent className="pt-0">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : filteredMessages.length > 0 ? (
        <div className="space-y-2">
          {filteredMessages.map((msg: any, i: number) => {
            const sv = msg.setting_value;
            const type = sv?.type || 'info';
            return (
              <div key={i} className={cn(
                "p-3 rounded-lg border relative overflow-hidden",
                getTypeStyle(type)
              )}>
                {/* Left accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", getTypeAccent(type))} />
                <div className="pl-3">
                  {sv?.title && (
                    <p className="text-sm font-semibold text-foreground mb-0.5">{sv.title}</p>
                  )}
                  <p className="text-sm text-foreground">
                    {sv?.message || 'Bericht'}
                  </p>
                  {msg.updated_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.updated_at).toLocaleDateString('nl-BE')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-2">Geen berichten</p>
      )}
    </CardContent>
  );
});
AdminMessageCardContent.displayName = 'AdminMessageCardContent';

// Referee Upcoming Matches Component
const RefereeUpcomingMatches: React.FC<{
  refereeUsername: string;
  onSelectMatch: (match: MatchFormData) => void;
}> = memo(({ refereeUsername, onSelectMatch }) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Calculate next month and year
  const nextMonthDate = new Date(currentYear, currentMonth, 1); // Next month
  const nextMonth = nextMonthDate.getMonth() + 1;
  const nextMonthYear = nextMonthDate.getFullYear();
  
  // State for selected month (default to current month)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  // Update selected month/year when current month changes (e.g., when month rolls over)
  // This ensures that when we move to a new month, the available options update automatically
  // Remove auto-switch to current month - allow viewing past months
  
  const { data: refereeMatches, isLoading: matchesLoading } = useRefereeMatches(
    refereeUsername,
    selectedMonth,
    selectedYear
  );

  // Get month names in Dutch
  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  // Season runs Sep-Jun: generate months from Sep of season start to next month
  const availableMonths = useMemo(() => {
    const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
    const months: { month: number; year: number; label: string }[] = [];
    
    // Start from September of the season
    let m = 9;
    let y = seasonStartYear;
    
    // End at next month from now
    const endMonth = nextMonth;
    const endYear = nextMonthYear;
    
    while (y < endYear || (y === endYear && m <= endMonth)) {
      months.push({ month: m, year: y, label: `${monthNames[m - 1]} ${y}` });
      m++;
      if (m > 12) { m = 1; y++; }
    }
    
    return months;
  }, [currentMonth, currentYear, nextMonth, nextMonthYear]);

  // Convert referee match to MatchFormData
  const convertToMatchFormData = useCallback((match: any): MatchFormData => {
    const { date, time } = isoToLocalDateTime(match.match_date);
    return {
      matchId: match.match_id,
      uniqueNumber: match.unique_number || '',
      date,
      time,
      homeTeamId: match.home_team_id,
      homeTeamName: match.home_team_name || 'Onbekend',
      awayTeamId: match.away_team_id,
      awayTeamName: match.away_team_name || 'Onbekend',
      location: match.location || 'Te bepalen',
      matchday: match.speeldag || 'Te bepalen',
      isCompleted: !!(match.home_score !== null && match.away_score !== null && match.is_submitted),
      isLocked: !!(match.is_locked || shouldAutoLockMatch(date, time)),
      homeScore: match.home_score,
      awayScore: match.away_score,
      referee: match.referee,
      refereeNotes: match.referee_notes,
      homePlayers: [],
      awayPlayers: [],
    };
  }, []);

  // Determine match status
  const getMatchStatus = useCallback((match: any) => {
    const { date, time } = isoToLocalDateTime(match.match_date);
    if (match.is_submitted) {
      return { label: "Gespeeld", color: "bg-green-500", icon: CheckCircle };
    }
    const isAutoLocked = shouldAutoLockMatch(date, time);
    if (match.is_locked || isAutoLocked) {
      return { label: "Gesloten", color: "bg-red-400", icon: Lock };
    }
    return { label: "Open", color: "bg-muted", icon: Clock };
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Komende Wedstrijden
        </h2>
        {/* Month Filter - Only current and next month */}
        <div className="flex items-center gap-2">
          <Select
            value={`${selectedMonth}-${selectedYear}`}
            onValueChange={(value) => {
              const [month, year] = value.split('-').map(Number);
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          >
            <SelectTrigger className="h-8 min-h-[44px] w-[180px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((option) => (
                <SelectItem key={`${option.month}-${option.year}`} value={`${option.month}-${option.year}`}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {matchesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : refereeMatches && refereeMatches.length > 0 ? (
        (() => {
          // Split into pending (no scores) and completed (has scores)
          const pendingMatches = refereeMatches.filter((match) => 
            match.home_score === null || match.away_score === null
          );
          const completedMatches = [...refereeMatches.filter((match) => 
            match.home_score !== null && match.away_score !== null
          )].reverse(); // Most recent first

          return (
            <div className="space-y-4">
              {/* Pending / To fill in */}
              {pendingMatches.length > 0 ? (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Te spelen / In te vullen ({pendingMatches.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingMatches.map((match) => {
                      const status = getMatchStatus(match);
                      const StatusIcon = status.icon;
                      const { date, time } = isoToLocalDateTime(match.match_date);
                      
                      return (
                        <button
                          key={match.match_id}
                          onClick={() => onSelectMatch(convertToMatchFormData(match))}
                          className="border-none bg-transparent p-0 transition-all duration-200 text-left w-full group hover:shadow-none hover:border-none hover:bg-transparent cursor-pointer"
                        >
                          <MatchesCard
                            id={undefined}
                            home={match.home_team_name || 'Onbekend'}
                            away={match.away_team_name || 'Onbekend'}
                            homeScore={match.home_score}
                            awayScore={match.away_score}
                            date={match.match_date}
                            time={time}
                            location={match.location || 'Te bepalen'}
                            status={undefined}
                            badgeSlot={
                              <span className="ml-auto flex items-center gap-2">
                                {match.unique_number && (
                                  <span className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 rounded">
                                    {match.unique_number}
                                  </span>
                                )}
                                <span 
                                  className={`${status.color} text-white text-xs px-2 py-0.5 shadow-sm rounded flex items-center gap-1`}
                                  style={status.label === "Open" ? { backgroundColor: 'var(--accent)' } : undefined}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </span>
                              </span>
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Geen openstaande wedstrijden voor {availableMonths.find(m => m.month === selectedMonth && m.year === selectedYear)?.label || `${monthNames[selectedMonth - 1]} ${selectedYear}`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Completed matches - collapsible */}
              {completedMatches.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer">
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    <History className="h-3.5 w-3.5" />
                    Afgelopen wedstrijden ({completedMatches.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pt-2">
                      {completedMatches.map((match) => {
                        const { time } = isoToLocalDateTime(match.match_date);
                        
                        return (
                          <button
                            key={match.match_id}
                            onClick={() => onSelectMatch(convertToMatchFormData(match))}
                            className="border-none bg-transparent p-0 transition-all duration-200 text-left w-full group hover:shadow-none hover:border-none hover:bg-transparent cursor-pointer opacity-80 hover:opacity-100"
                          >
                            <MatchesCard
                              id={undefined}
                              home={match.home_team_name || 'Onbekend'}
                              away={match.away_team_name || 'Onbekend'}
                              homeScore={match.home_score}
                              awayScore={match.away_score}
                              date={match.match_date}
                              time={time}
                              location={match.location || 'Te bepalen'}
                              status={undefined}
                              badgeSlot={
                                <span className="ml-auto flex items-center gap-2">
                                  {match.unique_number && (
                                    <span className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 rounded">
                                      {match.unique_number}
                                    </span>
                                  )}
                                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 shadow-sm rounded flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Gespeeld
                                  </span>
                                </span>
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          );
        })()
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Geen wedstrijden voor {availableMonths.find(m => m.month === selectedMonth && m.year === selectedYear)?.label || `${monthNames[selectedMonth - 1]} ${selectedYear}`}
                </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
RefereeUpcomingMatches.displayName = 'RefereeUpcomingMatches';

// Main profile page component
const UserProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { profileData, isLoading, error } = useUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Modal state
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get first team for upcoming matches
  const firstTeam = profileData?.teams?.[0];
  const { data: upcomingMatches, isLoading: matchesLoading } = useUpcomingMatches(
    firstTeam?.team_id || null,
    1
  );
  const nextMatch = upcomingMatches?.[0];
  
  // Handle match selection
  const handleSelectMatch = useCallback((match: MatchFormData) => {
    setSelectedMatchForm(match);
    setIsDialogOpen(true);
  }, []);
  
  // Handle dialog close
  const handleDialogClose = useCallback((shouldRefresh: boolean = false) => {
    setIsDialogOpen(false);
    setSelectedMatchForm(null);
    // Optionally refresh data if needed
    if (shouldRefresh) {
      // Could refresh upcoming matches here if needed
    }
  }, []);
  
  // Handle form complete
  const handleFormComplete = useCallback(() => {
    // Invalidate queries to refresh data after match is saved
    queryClient.invalidateQueries({ queryKey: ['upcomingMatches'] });
    queryClient.invalidateQueries({ queryKey: ['refereeMatches'] });
    queryClient.invalidateQueries({ queryKey: ['teamMatches'] });
    handleDialogClose(true);
  }, [handleDialogClose, queryClient]);
  
  const hasElevatedPermissions = authUser?.role === "admin" || authUser?.role === "referee";
  const isAdmin = authUser?.role === "admin";
  const isReferee = authUser?.role === "referee";
  const effectiveTeamId = firstTeam?.team_id || authUser?.teamId || 0;

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
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
      <PageHeader title="Mijn Profiel" />

      {/* Mobile-first layout: Stack cards vertically on mobile */}
      <div className="space-y-4 sm:space-y-6">
        {/* 1. Combined User & Team Info Card */}
        <MemoizedUserTeamInfoCard 
          user={user} 
          team={teams[0] || null}
          onTeamUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            queryClient.refetchQueries({ queryKey: ['userProfile'] });
          }}
        />

        {/* 2. Next Match Card - Team managers */}
        {firstTeam && !matchesLoading && nextMatch && (
          <NextMatchCard 
            match={nextMatch} 
            teamName={firstTeam.team_name}
            onSelectMatch={handleSelectMatch}
          />
        )}

        {/* 2b. Referee Upcoming Matches */}
        {isReferee && authUser?.username && (
          <RefereeUpcomingMatches
            refereeUsername={authUser.username}
            onSelectMatch={handleSelectMatch}
          />
        )}

        {/* 3. Team Players Overview - Collapsible */}
        {user.role === 'player_manager' && firstTeam && (
          <Collapsible>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      Gespeelde wedstrijden per speler
                    </CardTitle>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 [&[data-state=open]]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <TeamPlayersOverviewContent teamId={firstTeam.team_id} />
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* 4. Financial Overview - Collapsible */}
        {user.role === 'player_manager' && firstTeam && (
          <Collapsible>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                      Financieel Overzicht
                    </CardTitle>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FinancialOverviewCard teamId={firstTeam.team_id} />
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* 5. Admin Messages - Collapsible */}
        <Collapsible>
          <Card className="border-primary/20">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Berichten
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AdminMessageCardContent />
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Referee Notes Card - Admin only */}
        {isAdmin && <RefereeNotesCard />}

        {/* Additional Teams Section */}
        {teams.length > 1 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Overige Teams
              </h2>
              <Badge variant="outline" className="text-xs">{teams.length - 1}</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {teams.slice(1).map((team) => (
                <Card key={team.team_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative",
                        team.club_colors ? "" : "bg-primary"
                      )} style={team.club_colors ? getColorStyle(team.club_colors) : {}}>
                        <Trophy className="h-5 w-5 relative z-10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{team.team_name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {team.contact_person && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{team.contact_person}</span>
                      </div>
                    )}
                    {team.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`mailto:${team.contact_email}`}
                          className="text-primary hover:underline truncate text-xs"
                        >
                          {team.contact_email}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 6. Quick Actions - Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Snelle Acties</CardTitle>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2 pt-0">
                {user.role === 'player_manager' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm sm:text-base"
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
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => navigate('/admin/users')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Gebruikers Beheren
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => navigate('/admin/settings')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Instellingen
                    </Button>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
      
      {/* Match Form Modal */}
      {selectedMatchForm && (
        <WedstrijdformulierModal
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              handleDialogClose(false);
            }
          }}
          match={selectedMatchForm}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={effectiveTeamId}
          onComplete={handleFormComplete}
        />
      )}
    </div>
  );
};

export default memo(UserProfilePage);

