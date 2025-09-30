import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { BlogPost } from "@/services";
import { formatDateShort } from "@/lib/dateUtils";
import { useBlogPosts } from "@/hooks/useBlogPosts";

// Memoized sub-components for better performance
const CompetitionInfo = memo(() => (
  <section>
    <Card>
      <CardContent className="pt-4 sm:pt-6 text-sm sm:text-base bg-transparent space-y-4">
        <p>
          De <strong>Harelbeekse Minivoetbal Competitie</strong> is opgericht in 1979 en is uitgegroeid tot 
          de grootste <strong>minivoetbal competitie in Harelbeke</strong>. Elk seizoen nemen meerdere teams 
          uit Harelbeke en omstreken deel aan onze spannende <strong>indoor voetbal competitie</strong>.
        </p>
        <p>
          Onze <strong>minivoetbal competitie</strong> vindt wekelijks plaats in Sporthal De Dageraad in Harelbeke 
          en bestaat uit verschillende onderdelen: de reguliere competitie, het prestigieuze bekertoernooi, en de 
          spannende play-offs aan het einde van het seizoen. Of je nu ervaren bent in <strong>zaalvoetbal</strong> of 
          gewoon op zoek bent naar sportief vermaak, bij <strong>minivoetbal Harelbeke</strong> ben je aan het 
          juiste adres.
        </p>
        <p>
          Volg hier alle uitslagen, klassementen, spelersinformatie en wedstrijdschema's van de 
          Harelbeekse Minivoetbal Competitie. Blijf op de hoogte van het laatste nieuws en de 
          prestaties van jouw favoriete team uit de regio <strong>West-Vlaanderen</strong>!
        </p>
      </CardContent>
    </Card>
  </section>
));

const ContactInfo = memo(() => (
  <section>
    <h2 className="text-2xl font-semibold">Contact</h2>
    <Card>
      <CardContent className="pt-4 sm:pt-6 bg-transparent">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-2">Competitieleiding</h3>
            <div className="space-y-1 text-sm sm:text-base">
              <p>Nikki Noppe</p>
              <p className="break-all">noppe.nikki@icloud.com</p>
              <p>+32 468 15 52 16</p>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-2">Locatie</h3>
            <div className="space-y-1 text-sm sm:text-base">
              <p>Sporthal De Dageraad</p>
              <p>Stasegemsesteenweg 21</p>
              <p>8530 Harelbeke</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
));

// Skeleton loading component
const NewsItemSkeleton = memo(() => (
  <Card className="w-full">
    <CardHeader className="pb-3 sm:pb-4 bg-transparent">
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
      <CardHeader className="pb-3 sm:pb-4 bg-transparent">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
            {formatDateShort(post.created_at)}
          </span>
        </div>
        {post.setting_value?.title && (
          <CardTitle className="text-lg sm:text-xl break-words">
            {post.setting_value.title}
          </CardTitle>
        )}
      </CardHeader>
      {post.setting_value?.content && (
        <CardContent className="bg-transparent">
          <p className="text-sm sm:text-base break-words">
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
        <div className="space-y-3 sm:space-y-4 w-full">
          {[...Array(3)].map((_, index) => (
            <NewsItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
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
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">
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
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">
              Geen nieuws beschikbaar
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-4 w-full">
        {postsWithContent.map(post => (
          <BlogPostItem key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Laatste Nieuws</h2>
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </section>
  );
});

// Main component
const AlgemeenPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Minivoetbal Harelbeke - Officiële Competitie Website</h1>
      </div>

      <CompetitionInfo />
      <NewsSection />
      <ContactInfo />
    </div>
  );
};

// Set display names for better debugging
CompetitionInfo.displayName = 'CompetitionInfo';
ContactInfo.displayName = 'ContactInfo';
NewsItemSkeleton.displayName = 'NewsItemSkeleton';
BlogPostItem.displayName = 'BlogPostItem';
NewsSection.displayName = 'NewsSection';

export default AlgemeenPage;