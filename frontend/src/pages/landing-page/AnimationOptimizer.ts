/**
 * Animation Optimizer
 * 
 * This utility provides methods to optimize animations and
 * ensure proper loading of visual assets on the landing page.
 */

/**
 * Optimizes elements for GPU acceleration
 * @param selector CSS selector for elements to optimize
 */
export const optimizeAnimatedElements = (selector: string = '.motion-element') => {
  // Find all animated elements
  const elements = document.querySelectorAll(selector);
  
  // Apply will-change for GPU acceleration
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.willChange = 'transform, opacity';
      
      // Add a small class to track optimized elements
      element.classList.add('gpu-optimized');
    }
  });
  
  // Schedule cleanup to avoid memory issues
  // Only apply will-change during actual animations
  setTimeout(() => {
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.willChange = 'auto';
      }
    });
  }, 2000); // Remove optimization after animations complete
};

/**
 * Forces a browser repaint to ensure visual assets are rendered
 */
export const forceRepaint = () => {
  // Reading offsetHeight causes a browser repaint
  document.body.offsetHeight;
  
  // For more stubborn cases, temporarily modify the body
  const originalStyle = document.body.style.display;
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger repaint
  document.body.style.display = originalStyle;
};

/**
 * Creates a promise that resolves after the next animation frame
 */
export const nextFrame = (): Promise<void> => 
  new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

/**
 * Verifies all images are loaded in a container
 */
export const ensureImagesLoaded = (container: HTMLElement): Promise<void> => {
  return new Promise(resolve => {
    const images = Array.from(container.querySelectorAll('img'));
    
    if (images.length === 0) {
      resolve();
      return;
    }
    
    let loadedCount = 0;
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        resolve();
      }
    };
    
    images.forEach(img => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });
  });
}; 