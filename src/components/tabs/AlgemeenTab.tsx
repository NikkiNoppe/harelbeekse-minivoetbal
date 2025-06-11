import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { fetchBlogPosts, BlogPost } from "@/services/blogService";
import { useToast } from "@/hooks/use-toast";
const AlgemeenTab: React.FC = () => {
  const {
    toast
  } = useToast();
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
  return <div className="space-y-6 sm:space-y-8 animate-slide-up">
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Over de Competitie</h2>
        <Card>
          <CardContent className="pt-4 sm:pt-6 text-sm sm:text-base">
            <p className="mb-3 sm:mb-4">De Harelbeekse Minivoetbal Competitie is opgericht in 1979 en is uitgegroeid tot een vaste waarde in de regio. </p>
            <p className="mb-3 sm:mb-4">
              Onze competitie staat bekend om zijn sportiviteit.
            </p>
            <p className="break-words">Interesse om deel te nemen met een team? Neem dan contact op via noppe.nikki@icloud.com.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Laatste Nieuws</h2>
        <div className="space-y-3 sm:space-y-4 w-full">
          {loading ? <p className="text-center text-sm sm:text-base py-8">Berichten laden...</p> : blogPosts.length > 0 ? blogPosts.map(post => <Card key={post.id} className="card-hover w-full">
                <CardHeader className="pb-3 sm:pb-4 bg-transparent ">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                      {new Date(post.date).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <CardTitle className="text-lg sm:text-xl break-words">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base break-words">{post.content}</p>
                  
                  {post.tags && post.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, index) => <Badge key={index} variant="outline" className="flex items-center gap-1 bg-[soccer-light-green] text-soccer-black 500/20 ">
                          <Tag className="h-3 w-3" /> 
                          <span className="break-all">{tag}</span>
                        </Badge>)}
                    </div>}
                </CardContent>
              </Card>) : <p className="text-center text-muted-foreground text-sm sm:text-base py-8">Geen nieuws beschikbaar</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Contact</h2>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Competitieleiding</h3>
                <div className="space-y-1 text-sm sm:text-base">
                  <p>Nikki Noppe</p>
                  <p className="break-all">info@minivoetbalharelbeke.be</p>
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
    </div>;
};
export default AlgemeenTab;