import { useState, useEffect } from 'react';
import { blogService, BlogPost } from '@shared/services/blogService';

interface UseBlogsReturn {
  blogs: BlogPost[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBlogs = (limit: number = 10): UseBlogsReturn => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogService.getBlogPosts(limit);
      setBlogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het laden van de blogs');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [limit]);

  return {
    blogs,
    loading,
    error,
    refetch: fetchBlogs
  };
}; 