import useMediaQuery from './useMediaQuery';

/**
 * Hook to detect if current device is mobile
 * @returns {boolean} - True if device is mobile
 */
export const useMobile = () => {
  // Mobile devices typically have max width of 767px
  return useMediaQuery('(max-width: 767px)');
};

/**
 * Hook to detect if current device is a tablet
 * @returns {boolean} - True if device is a tablet
 */
export const useTablet = () => {
  // Tablets typically have width between 768px and 1023px
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
};

/**
 * Hook to detect if current device is desktop
 * @returns {boolean} - True if device is desktop
 */
export const useDesktop = () => {
  // Desktops typically have min width of 1024px
  return useMediaQuery('(min-width: 1024px)');
};

/**
 * Hook to detect if the device has touch capabilities
 * @returns {boolean} - True if device has touch capabilities
 */
export const useTouch = () => {
  return useMediaQuery('(pointer: coarse)');
};

/**
 * Hook that provides all device information
 * @returns {Object} - Object containing device types
 */
export const useDevice = () => {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isDesktop = useDesktop();
  const isTouch = useTouch();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    // For convenience - any non-desktop device
    isSmallScreen: isMobile || isTablet
  };
}; 