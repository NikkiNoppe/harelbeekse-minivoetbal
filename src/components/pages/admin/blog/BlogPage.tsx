import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { blogService, type BlogPost } from '@/services/blogService';
import { Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Constants outside component to prevent re-creation
const DEFAULT_FORM_DATA = {
  title: '',
  content: '',
  published: false
};

const BlogPage: React.FC = () => {
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Optimized load function using service
  const loadBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await blogService.getAllBlogPosts();
      setBlogPosts(posts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast({
        title: 'Error',
        description: 'Kon blog posts niet laden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBlogPosts();
  }, [loadBlogPosts]);

  // Optimized CRUD functions with useCallback
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingPost(null);
    setIsDialogOpen(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const blogPostData = {
        setting_category: 'blog_posts',
        setting_name: editingPost ? editingPost.setting_name : `blog_post_${Date.now()}`,
        setting_value: {
          title: formData.title,
          content: formData.content,
          published: formData.published,
          published_at: formData.published && !editingPost ? new Date().toISOString() : undefined
        },
        is_active: true
      };

      if (editingPost) {
        await blogService.updateBlogPost(editingPost.id, blogPostData);
        toast({ title: 'Success', description: 'Blog post bijgewerkt' });
      } else {
        await blogService.createBlogPost(blogPostData);
        toast({ title: 'Success', description: 'Blog post aangemaakt' });
      }

      resetForm();
      loadBlogPosts();
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: 'Error',
        description: 'Kon blog post niet opslaan',
        variant: 'destructive'
      });
    }
  }, [formData, editingPost, toast, resetForm, loadBlogPosts]);

  const handleEdit = useCallback((post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.setting_value.title,
      content: post.setting_value.content,
      published: post.setting_value.published
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Weet je zeker dat je deze blog post wilt verwijderen?')) return;

    try {
      await blogService.deleteBlogPost(id);
      toast({ title: 'Success', description: 'Blog post verwijderd' });
      loadBlogPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: 'Error',
        description: 'Kon blog post niet verwijderen',
        variant: 'destructive'
      });
    }
  }, [toast, loadBlogPosts]);

  const togglePublished = useCallback(async (post: BlogPost) => {
    try {
      await blogService.togglePublishedStatus(post.id, !post.setting_value.published);
      toast({
        title: 'Success',
        description: `Blog post ${!post.setting_value.published ? 'gepubliceerd' : 'gedepubliceerd'}`
      });
      loadBlogPosts();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast({
        title: 'Error',
        description: 'Kon publicatiestatus niet wijzigen',
        variant: 'destructive'
      });
    }
  }, [toast, loadBlogPosts]);

  // Memoized onChange handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  }, []);

  const handlePublishedChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, published: checked }));
  }, []);

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Laden...</div>
    </div>
  ), []);

  if (loading) return LoadingComponent;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="btn btn--primary"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Blog
            </Button>
          </DialogTrigger>
          <DialogContent className="modal max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Blog Post Bewerken' : 'Nieuwe Blog Post'}
              </DialogTitle>
              <DialogDescription>
                {editingPost ? 'Bewerk de blog post details' : 'Maak een nieuwe blog post aan'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className="w-full"
                  />
                </div>
              
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium">Inhoud</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={handleContentChange}
                  rows={10}
                  required
                  placeholder="Volledige inhoud van de blog post..."
                  className="w-full"
                />
              </div>
            </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                <Switch
                  checked={formData.published}
                  onCheckedChange={handlePublishedChange}
                />
                <Label htmlFor="published" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Gepubliceerd
                </Label>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  className="btn btn--primary w-full sm:w-auto"
                >
                  {editingPost ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
        </CardHeader>
        <CardContent>
          {blogPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen blog posts aangemaakt.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[650px]">
                <Table className="table w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Titel</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Gemaakt</TableHead>
                      <TableHead className="text-center min-w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.setting_value.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={post.setting_value.published}
                            onCheckedChange={() => togglePublished(post)}
                            className="scale-75"
                          />
                          <Badge variant={post.setting_value.published ? 'default' : 'secondary'} className="text-xs">
                            {post.setting_value.published ? 'Gepubliceerd' : 'Concept'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            className="btn btn--icon btn--edit"
                            onClick={() => handleEdit(post)}
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            className="btn btn--icon btn--danger"
                            onClick={() => handleDelete(post.id)}
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

export default BlogPage;
