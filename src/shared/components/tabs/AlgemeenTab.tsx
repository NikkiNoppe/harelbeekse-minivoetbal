import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Calendar, MapPin, Phone, Mail, Users, Trophy } from "lucide-react";
import { fetchBlogPosts, BlogPost } from "@shared/services/blogService";
import { useToast } from "@shared/hooks/use-toast";
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
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg text-white">
        <div className="flex justify-center mb-4">
          <Trophy size={48} className="text-purple-200" />
        </div>
        <h2 className="heading-2 text-white mb-0">Over de Competitie</h2>
        <p className="text-purple-100 max-w-3xl mx-auto leading-relaxed">
          De Harelbeekse Minivoetbal Competitie is opgericht in 1979 en is uitgegroeid tot een vaste waarde in de regio.
        </p>
      </section>

      {/* Competition Info Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-professional">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <Users className="text-purple-600" size={24} />
              <h3 className="heading-3 mb-0">Sportiviteit</h3>
            </div>
          </div>
          <div className="card-content">
            <p className="text-body">
              Onze competitie staat bekend om zijn sportiviteit en fair play. 
              We hechten veel waarde aan respectvol sporten en een goede sfeer.
            </p>
          </div>
        </div>

        <div className="card-professional">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <Trophy className="text-purple-600" size={24} />
              <h3 className="heading-3 mb-0">Deelname</h3>
            </div>
          </div>
          <div className="card-content">
            <p className="text-body">
              Interesse om deel te nemen met een team? Neem dan contact op via 
              <a href="mailto:noppe.nikki@icloud.com" className="ml-1 font-medium">
                noppe.nikki@icloud.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section>
        <h2 className="heading-2">Laatste Nieuws</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted">Berichten laden...</p>
            </div>
          ) : blogPosts.length > 0 ? (
            blogPosts.map(post => (
              <div key={post.id} className="card-professional hover:shadow-professional-lg transition-all duration-200">
                <div className="card-header">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2 text-purple-600">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">
                        {new Date(post.date).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </div>
                  <h3 className="heading-3 mb-0">{post.title}</h3>
                </div>
                <div className="card-content">
                  <p className="text-body">{post.content}</p>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} className="badge-professional">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">Geen nieuws beschikbaar</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section>
        <h2 className="heading-2">Contact</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-professional">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <Users className="text-purple-600" size={24} />
                <h3 className="heading-3 mb-0">Competitieleiding</h3>
              </div>
            </div>
            <div className="card-content space-y-3">
              <p className="font-semibold text-purple-800">Nikki Noppe</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-purple-600 flex-shrink-0" />
                  <a href="mailto:info@minivoetbalharelbeke.be" className="text-sm">
                    info@minivoetbalharelbeke.be
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-purple-600 flex-shrink-0" />
                  <a href="tel:+32468155216" className="text-sm">
                    +32 468 15 52 16
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card-professional">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <MapPin className="text-purple-600" size={24} />
                <h3 className="heading-3 mb-0">Locatie</h3>
              </div>
            </div>
            <div className="card-content space-y-2">
              <p className="font-semibold text-purple-800">Sporthal De Dageraad</p>
              <div className="text-sm space-y-1">
                <p>Stasegemsesteenweg 21</p>
                <p>8530 Harelbeke</p>
                <p className="text-purple-600 font-medium">België</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default AlgemeenTab;