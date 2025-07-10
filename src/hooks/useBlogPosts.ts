import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts } from "@/services/blogService";

export const useBlogPosts = () => {
  return useQuery({
    queryKey: ['blogPosts'],
    queryFn: fetchBlogPosts,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes - cache cleanup after 10 min
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
}; 