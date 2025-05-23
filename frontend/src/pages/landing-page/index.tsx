import React, { useState, useEffect, useRef } from 'react';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import Header from './Header';
import Hero from './Hero.tsx';
import Features from './Features.tsx';
import HowItWorks from './HowItWorks';
import CTA from './CTA';
import Footer from './Footer';
import ResourcePreloader from './ResourcePreloader';
import MobileOptimizer from './MobileOptimizer';
import './mobileStyles.css';
import { 
  optimizeAnimatedElements, 
  forceRepaint, 
  nextFrame, 
  ensureImagesLoaded 
} from './AnimationOptimizer';

// Lightweight loading spinner component
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
  </div>
);

// Detects if the current device should have animations disabled
const shouldDisableAnimations = () => {
  // Check for mobile/touch devices
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for low-end hardware indicators
  const hasLowHardware = 
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check for low battery if API is available
  let hasLowBattery = false;
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      hasLowBattery = battery.level < 0.2 && !battery.charging;
    }).catch(() => {
      // Battery API failed, ignore
    });
  }
  
  // Small screen size is a good indicator for mobile
  const isSmallScreen = window.innerWidth <= 768;
  
  // Return true if the device is likely to benefit from disabled animations
  return isMobileDevice || (isTouchDevice && isSmallScreen) || hasLowHardware || prefersReducedMotion || hasLowBattery;
};

// Main landing page content component
const LandingPageContent: React.FC = () => {
  const { isMobile } = useDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const [disableAnimations, setDisableAnimations] = useState(false);
  
  useEffect(() => {
    // Set initial state based on device detection
    setDisableAnimations(shouldDisableAnimations());
    
    // Apply GPU optimizations for animation elements after render
    if (containerRef.current) {
      optimizeAnimatedElements('.motion-element, motion.div, .animate-pulse, [data-framer-motion]');
    }
    
    // For mobile devices, add animation-disabled class to body
    if (isMobile) {
      document.body.classList.add('mobile-device');
      
      // Apply performance class based on hardware detection
      if (shouldDisableAnimations()) {
        document.body.classList.add('animations-disabled');
      }
    }
    
    return () => {
      document.body.classList.remove('mobile-device');
      document.body.classList.remove('animations-disabled');
    };
  }, [isMobile]);
  
  return (
    <MobileOptimizer 
      priority={isMobile || disableAnimations ? 'high' : 'medium'}
    >
      <div ref={containerRef} className="min-h-screen bg-black text-white antialiased relative overflow-x-hidden">
        {/* Ambient background with moving particles - now shown on all devices */}
        <div className={`fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(55,48,163,0.15),rgba(0,0,0,0.5))] ${isMobile ? 'bg-gradient-mobile' : ''}`}>
          {/* SparklesCore is rendered on all devices */}
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={isMobile ? 50 : 100} // Reduced density on mobile for better performance
            className="w-full h-full"
            particleColor="#FFFFFF"
            followMouse={false}
          />
        </div>

        <Header />
        <div id="hero-section" className="motion-element">
          <Hero />
        </div>
        <div id="features-section" className="motion-element">
          <a id="features-anchor" aria-hidden="true"></a>
          <Features />
        </div>
        <div id="how-it-works-section" className="motion-element">
          <a id="how-it-works-anchor" aria-hidden="true"></a>
          <HowItWorks />
        </div>
        <div id="cta-section" className="motion-element">
          <CTA />
        </div>
        <Footer />
      </div>
    </MobileOptimizer>
  );
};

// Enhanced landing page with preloading
const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(Date.now()); // Force re-render key
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDevice();

  useEffect(() => {
    // Force fresh re-render of the entire landing page on mount
    setKey(Date.now());
    
    // Skip intensive preloading for mobile devices to improve initial load time
    if (isMobile) {
      // Set a shorter timeout for mobile to show content quicker
      setTimeout(() => setIsLoading(false), 300);
      return;
    }
    
    // Preload critical resources (on desktop only)
    const preloadResources = async () => {
      try {
        // Create a temporary container for content
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.height = '0';
        tempDiv.style.overflow = 'hidden';
        tempDiv.innerHTML = '<div id="preload-container"></div>';
        document.body.appendChild(tempDiv);
        
        // Wait for two animation frames to ensure browser is ready
        await nextFrame();
        
        // CSS optimization: hint the browser about GPU layers
        document.body.style.willChange = 'transform, opacity';
        
        // Force repaint to help with layer creation
        forceRepaint();
        
        // Wait a bit for CSS to apply
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // If container exists, ensure images are loaded
        if (containerRef.current) {
          await ensureImagesLoaded(containerRef.current);
        }
        
        // Clean up preload elements
        document.body.removeChild(tempDiv);
        
        // Mark loading as complete
        setIsLoading(false);
        
        // Reset willChange after animations are stable
        setTimeout(() => {
          document.body.style.willChange = '';
        }, 2000);
      } catch (error) {
        console.error('Preload error:', error);
        // Fallback in case of error - still render the page
        setIsLoading(false);
      }
    };

    preloadResources();
    
    // Clean up function
    return () => {
      document.body.style.willChange = '';
    };
  }, [isMobile]);

  // Critical CSS/asset resources to preload
  const criticalResources: string[] = [
    // You can add critical background images, icons, or CSS here if needed
  ];

  return (
    <div ref={containerRef}>
      {isLoading ? (
        <Loader />
      ) : (
        // Wrap in resource preloader to ensure proper loading of CSS/styles
        <ResourcePreloader resourceUrls={criticalResources}>
          {/* Key ensures complete fresh render on each mount */}
          <LandingPageContent key={key} />
        </ResourcePreloader>
      )}
    </div>
  );
};

export default LandingPage;