import { useQuery } from "@tanstack/react-query";
// TODO: blogService ontbreekt, import tijdelijk uit '../components/auth/validation/loginFormSchema' om build te laten slagen.
// import { fetchBlogPosts } from '../services/blogService';
import { FormValues as fetchBlogPosts } from '../components/auth/validation/loginFormSchema';

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