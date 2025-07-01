import { supabase } from "@shared/integrations/supabase/client";

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  is_published: boolean;
}

export interface BlogPostCreate {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  is_published?: boolean;
}

export interface BlogPostUpdate {
  title?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  is_published?: boolean;
}

class BlogService {
  async getBlogPosts(limit: number = 10): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBlogPosts:', error);
      return [];
    }
  }

  async getBlogPostById(id: number): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching blog post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBlogPostById:', error);
      return null;
    }
  }

  async createBlogPost(post: BlogPostCreate): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([post])
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createBlogPost:', error);
      return null;
    }
  }

  async updateBlogPost(id: number, updates: BlogPostUpdate): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating blog post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateBlogPost:', error);
      return null;
    }
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blog post:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBlogPost:', error);
      return false;
    }
  }

  async getBlogPostsByCategory(category: string, limit: number = 10): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category', category)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching blog posts by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBlogPostsByCategory:', error);
      return [];
    }
  }

  async searchBlogPosts(query: string, limit: number = 10): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching blog posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchBlogPosts:', error);
      return [];
    }
  }
}

export const blogService = new BlogService();
