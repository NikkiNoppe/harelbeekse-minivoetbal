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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, BookOpen, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUBLIC_CARD_CLASS } from "@/components/layout";
import type { BlogPost } from "@/services/blogService";
import {
  BLOG_STATUS_LABELS,
  formatBlogVisibilityRange,
  getBlogScheduleStatus,
  type BlogScheduleStatus,
} from "@/lib/blogVisibility";

export type BlogStatusFilter = "all" | "live" | "scheduled" | "draft" | "expired";

interface BlogListProps {
  posts: BlogPost[];
  loading: boolean;
  isRefreshing?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: BlogStatusFilter;
  onStatusFilterChange: (value: BlogStatusFilter) => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onTogglePublished: (post: BlogPost, published: boolean) => void;
  addButton?: React.ReactNode;
  totalCount: number;
  liveCount: number;
  scheduledCount: number;
  draftCount: number;
}

function getPostMeta(post: BlogPost) {
  const title = post.setting_value.title;
  const status = getBlogScheduleStatus(post.setting_value);
  const dateLabel =
    status === "draft"
      ? "Concept"
      : formatBlogVisibilityRange(post.setting_value);

  return { title, status, dateLabel };
}

function getStatusBadgeVariant(status: BlogScheduleStatus): "default" | "secondary" | "outline" {
  if (status === "live") return "default";
  if (status === "scheduled") return "outline";
  return "secondary";
}

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
    <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
    <p className="text-sm font-medium text-brand-dark">
      {filtered ? "Geen blogberichten gevonden" : "Nog geen blogberichten"}
    </p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      {filtered
        ? "Pas je zoekterm of filter aan."
        : "Maak een nieuw bericht aan voor de publieke nieuwspagina."}
    </p>
  </div>
);

function MobileBlogSkeleton() {
  return (
    <div className="space-y-3 p-4 md:hidden" aria-busy="true" aria-label="Blogberichten laden">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`blog-mobile-skeleton-${index}`} className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
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

interface BlogPostCardProps {
  post: BlogPost;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onTogglePublished: (post: BlogPost, published: boolean) => void;
}

function BlogPostCard({
  post,
  onEdit,
  onDelete,
  onTogglePublished,
}: BlogPostCardProps) {
  const { title, status, dateLabel } = getPostMeta(post);
  const published = post.setting_value.published;

  return (
    <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm border-primary/15")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-brand-dark leading-snug line-clamp-2">
              {title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {dateLabel}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(status)} className="shrink-0">
            {BLOG_STATUS_LABELS[status]}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 bg-muted/30 px-3 py-2.5 min-h-[44px]">
          <span className="text-sm text-muted-foreground">Publiceren</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={(checked) => onTogglePublished(post, checked)}
              aria-label={
                published ? `${title} depubliceren` : `${title} publiceren`
              }
            />
            <span className="text-sm font-medium text-brand-dark">
              {published ? "Aan" : "Uit"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] flex-1"
            onClick={() => onEdit(post)}
          >
            <Edit className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            Bewerken
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] min-w-[44px] shrink-0 px-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(post)}
            aria-label={`Verwijder ${title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const BlogList: React.FC<BlogListProps> = ({
  posts,
  loading,
  isRefreshing = false,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onTogglePublished,
  addButton,
  totalCount,
  liveCount,
  scheduledCount,
  draftCount,
}) => {
  const isFiltered = searchTerm.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
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
              Live
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {liveCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Gepland
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {scheduledCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Concept
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-dark sm:mt-2 sm:text-2xl">
              {draftCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(PUBLIC_CARD_CLASS, "shadow-sm")}>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="block space-y-3 md:hidden">
            <SearchInput
              placeholder="Zoeken op titel…"
              value={searchTerm}
              onChange={onSearchTermChange}
              className="min-h-[44px]"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as BlogStatusFilter)}
            >
              <SelectTrigger className="min-h-[44px] w-full">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scheduled">Gepland</SelectItem>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="expired">Verlopen</SelectItem>
              </SelectContent>
            </Select>
            {addButton ? <div className="pt-1">{addButton}</div> : null}
          </div>

          <div className="hidden md:flex md:items-end md:gap-4">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <SearchInput
                placeholder="Zoeken op titel…"
                value={searchTerm}
                onChange={onSearchTermChange}
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => onStatusFilterChange(value as BlogStatusFilter)}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addButton ? <div className="shrink-0">{addButton}</div> : null}
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          PUBLIC_CARD_CLASS,
          "shadow-lg transition-opacity duration-200",
          isRefreshing && !loading ? "opacity-80" : "",
        )}
      >
        <CardContent className="min-w-0 overflow-hidden p-0 sm:p-0">
          {loading ? (
            <>
              <MobileBlogSkeleton />
              <div className="hidden overflow-x-auto md:block">
                <Table className="table w-full">
                  <TableHeader>
                    <TableRow className="table-header-row">
                      <TableHead className="min-w-[220px]">Titel</TableHead>
                      <TableHead className="min-w-[140px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Periode</TableHead>
                      <TableHead className="min-w-[104px] text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={`blog-skeleton-${index}`}>
                        <TableCell className="table-skeleton-cell">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </TableCell>
                        <TableCell className="table-skeleton-cell">
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell className="table-skeleton-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="table-skeleton-cell text-center">
                          <div className="flex justify-center gap-1">
                            <Skeleton className="h-9 w-9 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : posts.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {posts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onTogglePublished={onTogglePublished}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="table w-full">
                  <TableHeader>
                    <TableRow className="table-header-row">
                      <TableHead className="min-w-[220px]">Titel</TableHead>
                      <TableHead className="min-w-[140px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Periode</TableHead>
                      <TableHead className="min-w-[104px] text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const { title, status, dateLabel } = getPostMeta(post);
                      const published = post.setting_value.published;

                      return (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <FileText className="h-4 w-4" aria-hidden />
                              </span>
                              <span className="block max-w-[280px] truncate text-brand-dark">
                                {title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <Switch
                                checked={published}
                                onCheckedChange={(checked) =>
                                  onTogglePublished(post, checked)
                                }
                                aria-label={
                                  published
                                    ? `${title} depubliceren`
                                    : `${title} publiceren`
                                }
                              />
                              <Badge variant={getStatusBadgeVariant(status)}>
                                {BLOG_STATUS_LABELS[status]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {dateLabel}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(post)}
                                className="min-h-[44px] min-w-[44px]"
                                aria-label={`Bewerk ${title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(post)}
                                className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                                aria-label={`Verwijder ${title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogList;
