import React, { useEffect } from 'react';
import { useDevice } from '../../hooks/useDevice';
import useAnimationOptimizer from './useAnimationOptimizer';

// Mobile optimization priority tiers
type OptimizationLevel = 'high' | 'medium' | 'low';

interface MobileOptimizerProps {
  children: React.ReactNode;
  // Priority level affects how aggressive optimizations are
  priority?: OptimizationLevel;
}

/**
 * MobileOptimizer - A component that optimizes rendering for mobile devices
 * by leveraging content-visibility and other CSS containment strategies
 */
const MobileOptimizer: React.FC<MobileOptimizerProps> = ({
  children,
  priority = 'medium',
}) => {
  const { isMobile, isSmallScreen } = useDevice();
  
  // Apply animation optimizations using our custom hook
  useAnimationOptimizer();
  
  // Only apply optimizations on mobile devices
  const shouldOptimize = isMobile || isSmallScreen;
  
  useEffect(() => {
    if (!shouldOptimize) return;

    // Note: Sparkles are now enabled on mobile - removed disableSparkles function
    
    // Check if device has adequate hardware
    const hasLimitedHardware = () => {
      // Check for hardware concurrency (CPU cores)
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
        return true;
      }
      
      // Check for memory (if available)
      if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
        return true;
      }
      
      return false;
    };
    
    // Optimize animations on mobile devices but keep sparkles
    const optimizeAnimations = () => {
      // Target Framer Motion animations
      const framerElements = document.querySelectorAll('[data-framer-motion], .motion-element, motion.div');
      framerElements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Prevent animations from running by setting properties
          element.style.animation = 'none';
          element.style.transition = 'none';
          
          // Remove animation classes
          element.classList.remove('animate-pulse');

          // Force hardware acceleration off to save CPU/GPU
          element.style.willChange = 'auto';
          element.style.transform = 'none';
        }
      });
      
      // Disable animated gradient orbs
      const gradientOrbs = document.querySelectorAll('.rounded-full.animate-pulse, .rounded-full.bg-purple-600\\/10, .rounded-full.bg-blue-600\\/10');
      gradientOrbs.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.animation = 'none';
          element.style.opacity = '0.5';
          element.style.display = 'none';
        }
      });
      
      // Disable shine effects in buttons
      const shineEffects = document.querySelectorAll('.absolute.inset-0.bg-gradient-to-r.from-transparent.via-white\\/20');
      shineEffects.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
        }
      });
      
      // Disable hero visual animations
      const heroVisuals = document.querySelectorAll('#hero-section .relative.max-w-5xl, #hero-section .absolute.-inset-1');
      heroVisuals.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.transform = 'none';
          element.style.transition = 'none';
          
          // Simplify by removing animated child elements
          const motionDivs = element.querySelectorAll('motion.div');
          motionDivs.forEach(motionDiv => {
            if (motionDiv instanceof HTMLElement) {
              motionDiv.style.animation = 'none';
              motionDiv.style.transform = 'none';
            }
          });
        }
      });

      // Disable Feature card 3D tilt effect
      const featureCards = document.querySelectorAll('#features-section [style*="rotateX"], #features-section [style*="rotateY"]');
      featureCards.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.transform = 'none';
          element.style.transition = 'none';
        }
      });
      
      // Disable CTA section animations
      const ctaAnimations = document.querySelectorAll('#cta-section .absolute.inset-0 motion.div');
      ctaAnimations.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.animation = 'none';
          element.style.display = 'none';
        }
      });
      
      // Add a class to indicate animations are disabled
      document.body.classList.add('animations-disabled');
      
      // Add inline styles to override any CSS animations - except for sparkles
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @media (max-width: 767px) {
          .animations-disabled * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          
          /* Exception for sparkles */
          #tsparticlesfullpage,
          #tsparticlesfullpage * {
            animation: initial !important;
            transition: initial !important;
            transform: initial !important;
            display: block !important;
            visibility: visible !important;
          }
          
          /* Keep some minimal transitions for UI feedback */
          .animations-disabled button:active {
            transform: scale(0.98) !important;
            transition: transform 0.1s !important;
          }
          
          /* Turn off unnecessary effects */
          .animations-disabled .blur-3xl,
          .animations-disabled .blur-md,
          .animations-disabled .blur {
            filter: blur(0) !important;
            opacity: 0.7 !important;
          }
          
          /* Hide purely decorative elements */
          .animations-disabled .absolute.rounded-full.animate-pulse,
          .animations-disabled .absolute.w-full.h-full.rounded-full {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
      
      return () => {
        document.body.classList.remove('animations-disabled');
        if (styleEl.parentNode) {
          document.head.removeChild(styleEl);
        }
      };
    };
    
    // Apply different levels of optimization
    if (priority === 'high' || hasLimitedHardware()) {
      // For high priority or limited hardware, optimize but keep sparkles
      const cleanup = optimizeAnimations();
      
      document.body.classList.add('critical-optimization');
      
      // Further reduce complex animations but allow sparkles
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @media (max-width: 767px) {
          /* Sparkles are now allowed */
          
          .critical-optimization .animate-pulse {
            animation: none !important;
          }
          
          .critical-optimization [data-framer-motion],
          .critical-optimization .motion-element {
            will-change: auto !important;
            transform: none !important;
            transition: none !important;
          }
          
          /* Exception for sparkles */
          #tsparticlesfullpage,
          #tsparticlesfullpage * {
            will-change: initial !important;
            transform: initial !important;
            transition: initial !important;
            animation: initial !important;
            display: block !important;
          }
        }
      `;
      
      document.head.appendChild(styleEl);
      
      return () => {
        document.body.classList.remove('critical-optimization');
        document.head.removeChild(styleEl);
        if (cleanup) cleanup();
      };
    }
  }, [shouldOptimize, priority]);
  
  if (!shouldOptimize) {
    return <>{children}</>;
  }
  
  return (
    <div className="mobile-optimized-container">
      {children}
    </div>
  );
};

export default MobileOptimizer;
