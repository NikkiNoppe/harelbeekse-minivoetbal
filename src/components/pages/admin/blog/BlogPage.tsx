import React, { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppModal, AppModalFooter } from "@/components/modals";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { blogService, type BlogPost } from "@/services/blogService";
import {
  ADMIN_BLOG_POSTS_QUERY_KEY,
  useAdminBlogPosts,
} from "@/hooks/useAdminBlogPosts";
import { Plus, Edit, Trash2, AlertCircle, Loader2, BookOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_FORM_DATA = {
  title: "",
  content: "",
  published: false,
};

const BlogTableSkeleton = () => (
  <div className="w-full overflow-x-auto">
    <div className="min-w-[650px] space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </div>
);

const BlogPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    blogPosts = [],
    isListLoading,
    isRefreshing,
    showError,
    showEmpty,
    error,
    refetch,
  } = useAdminBlogPosts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_BLOG_POSTS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    await refetch();
  }, [queryClient, refetch]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingPost(null);
  }, []);

  const handleOpenNew = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    },
    [resetForm],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const settingValue: BlogPost["setting_value"] = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          published: formData.published,
        };
        if (formData.published) {
          settingValue.published_at =
            editingPost?.setting_value.published_at || new Date().toISOString();
        }

        if (editingPost) {
          await blogService.updateBlogPost(editingPost.id, {
            setting_value: settingValue,
          });
          toast({ title: "Success", description: "Blog post bijgewerkt" });
        } else {
          await blogService.createBlogPost({
            setting_category: "blog_posts",
            setting_name: `blog_post_${Date.now()}`,
            setting_value: settingValue,
          });
          toast({ title: "Success", description: "Blog post aangemaakt" });
        }
        setIsDialogOpen(false);
        resetForm();
        await refreshData();
      } catch (err) {
        console.error("Error saving blog post:", err);
        toast({
          title: "Fout",
          description:
            err instanceof Error ? err.message : "Kon blog post niet opslaan",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [formData, editingPost, toast, resetForm, refreshData],
  );

  const handleEdit = useCallback((post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.setting_value.title,
      content: post.setting_value.content,
      published: post.setting_value.published,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Weet je zeker dat je deze blog post wilt verwijderen?")) return;
      try {
        await blogService.deleteBlogPost(id);
        toast({ title: "Success", description: "Blog post verwijderd" });
        await refreshData();
      } catch (err) {
        console.error("Error deleting blog post:", err);
        toast({
          title: "Fout",
          description:
            err instanceof Error ? err.message : "Kon blog post niet verwijderen",
          variant: "destructive",
        });
      }
    },
    [toast, refreshData],
  );

  const togglePublished = useCallback(
    async (post: BlogPost, published: boolean) => {
      if (published === post.setting_value.published) return;
      try {
        await blogService.togglePublishedStatus(post.id, published);
        toast({
          title: "Success",
          description: published
            ? "Blog post gepubliceerd"
            : "Blog post gedepubliceerd",
        });
        await refreshData();
      } catch (err) {
        console.error("Error toggling published status:", err);
        toast({
          title: "Fout",
          description:
            err instanceof Error
              ? err.message
              : "Kon publicatiestatus niet wijzigen",
          variant: "destructive",
        });
      }
    },
    [toast, refreshData],
  );

  return (
    <div className="space-y-6 w-full motion-safe:animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            Blogs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Beheer nieuwsberichten op de publieke site
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isRefreshing && !isListLoading && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Vernieuwen…
            </span>
          )}
          <Button className="btn btn--primary w-full sm:w-auto min-h-[44px]" onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Blog
          </Button>
        </div>
      </div>

      <AppModal
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={editingPost ? "Blog Post Bewerken" : "Nieuwe Blog Post"}
        subtitle={
          editingPost
            ? "Bewerk de blog post details"
            : "Maak een nieuwe blog post aan"
        }
        size="lg"
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titel
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Inhoud
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={10}
              required
              placeholder="Volledige inhoud van de blog post..."
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-muted">
            <Switch
              id="blog-published"
              checked={formData.published}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, published: checked }))
              }
            />
            <Label
              htmlFor="blog-published"
              className="text-sm font-medium text-card-foreground cursor-pointer"
            >
              Gepubliceerd
            </Label>
          </div>

          <AppModalFooter>
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="btn btn--secondary w-full sm:w-auto min-h-[44px]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn--primary w-full sm:w-auto min-h-[44px]"
            >
              {isSaving
                ? "Opslaan…"
                : editingPost
                  ? "Bijwerken"
                  : "Aanmaken"}
            </button>
          </AppModalFooter>
        </form>
      </AppModal>

      <Card>
        <CardHeader className="pb-2" />
        <CardContent>
          {isListLoading ? (
            <BlogTableSkeleton />
          ) : showError ? (
            <div className="py-8 text-center" role="alert">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" aria-hidden />
              <h3 className="text-lg font-semibold mb-2">Fout bij laden</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Kon blog posts niet laden."}
              </p>
              <Button
                type="button"
                onClick={() => void refetch()}
                className="min-h-[44px]"
              >
                Opnieuw proberen
              </Button>
            </div>
          ) : showEmpty ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nog geen blog posts aangemaakt.
            </p>
          ) : (
            <div
              className={`w-full overflow-x-auto transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
            >
              <div className="min-w-[650px]">
                <Table className="table w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Titel</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Gemaakt</TableHead>
                      <TableHead className="text-center min-w-[120px]">
                        Acties
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          {post.setting_value.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={post.setting_value.published}
                              onCheckedChange={(checked) =>
                                void togglePublished(post, checked)
                              }
                              className="min-h-[44px] min-w-[44px] scale-90"
                              aria-label={
                                post.setting_value.published
                                  ? `${post.setting_value.title} depubliceren`
                                  : `${post.setting_value.title} publiceren`
                              }
                            />
                            <Badge
                              variant={
                                post.setting_value.published
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {post.setting_value.published
                                ? "Gepubliceerd"
                                : "Concept"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.setting_value.published_at
                            ? new Date(
                                post.setting_value.published_at,
                              ).toLocaleDateString("nl-NL")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              className="btn btn--icon btn--edit min-h-[44px] min-w-[44px]"
                              onClick={() => handleEdit(post)}
                              size="sm"
                              aria-label={`Bewerk ${post.setting_value.title}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              className="btn btn--icon btn--danger min-h-[44px] min-w-[44px]"
                              onClick={() => void handleDelete(post.id)}
                              size="sm"
                              aria-label={`Verwijder ${post.setting_value.title}`}
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
