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

    // Double-check to ensure SparklesCore is disabled on mobile
    const disableSparkles = () => {
      // Find any sparkles elements that might have been conditionally rendered
      const sparklesElements = document.querySelectorAll('#tsparticlesfullpage');
      sparklesElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
          element.setAttribute('aria-hidden', 'true');
        }
      });
    };
    
    // Run immediately and then on any DOM changes
    disableSparkles();
    
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
    
    // Apply more aggressive optimizations for devices with limited hardware
    if (hasLimitedHardware() && priority === 'high') {
      document.body.classList.add('critical-optimization');
      
      // Further reduce particle effects and complex animations
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @media (max-width: 767px) {
          .critical-optimization #tsparticlesfullpage {
            opacity: 0.4 !important;
          }
          
          .critical-optimization .animate-pulse {
            animation-duration: 4s !important;
          }
          
          .critical-optimization [data-framer-motion],
          .critical-optimization .motion-element {
            transition-property: opacity !important;
            transition-duration: 0.3s !important;
          }
        }
      `;
      
      document.head.appendChild(styleEl);
      
      return () => {
        document.body.classList.remove('critical-optimization');
        document.head.removeChild(styleEl);
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
