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
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Transform raw data to BlogPost interface
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
        published_at: settingValue?.published_at
      },
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
};

export const blogService = {
  // Get all blog posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'blog_posts')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return transformBlogPostData(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      throw new Error('Kon blog posts niet laden');
    }
  },

  // Get published blog posts for public display
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'blog_posts')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allPosts = transformBlogPostData(data || []);
      return allPosts.filter(post => post.setting_value.published);
    } catch (error) {
      console.error('Error loading published blog posts:', error);
      throw new Error('Kon gepubliceerde blog posts niet laden');
    }
  },

  // Create new blog post
  async createBlogPost(blogPostData: Omit<BlogPostData, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const data = {
        ...blogPostData,
        setting_name: `post_${Date.now()}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('application_settings')
        .insert([data]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Kon blog post niet aanmaken');
    }
  },

  // Update existing blog post
  async updateBlogPost(id: number, blogPostData: Partial<BlogPostData>): Promise<void> {
    try {
      const data = {
        ...blogPostData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('application_settings')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw new Error('Kon blog post niet bijwerken');
    }
  },

  // Delete blog post
  async deleteBlogPost(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw new Error('Kon blog post niet verwijderen');
    }
  },

  // Toggle blog post published status
  async togglePublishedStatus(id: number, published: boolean): Promise<void> {
    try {
      // First get the current blog post
      const { data: currentPost, error: fetchError } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update the setting_value with the new published status
      const currentValue = currentPost.setting_value || {};
      const updatedSettingValue = Object.assign({}, currentValue, {
        published: published,
        published_at: published ? new Date().toISOString() : null
      });

      const { error } = await supabase
        .from('application_settings')
        .update({ 
          setting_value: updatedSettingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling published status:', error);
      throw new Error('Kon publicatiestatus niet wijzigen');
    }
  }
};

// Legacy exports for backward compatibility
export const fetchBlogPosts = blogService.getPublishedBlogPosts;
export const createBlogPost = blogService.createBlogPost;
export const updateBlogPost = blogService.updateBlogPost;
export const deleteBlogPost = blogService.deleteBlogPost;
