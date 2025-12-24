import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { BlogPost } from "@/services";
import { formatDateShort } from "@/lib/dateUtils";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { PageHeader } from "@/components/layout";

// Memoized sub-components for better performance
const CompetitionInfo = memo(() => {
  const headingId = React.useId();
  return (
    <section role="region" aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">Competitie Informatie</h2>
      <Card>
      <CardContent className="pt-4 text-sm bg-transparent space-y-4">
        <p>
          Opgericht in 1979 is de Harelbeekse Minivoetbal Competitie uitgegroeid tot de grootste minivoetbalcompetitie van Harelbeke. Elk seizoen nemen tal van teams uit Harelbeke en omgeving deel.
        </p>
        <p>
          Ontdek hier alle uitslagen, klassementen, spelersinfo en wedstrijdschema's.
        </p>
      </CardContent>
    </Card>
  </section>
  );
});


// Skeleton loading component
const NewsItemSkeleton = memo(() => (
  <Card className="w-full">
    <CardHeader className="pb-3 bg-transparent">
      <div className="flex justify-between items-start mb-2 gap-2">
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="bg-transparent">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </CardContent>
  </Card>
));

// Memoized blog post item
const BlogPostItem = memo(({ post }: { post: BlogPost }) => {
  // Check if this post has actual content (title, content, etc.)
  const hasContent = post.setting_value?.title || post.setting_value?.content;
  
  // If no content, don't render anything
  if (!hasContent) {
    return null;
  }
  
  return (
    <Card className="card-hover w-full">
      <CardHeader className="pb-3 bg-transparent">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDateShort(post.created_at)}
          </span>
        </div>
        {post.setting_value?.title && (
          <CardTitle className="break-words">
            {post.setting_value.title}
          </CardTitle>
        )}
      </CardHeader>
      {post.setting_value?.content && (
        <CardContent className="bg-transparent">
          <p className="text-sm break-words">
            {post.setting_value.content}
          </p>
        </CardContent>
      )}
    </Card>
  );
});

// News section component
const NewsSection = memo(() => {
  const {
    data: blogPosts,
    isLoading,
    error,
    refetch
  } = useBlogPosts();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 w-full">
          {[...Array(3)].map((_, index) => (
            <NewsItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full">
          <CardContent className="py-8 text-center bg-transparent">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Fout bij laden</h3>
            <p className="text-muted-foreground mb-4">
              De nieuwsberichten konden niet worden geladen.
            </p>
            <Button onClick={() => refetch()} className="btn-dark">
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!blogPosts?.length) {
      return (
        <Card className="w-full">
          <CardContent className="py-8 text-center bg-transparent">
            <p className="text-muted-foreground text-sm">
              Geen nieuws beschikbaar
            </p>
          </CardContent>
        </Card>
      );
    }

    // Filter posts that have actual content
    const postsWithContent = blogPosts.filter(post => 
      post.setting_value?.title || post.setting_value?.content
    );

    if (postsWithContent.length === 0) {
      return (
        <Card className="w-full">
          <CardContent className="py-8 text-center bg-transparent">
            <p className="text-muted-foreground text-sm">
              Geen nieuws beschikbaar
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3 w-full">
        {postsWithContent.map(post => (
          <BlogPostItem key={post.id} post={post} />
        ))}
      </div>
    );
  };

  const headingId = React.useId();
  return (
    <section role="region" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-2xl font-semibold mb-4">Laatste Nieuws</h2>
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </section>
  );
});

// Main component - Mobile-first design
const AlgemeenPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader 
        title="Minivoetbal Harelbeke" 
        subtitle="Officiële Competitie Website"
      />

      <CompetitionInfo />
      <NewsSection />
    </div>
  );
};

// Set display names for better debugging
CompetitionInfo.displayName = 'CompetitionInfo';
NewsItemSkeleton.displayName = 'NewsItemSkeleton';
BlogPostItem.displayName = 'BlogPostItem';
NewsSection.displayName = 'NewsSection';

export default AlgemeenPage;
