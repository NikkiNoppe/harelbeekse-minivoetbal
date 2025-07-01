
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }
  
  return data || [];
}

export async function createBlogPost(blogPost: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blogs')
    .insert([blogPost])
    .select()
    .single();
  
  if (error) {
    console.error("Error creating blog post:", error);
    throw error;
  }
  
  return data;
}

export async function updateBlogPost(id: number, blogPost: Partial<Omit<BlogPost, 'id'>>): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blogs')
    .update(blogPost)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating blog post:", error);
    throw error;
  }
  
  return data;
}

export async function deleteBlogPost(id: number): Promise<void> {
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting blog post:", error);
    throw error;
  }
}
