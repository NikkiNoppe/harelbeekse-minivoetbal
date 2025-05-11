
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Eye, EyeOff } from "lucide-react";

// Initial tabs visibility settings
const initialTabsVisibility = {
  algemeen: true,
  competitie: true,
  playoff: true,
  beker: true,
  schorsingen: true,
  reglement: true
};

// Interface for blog posts
interface BlogPost {
  id: number;
  title: string;
  content: string;
  date: string;
}

// Mock blog posts
const initialBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Welkom bij het nieuwe seizoen",
    content: "Het nieuwe seizoen van de Harelbeekse Minivoetbal Competitie is begonnen! We wensen alle teams veel succes.",
    date: "2025-04-01"
  },
  {
    id: 2,
    title: "Update spelregels",
    content: "Er zijn enkele wijzigingen aangebracht in de spelregels. Lees hier meer over de belangrijkste veranderingen.",
    date: "2025-04-15"
  }
];

const SettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [tabsVisibility, setTabsVisibility] = useState(initialTabsVisibility);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [newBlogPost, setNewBlogPost] = useState({ title: "", content: "" });
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  
  const handleTabVisibilityChange = (tab: keyof typeof tabsVisibility) => {
    setTabsVisibility(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
    
    toast({
      title: `Tab ${tab} ${!tabsVisibility[tab] ? "zichtbaar" : "verborgen"}`,
      description: `De tab is nu ${!tabsVisibility[tab] ? "zichtbaar" : "verborgen"} voor gebruikers.`
    });
  };
  
  const handleSaveSettings = () => {
    // In a real app, this would save the settings to a backend
    toast({
      title: "Instellingen opgeslagen",
      description: "De tab zichtbaarheid is succesvol bijgewerkt."
    });
  };
  
  const handleAddBlogPost = () => {
    if (!newBlogPost.title || !newBlogPost.content) {
      toast({
        title: "Fout",
        description: "Vul zowel een titel als inhoud in",
        variant: "destructive"
      });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (editingPostId !== null) {
      // Update existing post
      setBlogPosts(prev => prev.map(post => 
        post.id === editingPostId 
          ? { ...post, title: newBlogPost.title, content: newBlogPost.content } 
          : post
      ));
      
      toast({
        title: "Blogpost bijgewerkt",
        description: "De blogpost is succesvol bijgewerkt"
      });
    } else {
      // Add new post
      const newId = Math.max(0, ...blogPosts.map(p => p.id)) + 1;
      setBlogPosts(prev => [
        ...prev,
        {
          id: newId,
          title: newBlogPost.title,
          content: newBlogPost.content,
          date: today
        }
      ]);
      
      toast({
        title: "Blogpost toegevoegd",
        description: "De nieuwe blogpost is succesvol toegevoegd"
      });
    }
    
    setNewBlogPost({ title: "", content: "" });
    setEditingPostId(null);
  };
  
  const handleEditBlogPost = (post: BlogPost) => {
    setNewBlogPost({ title: post.title, content: post.content });
    setEditingPostId(post.id);
  };
  
  const handleDeleteBlogPost = (postId: number) => {
    setBlogPosts(prev => prev.filter(post => post.id !== postId));
    
    toast({
      title: "Blogpost verwijderd",
      description: "De blogpost is succesvol verwijderd"
    });
    
    if (editingPostId === postId) {
      setNewBlogPost({ title: "", content: "" });
      setEditingPostId(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>
      
      <Tabs defaultValue="visibility">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visibility">Tab Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="blog">Blog Berichten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visibility" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tab Zichtbaarheid</CardTitle>
              <CardDescription>Configureer welke tabbladen zichtbaar zijn voor gebruikers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(tabsVisibility).map(([tab, isVisible]) => (
                  <div key={tab} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isVisible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-red-500" />}
                      <Label htmlFor={`tab-${tab}`} className="capitalize">{tab}</Label>
                    </div>
                    <Switch
                      id={`tab-${tab}`}
                      checked={isVisible}
                      onCheckedChange={() => handleTabVisibilityChange(tab as keyof typeof tabsVisibility)}
                    />
                  </div>
                ))}
                
                <Button className="mt-4" onClick={handleSaveSettings}>
                  Instellingen opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blog" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Blog Berichten</CardTitle>
              <CardDescription>Beheer informatie berichten voor de info pagina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Blog titel"
                    value={newBlogPost.title}
                    onChange={(e) => setNewBlogPost({...newBlogPost, title: e.target.value})}
                  />
                  <Textarea
                    placeholder="Blog inhoud"
                    className="min-h-32"
                    value={newBlogPost.content}
                    onChange={(e) => setNewBlogPost({...newBlogPost, content: e.target.value})}
                  />
                  <Button onClick={handleAddBlogPost}>
                    {editingPostId !== null ? "Blogpost bijwerken" : "Blogpost toevoegen"}
                  </Button>
                  {editingPostId !== null && (
                    <Button 
                      variant="outline" 
                      className="ml-2"
                      onClick={() => {
                        setNewBlogPost({ title: "", content: "" });
                        setEditingPostId(null);
                      }}
                    >
                      Annuleren
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Bestaande blogposts</h3>
                  {blogPosts.length === 0 ? (
                    <p className="text-muted-foreground">Geen blogposts gevonden</p>
                  ) : (
                    <div className="space-y-4">
                      {blogPosts.map(post => (
                        <Card key={post.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditBlogPost(post)}
                                  className="h-8 w-8 p-0"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="sm" 
                                  onClick={() => handleDeleteBlogPost(post.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </div>
                            <CardDescription>{post.date}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>{post.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
