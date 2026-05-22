import { supabase } from '@/integrations/supabase/client';

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

const getCurrentUserId = (): number => {
  try {
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.user_id || -1;
    }
  } catch {
    // ignore
  }
  return -1;
};

export const blogService = {
  async getAllBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'blog_posts')
        .order('id', { ascending: false });

      if (error) throw error;
      return transformBlogPostData(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      throw new Error('Kon blog posts niet laden');
    }
  },

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'blog_posts')
        .order('id', { ascending: false });

      if (error) throw error;

      const allPosts = transformBlogPostData(data || []);
      return allPosts.filter(post => post.setting_value.published);
    } catch (error) {
      console.error('Error loading published blog posts:', error);
      throw new Error('Kon gepubliceerde blog posts niet laden');
    }
  },

  async createBlogPost(blogPostData: Omit<BlogPostData, 'id'>): Promise<void> {
    const userId = getCurrentUserId();
    const { data, error } = await supabase.rpc('manage_blog_post', {
      p_user_id: userId,
      p_operation: 'create',
      p_setting_value: blogPostData.setting_value as any,
    });

    if (error) throw error;
    const result = data as any;
    if (result && !result.success) {
      throw new Error(result.error || 'Kon blog post niet aanmaken');
    }
  },

  async updateBlogPost(id: number, blogPostData: Partial<BlogPostData>): Promise<void> {
    const userId = getCurrentUserId();
    const { data, error } = await supabase.rpc('manage_blog_post', {
      p_user_id: userId,
      p_operation: 'update',
      p_id: id,
      p_setting_value: blogPostData.setting_value as any,
    });

    if (error) throw error;
    const result = data as any;
    if (result && !result.success) {
      throw new Error(result.error || 'Kon blog post niet bijwerken');
    }
  },

  async deleteBlogPost(id: number): Promise<void> {
    const userId = getCurrentUserId();
    const { data, error } = await supabase.rpc('manage_blog_post', {
      p_user_id: userId,
      p_operation: 'delete',
      p_id: id,
    });

    if (error) throw error;
    const result = data as any;
    if (result && !result.success) {
      throw new Error(result.error || 'Kon blog post niet verwijderen');
    }
  },

  async togglePublishedStatus(id: number, published: boolean): Promise<void> {
    const userId = getCurrentUserId();
    const { data, error } = await supabase.rpc('manage_blog_post', {
      p_user_id: userId,
      p_operation: 'toggle_published',
      p_id: id,
      p_published: published,
    });

    if (error) throw error;
    const result = data as any;
    if (result && !result.success) {
      throw new Error(result.error || 'Kon publicatiestatus niet wijzigen');
    }
  },
};

export const fetchBlogPosts = blogService.getPublishedBlogPosts;
export const createBlogPost = blogService.createBlogPost;
export const updateBlogPost = blogService.updateBlogPost;
export const deleteBlogPost = blogService.deleteBlogPost;
