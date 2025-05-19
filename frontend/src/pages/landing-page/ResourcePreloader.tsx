import React, { useEffect, useState } from 'react';

// Define the preloader props
interface ResourcePreloaderProps {
  resourceUrls?: string[];  // Optional resource URLs to preload
  showLoader?: boolean;     // Whether to show a loading indicator
  children: React.ReactNode;
}

/**
 * ResourcePreloader Component
 * 
 * This component ensures critical resources (CSS/images/fonts) are fully loaded
 * before rendering child components. This helps prevent visual flashes
 * and missing CSS layers during initial render.
 */
const ResourcePreloader: React.FC<ResourcePreloaderProps> = ({ 
  resourceUrls = [], 
  showLoader = false,
  children 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Function to preload a specific image
    const preloadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          resolve(); // Resolve anyway to continue
        };
        img.src = url;
      });
    };

    // Function to preload a stylesheet
    const preloadStylesheet = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => {
          console.warn(`Failed to preload stylesheet: ${url}`);
          resolve(); // Resolve anyway to continue
        };
        document.head.appendChild(link);
      });
    };

    // Detect resource type and preload accordingly
    const preloadResource = (url: string): Promise<void> => {
      if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        return preloadImage(url);
      }
      if (url.match(/\.css$/i)) {
        return preloadStylesheet(url);
      }
      
      // For other resource types, consider adding specific preload functions
      return Promise.resolve();
    };

    // Force CSS style recalculation
    const forceStyleRecalc = () => {
      // Read a layout property to force style calculation
      document.body.offsetHeight;
    };

    const loadResources = async () => {
      try {
        // Preload all resources in parallel
        if (resourceUrls.length > 0) {
          await Promise.all(resourceUrls.map(url => preloadResource(url)));
        }
        
        // Add a small delay to ensure CSS is fully processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force layout recalculation to ensure styles are applied
        forceStyleRecalc();
        
        // Mark as loaded
        setIsLoaded(true);
      } catch (error) {
        console.error('Resource preloading error:', error);
        // Fail gracefully - still show content
        setIsLoaded(true);
      }
    };

    loadResources();
  }, [resourceUrls]);

  // Loader UI
  if (!isLoaded && showLoader) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If loaded or no loader requested, render children
  return isLoaded || !showLoader ? <>{children}</> : null;
};

export default ResourcePreloader; 