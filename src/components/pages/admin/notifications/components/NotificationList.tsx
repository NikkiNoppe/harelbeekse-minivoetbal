import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  MessageSquare,
  Calendar,
  Users,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";
import type { Notification } from "@/services/notificationService";

export type NotificationTypeFilter = "all" | "info" | "warning" | "success" | "error";

interface NotificationUser {
  user_id: number;
  username: string;
  role: string;
}

interface NotificationListProps {
  notifications: Notification[];
  users: NotificationUser[];
  loading: boolean;
  isRefreshing?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  typeFilter: NotificationTypeFilter;
  onTypeFilterChange: (value: NotificationTypeFilter) => void;
  onEdit: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  addButton?: React.ReactNode;
  totalCount: number;
  activeCount: number;
  roleTargetCount: number;
}

const NOTIFICATION_TYPES = [
  { value: "info", label: "Informatie", icon: Info },
  { value: "warning", label: "Waarschuwing", icon: AlertTriangle },
  { value: "success", label: "Succes", icon: CheckCircle2 },
  { value: "error", label: "Fout", icon: XCircle },
] as const;

const ROLE_OPTIONS = [
  { value: "referee", label: "Scheidsrechter" },
  { value: "player_manager", label: "Teamverantwoordelijke" },
];

export function isNotificationActive(notification: Notification, referenceDate = new Date()): boolean {
  const sv = notification.setting_value;
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (sv.start_date) {
    const start = new Date(sv.start_date);
    start.setHours(0, 0, 0, 0);
    if (start > today) return false;
  }

  if (sv.end_date) {
    const end = new Date(sv.end_date);
    end.setHours(23, 59, 59, 999);
    if (end < today) return false;
  }

  return true;
}

function formatDateRange(notification: Notification): string {
  const sv = notification.setting_value;
  if (sv.start_date && sv.end_date) {
    return `${new Date(sv.start_date).toLocaleDateString("nl-BE")} – ${new Date(sv.end_date).toLocaleDateString("nl-BE")}`;
  }
  if (sv.start_date) {
    return `Vanaf ${new Date(sv.start_date).toLocaleDateString("nl-BE")}`;
  }
  if (sv.end_date) {
    return `Tot ${new Date(sv.end_date).toLocaleDateString("nl-BE")}`;
  }
  return "Altijd zichtbaar";
}

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "success":
      return "bg-emerald-600 hover:bg-emerald-600 text-white";
    case "warning":
      return "bg-amber-600 hover:bg-amber-600 text-white";
    case "error":
      return "bg-destructive hover:bg-destructive text-destructive-foreground";
    default:
      return "";
  }
}

function getTargetDescription(
  notification: Notification,
  users: NotificationUser[],
): { type: "users" | "roles" | "none"; items: string[] } {
  const sv = notification.setting_value;
  if (sv.target_users && sv.target_users.length > 0) {
    const userNames = sv.target_users.map(
      (uid) => users.find((u) => u.user_id === uid)?.username || `Gebruiker ${uid}`,
    );
    return { type: "users", items: userNames };
  }
  if (sv.target_roles && sv.target_roles.length > 0) {
    const items = sv.target_roles.map(
      (r) => ROLE_OPTIONS.find((ro) => ro.value === r)?.label || r,
    );
    return { type: "roles", items };
  }
  return { type: "none", items: [] };
}

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
    <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
    <p className="text-sm font-medium text-brand-dark">
      {filtered ? "Geen berichten gevonden" : "Nog geen berichten"}
    </p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      {filtered
        ? "Pas je zoekterm of filter aan."
        : "Maak een bericht aan voor scheidsrechters of teamverantwoordelijken."}
    </p>
  </div>
);

function MobileSkeleton() {
  return (
    <div className="space-y-3 p-4 md:hidden" aria-busy="true" aria-label="Berichten laden">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`notification-mobile-skeleton-${index}`} className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 w-11 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  users: NotificationUser[];
  onEdit: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}

function NotificationCard({
  notification,
  users,
  onEdit,
  onDelete,
}: NotificationCardProps) {
  const sv = notification.setting_value;
  const active = isNotificationActive(notification);
  const target = getTargetDescription(notification, users);
  const typeLabel =
    NOTIFICATION_TYPES.find((t) => t.value === sv.type)?.label ?? sv.type;
  const title = sv.title || "Bericht zonder titel";

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm border-primary/15")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-brand-dark leading-snug line-clamp-2">
              {title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {sv.message}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {formatDateRange(notification)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge className={getTypeBadgeClass(sv.type)} variant={sv.type === "info" ? "default" : "secondary"}>
              {typeLabel}
            </Badge>
            <Badge variant={active ? "default" : "secondary"}>
              {active ? "Actief" : "Inactief"}
            </Badge>
          </div>
        </div>

        {target.items.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {target.type === "users" ? (
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            )}
            {target.items.slice(0, 3).map((item, index) => (
              <Badge key={`${notification.id}-target-${index}`} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
            {target.items.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{target.items.length - 3}
              </Badge>
            )}
          </div>
        )}

        {(sv.send_email || sv.email_sent_at) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {sv.email_sent_count
                ? `${sv.email_sent_count} e-mail${sv.email_sent_count === 1 ? "" : "s"} verstuurd`
                : "E-mail ingeschakeld"}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] flex-1"
            onClick={() => onEdit(notification)}
          >
            <Edit className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            Bewerken
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] min-w-[44px] shrink-0 px-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification)}
            aria-label={`Verwijder ${title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  users,
  loading,
  isRefreshing = false,
  searchTerm,
  onSearchTermChange,
  typeFilter,
  onTypeFilterChange,
  onEdit,
  onDelete,
  addButton,
  totalCount,
  activeCount,
  roleTargetCount,
}) => {
  const isFiltered = searchTerm.trim().length > 0 || typeFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Totaal
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {totalCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Actief
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Per rol
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {roleTargetCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="block space-y-3 md:hidden">
            <SearchInput
              placeholder="Zoeken op titel of tekst…"
              value={searchTerm}
              onChange={onSearchTermChange}
              className="min-h-[44px]"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as NotificationTypeFilter)}>
                <SelectTrigger className="min-h-[44px] w-full sm:w-[180px]" aria-label="Filter op type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addButton}
            </div>
          </div>

          <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <SearchInput
                placeholder="Zoeken op titel of tekst…"
                value={searchTerm}
                onChange={onSearchTermChange}
                className="min-h-[44px] max-w-sm flex-1"
              />
              <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as NotificationTypeFilter)}>
                <SelectTrigger className="min-h-[44px] w-[180px]" aria-label="Filter op type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addButton}
          </div>

          {loading ? (
            <MobileSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <div className={cn(isRefreshing && "opacity-80 transition-opacity")}>
              <div className="space-y-3 md:hidden">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    users={users}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Bericht</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Doelgroep</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => {
                      const sv = notification.setting_value;
                      const active = isNotificationActive(notification);
                      const target = getTargetDescription(notification, users);
                      const typeLabel =
                        NOTIFICATION_TYPES.find((t) => t.value === sv.type)?.label ?? sv.type;

                      return (
                        <TableRow key={notification.id}>
                          <TableCell className="max-w-[280px]">
                            {sv.title && (
                              <span className="mb-0.5 block font-semibold text-brand-dark">
                                {sv.title}
                              </span>
                            )}
                            <span className="line-clamp-2 text-sm text-muted-foreground">
                              {sv.message}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getTypeBadgeClass(sv.type)}
                              variant={sv.type === "info" ? "default" : "secondary"}
                            >
                              {typeLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={active ? "default" : "secondary"}>
                              {active ? "Actief" : "Inactief"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-1">
                                {target.type === "users" && (
                                  <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
                                )}
                                {target.type === "roles" && (
                                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                                )}
                                {target.items.slice(0, 2).map((item, index) => (
                                  <Badge key={`${notification.id}-desk-${index}`} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                                {target.items.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{target.items.length - 2}
                                  </Badge>
                                )}
                              </div>
                              {(sv.send_email || sv.email_sent_at) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5" aria-hidden />
                                  {sv.email_sent_count
                                    ? `${sv.email_sent_count} e-mail${sv.email_sent_count === 1 ? "" : "s"}`
                                    : "E-mail"}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDateRange(notification)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="min-h-[44px] min-w-[44px]"
                                onClick={() => onEdit(notification)}
                                aria-label={`Bewerk ${sv.title || "bericht"}`}
                              >
                                <Edit className="h-4 w-4" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                                onClick={() => onDelete(notification)}
                                aria-label={`Verwijder ${sv.title || "bericht"}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationList;
