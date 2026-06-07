import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Loader2, Medal, Trophy } from "lucide-react";
import { BlogPost } from "@/services";
import { formatDateShort } from "@/lib/dateUtils";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { PageHeader } from "@/components/layout";
import { PUBLIC_ROUTES } from "@/config/routes";

const CONTENT_PREVIEW_LENGTH = 240;

const QUICK_LINKS = [
  { to: PUBLIC_ROUTES.competitie, label: "Competitie", icon: Trophy },
  { to: PUBLIC_ROUTES.beker, label: "Beker", icon: Medal },
  { to: PUBLIC_ROUTES.reglement, label: "Reglement", icon: BookOpen },
] as const;

const CompetitionInfo = memo(() => {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-semibold text-primary mb-4">
        Over de competitie
      </h2>
      <Card>
        <CardContent className="pt-6 text-sm space-y-4">
          <p>
            Opgericht in 1979 is de Harelbeekse Minivoetbal Competitie uitgegroeid tot de grootste minivoetbalcompetitie van Harelbeke. Elk seizoen nemen tal van teams uit Harelbeke en omgeving deel.
          </p>
          <p>
            Ontdek hier alle uitslagen, klassementen, spelersinfo en wedstrijdschema&apos;s.
          </p>
        </CardContent>
      </Card>
    </section>
  );
});

const QuickLinks = memo(() => {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-semibold text-primary mb-4">
        Snel naar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-[44px] w-full justify-start gap-2 border-primary/20 hover:bg-primary/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
});

const NewsItemSkeleton = memo(() => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
  </Card>
));

const BlogPostItem = memo(({ post }: { post: BlogPost }) => {
  const [expanded, setExpanded] = useState(false);
  const hasContent = post.setting_value?.title || post.setting_value?.content;

  if (!hasContent) {
    return null;
  }

  const content = post.setting_value?.content ?? "";
  const needsTruncate = content.length > CONTENT_PREVIEW_LENGTH;
  const displayContent =
    expanded || !needsTruncate
      ? content
      : `${content.slice(0, CONTENT_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {post.setting_value.published_at && formatDateShort(post.setting_value.published_at)}
          </span>
        </div>
        {post.setting_value?.title && (
          <CardTitle className="break-words text-lg">
            {post.setting_value.title}
          </CardTitle>
        )}
      </CardHeader>
      {content && (
        <CardContent>
          <p className="text-sm break-words whitespace-pre-line">{displayContent}</p>
          {needsTruncate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 min-h-[44px] px-0 text-primary hover:text-primary/80"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? "Minder tonen" : "Lees meer"}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
});

const NewsSection = memo(() => {
  const {
    blogPosts,
    isListLoading,
    isRefreshing,
    showError,
    error,
    refetch,
    isFetched,
    isPlaceholderData,
  } = useBlogPosts();

  const postsWithContent = useMemo(
    () =>
      (blogPosts ?? []).filter(
        (post) => post.setting_value?.title || post.setting_value?.content,
      ),
    [blogPosts],
  );

  const showEmpty =
    isFetched &&
    !isPlaceholderData &&
    postsWithContent.length === 0 &&
    !isListLoading &&
    !showError;

  const renderContent = () => {
    if (isListLoading) {
      return (
        <div className="space-y-3 w-full">
          {[...Array(3)].map((_, index) => (
            <NewsItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (showError) {
      return (
        <Card className="w-full" role="alert">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" aria-hidden />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Fout bij laden</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {error instanceof Error ? error.message : "De nieuwsberichten konden niet worden geladen."}
            </p>
            <Button
              type="button"
              onClick={() => void refetch()}
              className="min-h-[44px]"
            >
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (showEmpty) {
      return (
        <Card className="w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Geen nieuws beschikbaar</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div
        className={`space-y-3 w-full transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
      >
        {postsWithContent.map((post) => (
          <BlogPostItem key={post.id} post={post} />
        ))}
      </div>
    );
  };

  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 id={headingId} className="text-xl font-semibold text-primary">
          Laatste Nieuws
        </h2>
        {isRefreshing && !isListLoading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Vernieuwen…
          </span>
        )}
      </div>
      {renderContent()}
    </section>
  );
});

const AlgemeenPage: React.FC = () => {
  return (
    <div className="space-y-6 motion-safe:animate-slide-up">
      <PageHeader
        title="Minivoetbal Harelbeke"
        subtitle="Officiële Competitie Website"
      />

      <CompetitionInfo />
      <QuickLinks />
      <NewsSection />
    </div>
  );
};

CompetitionInfo.displayName = "CompetitionInfo";
QuickLinks.displayName = "QuickLinks";
NewsItemSkeleton.displayName = "NewsItemSkeleton";
BlogPostItem.displayName = "BlogPostItem";
NewsSection.displayName = "NewsSection";

export default AlgemeenPage;
