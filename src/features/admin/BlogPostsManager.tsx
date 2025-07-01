
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BlogPost, fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from "@/services/blogService";
import { Edit, Trash2, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const BlogPostsManager: React.FC = () => {
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
    title: "",
    content: "",
    date: new Date().toISOString().split('T')[0],
    tags: []
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadBlogPosts();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTagAdd = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter(t => t !== tag) 
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      tags: []
    });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing !== null) {
        await updateBlogPost(editing, formData);
        toast({
          title: "Blogpost bijgewerkt",
          description: "De blogpost is succesvol bijgewerkt."
        });
      } else {
        await createBlogPost(formData);
        toast({
          title: "Blogpost toegevoegd",
          description: "De nieuwe blogpost is succesvol toegevoegd."
        });
      }
      
      resetForm();
      loadBlogPosts();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de blogpost.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      content: post.content,
      date: post.date,
      tags: post.tags || []
    });
    setEditing(post.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBlogPost(id);
      toast({
        title: "Blogpost verwijderd",
        description: "De blogpost is succesvol verwijderd."
      });
      loadBlogPosts();
      
      if (editing === id) {
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de blogpost.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog Berichten</CardTitle>
        <CardDescription>Beheer informatie berichten voor op de website</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Titel van de blogpost"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <Textarea
                placeholder="Inhoud van de blogpost"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="min-h-32"
                required
              />
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Voeg een tag toe"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleTagAdd} 
                  variant="outline" 
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {tag}
                      <button 
                        type="button" 
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">
                {editing !== null ? "Blogpost bijwerken" : "Blogpost toevoegen"}
              </Button>
              {editing !== null && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
              )}
            </div>
          </form>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bestaande blogposts</h3>
            {loading ? (
              <p>Laden...</p>
            ) : blogPosts.length > 0 ? (
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
                            onClick={() => handleEdit(post)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => handleDelete(post.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{new Date(post.date).toLocaleDateString('nl-NL')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Geen blogposts gevonden</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostsManager;
