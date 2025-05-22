import { useEffect } from 'react';
import { useDevice } from '../../hooks/useDevice';

/**
 * Custom hook to optimize animations for mobile devices
 * 
 * This hook modifies Framer Motion animations at runtime based on device capabilities.
 * It specifically targets scroll-triggered animations to prevent jank.
 */
export const useAnimationOptimizer = () => {
  const { isMobile, isTouch } = useDevice();
  
  useEffect(() => {
    if (!isMobile) return;
    
    // Create a style element for mobile-specific CSS optimizations
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'mobile-animation-optimizer');
    
    // Add CSS that optimizes animations for mobile
    styleEl.textContent = `
      @media (max-width: 767px) {
        /* Improve scroll performance by hinting content-visibility to the browser */
        .motion-element {
          content-visibility: auto;
          contain-intrinsic-size: auto 500px;
          contain: content;
        }
        
        /* Force compositing layers for animations */
        [data-framer-motion], 
        .motion-element,
        motion.div {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000;
          will-change: transform, opacity;
        }
        
        /* Smooth out transitions */
        .animate-pulse {
          animation-duration: 3s !important;
        }
        
        /* Support reduced motion preference */
        @media (prefers-reduced-motion) {
          [data-framer-motion], 
          .motion-element,
          motion.div {
            transition-duration: 0.1s !important;
            animation-duration: 0.1s !important;
          }
        }
      }
    `;
    
    document.head.appendChild(styleEl);
    
    // Apply runtime patches to Framer Motion for better mobile performance
    const optimizeFramerMotion = () => {
      // Check if window and document exist (SSR check)
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      
      // Target all framer-motion elements
      const motionElements = document.querySelectorAll('[data-framer-motion], .motion-element');
      
      // Add inert attribute to elements far from viewport to reduce processing
      // This function now only handles elements that might be missed by IntersectionObserver
      const updateVisibility = () => {
        motionElements.forEach(el => {
          if (!(el instanceof HTMLElement)) return;
          
          // Skip elements already being tracked by IntersectionObserver
          if (el.dataset.observerAttached) return;
          
          const rect = el.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // If element is far away from viewport (more than 2x viewport height),
          // mark it as inert to reduce processing
          if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) {
            el.dataset.optimizerInert = 'true';
            el.style.willChange = 'auto';
          } else {
            delete el.dataset.optimizerInert;
            el.style.willChange = 'transform, opacity';
          }
        });
      };
      
      // Use Intersection Observer for more efficient updates
      const observer = new IntersectionObserver((entries) => {
        // Process each observed element and update its visibility state
        entries.forEach(entry => {
          if (entry.target instanceof HTMLElement) {
            // When element enters viewport
            if (entry.isIntersecting) {
              // Remove inert status if it was previously marked
              delete entry.target.dataset.optimizerInert;
              entry.target.style.willChange = 'transform, opacity';
            } else {
              // When element leaves viewport
              entry.target.dataset.optimizerInert = 'true';
              entry.target.style.willChange = 'auto';
            }
          }
        });
      }, {
        rootMargin: "500px 0px 500px 0px"  // Large margins to pre-load animations
      });
      
      // Observe all motion elements
      motionElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.dataset.observerAttached = 'true';
        }
        observer.observe(el);
      });
      
      // Initial visibility update
      updateVisibility();
      
      // Update on scroll but use requestAnimationFrame for efficiency
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateVisibility();
            ticking = false;
          });
          ticking = true;
        }
      };
      
      // Apply scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Return cleanup function
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
        motionElements.forEach(el => {
          if (el instanceof HTMLElement) {
            // Clean up all our custom attributes
            delete el.dataset.optimizerInert;
            delete el.dataset.observerAttached;
            
            // Reset will-change to avoid memory leaks
            el.style.willChange = 'auto';
          }
        });
      };
    };
    
    // Execute the optimization
    const cleanup = optimizeFramerMotion();
    
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      if (cleanup) cleanup();
    };
  }, [isMobile, isTouch]);
};

export default useAnimationOptimizer;
