
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { fetchBlogPosts, BlogPost } from "@/services/blogService";
import { useToast } from "@/hooks/use-toast";

const AlgemeenTab: React.FC = () => {
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setLoading(true);
        const posts = await fetchBlogPosts();
        setBlogPosts(posts);
      } catch (error) {
        toast({
          title: "Fout bij het laden",
          description: "De blogposts konden niet worden geladen.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, [toast]);

  return (
    <div className="space-y-8 animate-slide-up">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Over de Competitie</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4">
              De Harelbeekse Minivoetbal Competitie is opgericht in 1985 en is uitgegroeid tot een vaste waarde in de regio. Met momenteel 6 teams strijden we elk seizoen voor de felbegeerde titel.
            </p>
            <p className="mb-4">
              Onze competitie staat bekend om zijn sportiviteit en gezelligheid. Na elke wedstrijd is er tijd voor een drankje en een babbel in de kantine.
            </p>
            <p>
              Interesse om deel te nemen met een team? Neem dan contact op via info@minivoetbalharelbeke.be.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Laatste Nieuws</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {loading ? (
            <p>Berichten laden...</p>
          ) : blogPosts.length > 0 ? (
            blogPosts.map(post => (
              <Card key={post.id} className="card-hover">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    {post.tags && post.tags.length > 0 && (
                      <Badge className="w-fit bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                        {post.tags[0]}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.date).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{post.content}</p>
                  
                  {post.tags && post.tags.length > 1 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags.slice(1).map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground">Geen nieuws beschikbaar</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Competitieleiding</h3>
                <p>Nikki Noppe</p>
                <p>info@minivoetbalharelbeke.be</p>
                <p>+32 468 15 52 16</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Locatie</h3>
                <p>Sporthal De Dageraad</p>
                <p>Stasegemsesteenweg 21</p>
                <p>8530 Harelbeke</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AlgemeenTab;
