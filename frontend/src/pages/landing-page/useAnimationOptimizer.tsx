import { useEffect } from 'react';
import { useDevice } from '../../hooks/useDevice';

/**
 * Custom hook to optimize animations for mobile devices
 * 
 * This hook completely disables animations on mobile devices to improve performance
 * while preserving the desktop experience.
 */
export const useAnimationOptimizer = () => {
  const { isMobile, isTouch } = useDevice();
  
  useEffect(() => {
    if (!isMobile) return;
    
    // Create a style element for mobile-specific CSS optimizations
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'mobile-animation-optimizer');
    
    // Add CSS that completely disables animations for mobile
    styleEl.textContent = `
      @media (max-width: 767px) {
        /* Completely turn off animations on mobile */
        [data-framer-motion], 
        .motion-element,
        motion.div,
        .animate-pulse,
        [class*="animate-"] {
          animation: none !important;
          transition: none !important;
          transform: none !important;
          will-change: auto !important;
        }
        
        /* Improve scroll performance by hinting content-visibility to the browser */
        .motion-element {
          content-visibility: auto;
          contain-intrinsic-size: auto 500px;
          contain: content;
        }
        
        /* Turn off special effects to save GPU */
        .blur-3xl,
        .blur-2xl,
        .blur-xl,
        .blur-lg,
        .blur-md,
        .blur-sm,
        .blur {
          filter: none !important;
          opacity: 0.7 !important;
        }
        
        /* Hide purely decorative elements */
        .absolute.rounded-full.animate-pulse,
        .absolute.inset-0.bg-gradient-to-r.from-transparent,
        .absolute.w-full.h-full.rounded-full[style*="animate"] {
          display: none !important;
        }
        
        /* Disable backdrop blur effects */
        .backdrop-blur-sm,
        .backdrop-blur-md,
        .backdrop-blur-lg,
        .backdrop-blur-xl,
        .backdrop-blur-2xl,
        .backdrop-blur-3xl,
        .backdrop-blur {
          backdrop-filter: none !important;
        }
        
        /* Support reduced motion preference */
        @media (prefers-reduced-motion) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      }
    `;
    
    document.head.appendChild(styleEl);
    
    // Apply runtime modifications to completely disable Framer Motion
    const disableFramerMotion = () => {
      // Check if window and document exist (SSR check)
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      
      // Identify Framer Motion components and disable them
      const framerMotionComponents = {
        // Motion divs that animate
        motionDivs: document.querySelectorAll('[data-framer-motion], .motion-element, motion.div'),
        // Special effects (particles, gradients)
        effects: document.querySelectorAll('.rounded-full.animate-pulse, [class*="bg-gradient"]'),
        // Interactive elements (hover animations)
        interactive: document.querySelectorAll('[whilehover], [whiletap], [whilefocus]')
      };
      
      // Process each Framer Motion component
      Object.values(framerMotionComponents).forEach(elements => {
        elements.forEach(el => {
          if (!(el instanceof HTMLElement)) return;
          
          // Apply direct style changes to disable animations
          el.style.animation = 'none';
          el.style.transition = 'none';
          el.style.transform = 'none';
          el.style.willChange = 'auto';
          
          // Add data attribute to mark as optimized
          el.dataset.animationsDisabled = 'true';
          
          // Remove any animation classes
          if (el.classList.contains('animate-pulse')) {
            el.classList.remove('animate-pulse');
          }
          
          // For some components, we may want to hide them completely
          if (
            el.classList.contains('blur-3xl') || 
            el.classList.contains('blur-2xl') || 
            (el.style && el.style.filter && el.style.filter.includes('blur'))
          ) {
            el.style.filter = 'none';
            el.style.opacity = '0.7';
          }
          
          // Special handling for background visual elements that are purely decorative
          if (
            (el.classList.contains('rounded-full') && el.classList.contains('bg-purple-600/10')) || 
            (el.classList.contains('rounded-full') && el.classList.contains('bg-blue-600/10'))
          ) {
            el.style.display = 'none';
          }
        });
      });
      
      // Add mutation observer to disable animations on newly added elements
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && node instanceof HTMLElement) {
                // Disable animations on newly added elements
                const newAnimatedElements = node.querySelectorAll('[data-framer-motion], .motion-element, motion.div, .animate-pulse');
                
                newAnimatedElements.forEach(el => {
                  if (el instanceof HTMLElement) {
                    el.style.animation = 'none';
                    el.style.transition = 'none';
                    el.style.transform = 'none';
                    el.dataset.animationsDisabled = 'true';
                  }
                });
              }
            });
          }
        });
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Return cleanup function
      return () => {
        observer.disconnect();
        
        // Clean up all our custom attributes
        document.querySelectorAll('[data-animations-disabled="true"]').forEach(el => {
          if (el instanceof HTMLElement) {
            delete el.dataset.animationsDisabled;
            el.style.willChange = '';
            el.style.animation = '';
            el.style.transition = '';
            el.style.transform = '';
          }
        });
      };
    };
    
    // Execute the optimization
    const cleanup = disableFramerMotion();
    
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      if (cleanup) cleanup();
    };
  }, [isMobile, isTouch]);
};

export default useAnimationOptimizer;
