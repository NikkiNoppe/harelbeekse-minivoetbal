
import { supabase } from "../MINIVOETBAL.SDK/client";

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('application_settings')
    .select('setting_name, setting_value')
    .eq('setting_category', 'blog_posts')
    .eq('is_active', true);
  
  if (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }
  
  // Convert application_settings data to BlogPost format
  const blogPosts: BlogPost[] = (data || [])
    .map(item => {
      const postData = item.setting_value as any;
      return {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        date: postData.date,
        tags: postData.tags || []
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return blogPosts;
}

export async function createBlogPost(blogPost: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  // Generate a new ID (we'll use timestamp for uniqueness)
  const newId = Date.now();
  const postWithId = { ...blogPost, id: newId };
  
  const { data, error } = await supabase
    .from('application_settings')
    .insert([{
      setting_category: 'blog_posts',
      setting_name: `post_${newId}`,
      setting_value: postWithId,
      is_active: true
    }])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating blog post:", error);
    throw error;
  }
  
  return postWithId;
}

export async function updateBlogPost(id: number, blogPost: Partial<Omit<BlogPost, 'id'>>): Promise<BlogPost> {
  // First get the existing post to merge with updates
  const { data: existingData, error: fetchError } = await supabase
    .from('application_settings')
    .select('setting_value')
    .eq('setting_category', 'blog_posts')
    .eq('setting_name', `post_${id}`)
    .single();
  
  if (fetchError) {
    console.error("Error fetching existing blog post:", fetchError);
    throw fetchError;
  }
  
  const existingPost = existingData.setting_value as any;
  const updatedPost = { ...existingPost, ...blogPost };
  
  const { data, error } = await supabase
    .from('application_settings')
    .update({
      setting_value: updatedPost
    })
    .eq('setting_category', 'blog_posts')
    .eq('setting_name', `post_${id}`)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating blog post:", error);
    throw error;
  }
  
  return updatedPost;
}

export async function deleteBlogPost(id: number): Promise<void> {
  const { error } = await supabase
    .from('application_settings')
    .delete()
    .eq('setting_category', 'blog_posts')
    .eq('setting_name', `post_${id}`);
  
  if (error) {
    console.error("Error deleting blog post:", error);
    throw error;
  }
}
