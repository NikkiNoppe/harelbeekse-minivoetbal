import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getRouteMeta } from "@/config/routes";

/**
 * Hook to update document title and meta tags based on current route
 */
export const useRouteMeta = () => {
  const location = useLocation();
  const meta = getRouteMeta(location.pathname);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (meta) {
      // Update document title
      document.title = `${meta.title} - Harelbeekse Minivoetbal`;
      
      // Update or create meta description
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (metaDescription) {
        metaDescription.content = meta.description;
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = meta.description;
        document.head.appendChild(metaDescription);
      }
      
      // Update Open Graph meta tags (optional - for social sharing)
      const updateMetaProperty = (property: string, content: string) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (metaTag) {
          metaTag.content = content;
        } else {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          metaTag.content = content;
          document.head.appendChild(metaTag);
        }
      };
      
      // Update Open Graph title
      updateMetaProperty('og:title', `${meta.title} - Harelbeekse Minivoetbal`);
      
      // Update Open Graph description
      updateMetaProperty('og:description', meta.description);
      
      // Update Open Graph URL
      updateMetaProperty('og:url', `${baseUrl}${location.pathname}`);
      
      // Update Twitter meta tags (optional)
      const updateTwitterMeta = (name: string, content: string) => {
        let metaTag = document.querySelector(`meta[name="twitter:${name}"]`) as HTMLMetaElement;
        if (metaTag) {
          metaTag.content = content;
        } else {
          metaTag = document.createElement('meta');
          metaTag.name = `twitter:${name}`;
          metaTag.content = content;
          document.head.appendChild(metaTag);
        }
      };
      
      // Update Twitter title
      updateTwitterMeta('title', `${meta.title} - Harelbeekse Minivoetbal`);
      
      // Update Twitter description
      updateTwitterMeta('description', meta.description);
    } else {
      // Fallback to default title
      document.title = 'Harelbeekse Minivoetbal';
    }
  }, [meta, location.pathname, baseUrl]);
};

