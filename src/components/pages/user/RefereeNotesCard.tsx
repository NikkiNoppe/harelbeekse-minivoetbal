import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, ChevronRight, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "admin_read_referee_notes";

const getReadNotes = (): number[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setReadNotes = (ids: number[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

interface RefereeNote {
  match_id: number;
  match_date: string;
  referee_notes: string;
  referee: string | null;
  speeldag: string | null;
  home_team_name: string;
  away_team_name: string;
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const NoteItem: React.FC<{
  note: RefereeNote;
  isRead: boolean;
  onToggle: (matchId: number) => void;
}> = ({ note, isRead, onToggle }) => (
  <div
    className={cn(
      "flex gap-3 p-3 rounded-lg border transition-colors",
      isRead
        ? "bg-muted/30 border-border/50 opacity-70"
        : "bg-card border-border hover:border-primary/30"
    )}
  >
    <Checkbox
      checked={isRead}
      onCheckedChange={() => onToggle(note.match_id)}
      className="mt-0.5 flex-shrink-0"
      aria-label={`Markeer notitie als ${isRead ? "ongelezen" : "gelezen"}`}
    />
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {note.speeldag && (
          <span className="text-xs font-medium text-muted-foreground">
            {note.speeldag}
          </span>
        )}
        <span className="text-sm font-semibold text-foreground truncate">
          {note.home_team_name} vs {note.away_team_name}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatDate(note.match_date)}</span>
        {note.referee && (
          <>
            <span>·</span>
            <span>Ref: {note.referee}</span>
          </>
        )}
      </div>
      <p className="text-sm text-foreground/80 italic leading-relaxed">
        "{note.referee_notes}"
      </p>
    </div>
  </div>
);

const RefereeNotesCard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [readIds, setReadIds] = useState<number[]>(getReadNotes);
  const [readOpen, setReadOpen] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["adminRefereeNotes"],
    queryFn: async () => {
      const result = await withUserContext(
        async () => {
          const { data, error } = await supabase
            .from("matches")
            .select(
              `match_id, match_date, referee_notes, referee, speeldag,
               home_team:teams!matches_home_team_id_fkey(team_name),
               away_team:teams!matches_away_team_id_fkey(team_name)`
            )
            .eq("is_submitted", true)
            .not("referee_notes", "is", null)
            .neq("referee_notes", "")
            .order("match_date", { ascending: false });

          if (error) throw error;
          return (data || []).map((m: any) => ({
            match_id: m.match_id,
            match_date: m.match_date,
            referee_notes: m.referee_notes,
            referee: m.referee,
            speeldag: m.speeldag,
            home_team_name: m.home_team?.team_name || "?",
            away_team_name: m.away_team?.team_name || "?",
          })) as RefereeNote[];
        },
        {
          userId: authUser?.id,
          role: authUser?.role,
        }
      );
      return result;
    },
    enabled: !!authUser?.id && authUser?.role === "admin",
    staleTime: 5 * 60 * 1000,
  });

  const toggleRead = useCallback((matchId: number) => {
    setReadIds((prev) => {
      const next = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];
      setReadNotes(next);
      return next;
    });
  }, []);

  const { unread, read } = useMemo(() => {
    const unread: RefereeNote[] = [];
    const read: RefereeNote[] = [];
    for (const n of notes) {
      if (readIds.includes(n.match_id)) {
        read.push(n);
      } else {
        unread.push(n);
      }
    }
    return { unread, read };
  }, [notes, readIds]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Scheidsrechter Notities
          </CardTitle>
          {unread.length > 0 && (
            <Badge variant="default" className="text-xs">
              {unread.length} nieuw
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Unread notes */}
        {unread.length > 0 ? (
          <div className="space-y-2">
            {unread.map((note) => (
              <NoteItem
                key={note.match_id}
                note={note}
                isRead={false}
                onToggle={toggleRead}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            Alle notities zijn gelezen ✓
          </p>
        )}

        {/* Read notes (collapsible) */}
        {read.length > 0 && (
          <Collapsible open={readOpen} onOpenChange={setReadOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  readOpen && "rotate-90"
                )}
              />
              <span>Gelezen notities ({read.length})</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {read.map((note) => (
                <NoteItem
                  key={note.match_id}
                  note={note}
                  isRead={true}
                  onToggle={toggleRead}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default RefereeNotesCard;
