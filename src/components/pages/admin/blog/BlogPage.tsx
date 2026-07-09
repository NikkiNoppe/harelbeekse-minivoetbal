import React, { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppModal, AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { blogService, type BlogPost } from "@/services/blogService";
import {
  ADMIN_BLOG_POSTS_QUERY_KEY,
  useAdminBlogPosts,
} from "@/hooks/useAdminBlogPosts";
import { useBranding } from "@/hooks/useBranding";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { PageHeader } from "@/components/layout";
import { Plus, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import BlogList, { type BlogStatusFilter } from "./components/BlogList";

const DEFAULT_FORM_DATA = {
  title: "",
  content: "",
  published: false,
};

const BlogPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const branding = useBranding();
  const {
    organizationId,
    blogPosts = [],
    isListLoading,
    isRefreshing,
    showError,
    error,
    refetch,
  } = useAdminBlogPosts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: withOrgQueryKey(ADMIN_BLOG_POSTS_QUERY_KEY, organizationId),
    });
    await queryClient.invalidateQueries({
      queryKey: withOrgQueryKey(["blogPosts"], organizationId),
    });
    await refetch();
  }, [queryClient, organizationId, refetch]);

  const publishedCount = useMemo(
    () => blogPosts.filter((post) => post.setting_value.published).length,
    [blogPosts],
  );
  const draftCount = blogPosts.length - publishedCount;

  const filteredPosts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return blogPosts.filter((post) => {
      const matchesSearch =
        !normalizedSearch ||
        post.setting_value.title.toLowerCase().includes(normalizedSearch) ||
        post.setting_value.content.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.setting_value.published) ||
        (statusFilter === "draft" && !post.setting_value.published);
      return matchesSearch && matchesStatus;
    });
  }, [blogPosts, searchTerm, statusFilter]);

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
          toast({ title: "Opgeslagen", description: "Blogbericht bijgewerkt" });
        } else {
          await blogService.createBlogPost({
            setting_category: "blog_posts",
            setting_name: `blog_post_${Date.now()}`,
            setting_value: settingValue,
          });
          toast({ title: "Aangemaakt", description: "Blogbericht toegevoegd" });
        }
        setIsDialogOpen(false);
        resetForm();
        await refreshData();
      } catch (err) {
        console.error("Error saving blog post:", err);
        toast({
          title: "Fout",
          description:
            err instanceof Error ? err.message : "Kon blogbericht niet opslaan",
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

  const handleDeleteClick = useCallback((post: BlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await blogService.deleteBlogPost(postToDelete.id);
      toast({ title: "Verwijderd", description: "Blogbericht verwijderd" });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      await refreshData();
    } catch (err) {
      console.error("Error deleting blog post:", err);
      toast({
        title: "Fout",
        description:
          err instanceof Error ? err.message : "Kon blogbericht niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [postToDelete, toast, refreshData]);

  const togglePublished = useCallback(
    async (post: BlogPost, published: boolean) => {
      if (published === post.setting_value.published) return;
      try {
        await blogService.togglePublishedStatus(post.id, published);
        toast({
          title: "Bijgewerkt",
          description: published
            ? "Blogbericht gepubliceerd"
            : "Blogbericht naar concept gezet",
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

  const addButton = (
    <Button
      type="button"
      onClick={handleOpenNew}
      className="min-h-[44px] w-full sm:w-auto"
      aria-label="Nieuw blogbericht aanmaken"
    >
      <Plus className="h-4 w-4" />
      Nieuw bericht
    </Button>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
      <PageHeader
        title="Blog beheer"
        subtitle={`Beheer nieuwsberichten voor ${branding.displayName} (${blogPosts.length} bericht${blogPosts.length === 1 ? "" : "en"})`}
        rightAction={
          isRefreshing && !isListLoading ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Vernieuwen…
            </span>
          ) : undefined
        }
      />

      {showError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {error instanceof Error
                ? error.message
                : "Kon blogberichten niet laden."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!showError && (
        <BlogList
          posts={filteredPosts}
          loading={isListLoading}
          isRefreshing={isRefreshing}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onTogglePublished={(post, published) => void togglePublished(post, published)}
          addButton={addButton}
          totalCount={blogPosts.length}
          publishedCount={publishedCount}
          draftCount={draftCount}
        />
      )}

      <AppModal
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={editingPost ? "Blogbericht bewerken" : "Nieuw blogbericht"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blog-title">Titel</Label>
            <Input
              id="blog-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-content">Inhoud</Label>
            <Textarea
              id="blog-content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={10}
              required
              placeholder="Volledige inhoud van het blogbericht…"
              className="min-h-[200px]"
            />
          </div>

          <div className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <Switch
              id="blog-published"
              checked={formData.published}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, published: checked }))
              }
            />
            <Label htmlFor="blog-published" className="cursor-pointer font-medium">
              Direct publiceren op de website
            </Label>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="min-h-[44px]"
              disabled={isSaving}
            >
              Annuleren
            </Button>
            <Button type="submit" className="min-h-[44px]" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan…
                </>
              ) : editingPost ? (
                "Wijzigingen opslaan"
              ) : (
                "Bericht aanmaken"
              )}
            </Button>
          </div>
        </form>
      </AppModal>

      <AppAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Blogbericht verwijderen"
        size="sm"
        description={
          <DestructiveConfirmDescription
            message={
              <>
                Weet je zeker dat je{" "}
                <span className="font-semibold text-destructive">
                  {postToDelete?.setting_value.title}
                </span>{" "}
                wilt verwijderen?
              </>
            }
          />
        }
        confirmAction={{
          label: isDeleting ? "Verwijderen…" : "Verwijderen",
          onClick: () => void handleConfirmDelete(),
          variant: "destructive",
          disabled: isDeleting,
          loading: isDeleting,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => {
            setDeleteDialogOpen(false);
            setPostToDelete(null);
          },
          disabled: isDeleting,
        }}
      />
    </div>
  );
};

export default BlogPage;
