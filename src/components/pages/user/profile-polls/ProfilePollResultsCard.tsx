import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPollDeadline,
  getRoleLabel,
  type ProfilePollAdmin,
} from "@/services/profilePoll/profilePollService";

interface ProfilePollResultsCardProps {
  poll: ProfilePollAdmin;
  onClose: (pollId: number) => Promise<void>;
  onDelete: (pollId: number) => Promise<void>;
  isClosing?: boolean;
  isDeleting?: boolean;
}

export function ProfilePollResultsCard({
  poll,
  onClose,
  onDelete,
  isClosing,
  isDeleting,
}: ProfilePollResultsCardProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const { stats } = poll;
  const total = stats.eligible_count || 1;

  return (
    <Card className={cn(!poll.is_active && "opacity-90")}>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            {poll.title && (
              <p className="text-xs text-muted-foreground">{poll.title}</p>
            )}
            <h3 className="font-semibold text-sm sm:text-base leading-snug">{poll.question}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Deadline: {formatPollDeadline(poll.end_date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {poll.is_active ? (
              <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                Actief
              </Badge>
            ) : poll.status === "closed" ? (
              <Badge variant="secondary">Gesloten</Badge>
            ) : (
              <Badge variant="outline">Verlopen</Badge>
            )}
            {poll.target_roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span>
            <strong>{stats.responded_count}</strong> / {stats.eligible_count} ingevuld
          </span>
        </div>

        <div className="space-y-2.5">
          {poll.options.map((opt) => {
            const count = stats.option_counts[opt.id] ?? 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="truncate pr-2">{opt.label}</span>
                  <span className="text-muted-foreground shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between min-h-[44px] text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                Wie heeft ingevuld?
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  participantsOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {stats.responded.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Ingevuld ({stats.responded.length})
                </p>
                <ul className="space-y-1">
                  {stats.responded.map((r) => (
                    <li
                      key={r.user_id}
                      className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 py-1 border-b border-border/50 last:border-0"
                    >
                      <span>
                        {r.username}{" "}
                        <span className="text-muted-foreground">
                          ({getRoleLabel(r.role)})
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {(r.option_labels ?? r.option_ids ?? []).join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.pending.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <UserX className="h-3 w-3" />
                  Nog open ({stats.pending.length})
                </p>
                <ul className="space-y-1">
                  {stats.pending.map((p) => (
                    <li
                      key={p.user_id}
                      className="text-xs sm:text-sm text-muted-foreground py-0.5"
                    >
                      {p.username} ({getRoleLabel(p.role)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {poll.is_active && poll.status === "open" && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] flex-1"
              disabled={isClosing}
              onClick={() => void onClose(poll.id)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Sluiten
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex-1 text-destructive hover:text-destructive"
            disabled={isDeleting}
            onClick={() => void onDelete(poll.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Verwijderen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
