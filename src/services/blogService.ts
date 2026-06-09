import { supabase } from '@/integrations/supabase/client';
import { withUserContext } from '@/lib/supabaseUtils';
import {
  applicationSettingInsert,
  applicationSettingUpdate,
} from '@/services/applicationSettingsUtils';
import { fetchPublicApplicationSettings } from '@/services/public/publicApplicationSettingsFetch';

export interface BlogPostData {
  id?: number;
  setting_category: string;
  setting_name: string;
  setting_value: {
    title: string;
    content: string;
    published: boolean;
    published_at?: string;
  };
}

export interface BlogPost {
  id: number;
  setting_category: string;
  setting_name: string;
  setting_value: {
    title: string;
    content: string;
    published: boolean;
    published_at?: string;
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

const transformBlogPostData = (data: any[]): BlogPost[] => {
  return data.map(item => {
    const settingValue = typeof item.setting_value === 'string'
      ? JSON.parse(item.setting_value)
      : item.setting_value;

    return {
      id: item.id,
      setting_category: item.setting_category,
      setting_name: item.setting_name,
      setting_value: {
        title: settingValue?.title || '',
        content: settingValue?.content || '',
        published: settingValue?.published || false,
        published_at: settingValue?.published_at,
      },
    };
  });
};

export const blogService = {
  async getAllBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .select('*')
          .eq('setting_category', 'blog_posts')
          .order('id', { ascending: false });
      });

      if (error) throw error;
      return transformBlogPostData(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      throw new Error('Kon blog posts niet laden');
    }
  },

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    try {
      const rows = await fetchPublicApplicationSettings(['blog_posts']);
      const sorted = [...rows].sort((a, b) => b.id - a.id);
      return transformBlogPostData(sorted);
    } catch (error) {
      console.error('Error loading published blog posts:', error);
      throw new Error('Kon gepubliceerde blog posts niet laden');
    }
  },

  async createBlogPost(blogPostData: Omit<BlogPostData, 'id'>): Promise<void> {
    try {
      const settingValue = { ...blogPostData.setting_value };
      if (settingValue.published && !settingValue.published_at) {
        settingValue.published_at = new Date().toISOString();
      }

      const row = applicationSettingInsert({
        setting_category: 'blog_posts',
        setting_name: blogPostData.setting_name || `blog_post_${Date.now()}`,
        setting_value: settingValue,
      });

      const { error } = await withUserContext(async () => {
        return await supabase.from('application_settings').insert([row]);
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error(getErrorMessage(error, 'Kon blog post niet aanmaken'));
    }
  },

  async updateBlogPost(id: number, blogPostData: Partial<BlogPostData>): Promise<void> {
    try {
      if (!blogPostData.setting_value) {
        throw new Error('Geen bloggegevens om bij te werken');
      }

      const settingValue = { ...blogPostData.setting_value };
      if (settingValue.published && !settingValue.published_at) {
        settingValue.published_at = new Date().toISOString();
      }
      if (!settingValue.published) {
        delete settingValue.published_at;
      }

      const data = applicationSettingUpdate({
        setting_value: settingValue,
      });

      const { data: updatedRows, error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .update(data)
          .eq('id', id)
          .eq('setting_category', 'blog_posts')
          .select('id');
      });

      if (error) throw error;
      if (!updatedRows?.length) {
        throw new Error('Blog post niet gevonden of geen rechten om bij te werken');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw new Error(getErrorMessage(error, 'Kon blog post niet bijwerken'));
    }
  },

  async deleteBlogPost(id: number): Promise<void> {
    try {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .delete()
          .eq('id', id)
          .eq('setting_category', 'blog_posts');
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw new Error(getErrorMessage(error, 'Kon blog post niet verwijderen'));
    }
  },

  async togglePublishedStatus(id: number, published: boolean): Promise<void> {
    try {
      const { data: currentRow, error: fetchError } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .select('setting_value')
          .eq('id', id)
          .eq('setting_category', 'blog_posts')
          .single();
      });

      if (fetchError) throw fetchError;

      const currentValue =
        typeof currentRow.setting_value === 'string'
          ? JSON.parse(currentRow.setting_value)
          : currentRow.setting_value;

      const updatedValue = {
        ...currentValue,
        published,
        ...(published
          ? { published_at: currentValue?.published_at || new Date().toISOString() }
          : {}),
      };
      if (!published) {
        delete updatedValue.published_at;
      }

      const { data: updatedRows, error } = await withUserContext(async () => {
        return await supabase
          .from('application_settings')
          .update(applicationSettingUpdate({ setting_value: updatedValue }))
          .eq('id', id)
          .eq('setting_category', 'blog_posts')
          .select('id');
      });

      if (error) throw error;
      if (!updatedRows?.length) {
        throw new Error('Blog post niet gevonden of geen rechten om status te wijzigen');
      }
    } catch (error) {
      console.error('Error toggling published status:', error);
      throw new Error(getErrorMessage(error, 'Kon publicatiestatus niet wijzigen'));
    }
  },
};

export const fetchBlogPosts = blogService.getPublishedBlogPosts;
export const createBlogPost = blogService.createBlogPost;
export const updateBlogPost = blogService.updateBlogPost;
export const deleteBlogPost = blogService.deleteBlogPost;
