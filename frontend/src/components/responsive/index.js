import React from 'react';
import { useDevice, useMobile, useTablet, useDesktop } from '../../hooks/useDevice';

/**
 * Component that only renders its children on mobile devices
 */
export const MobileOnly = ({ children }) => {
  const isMobile = useMobile();
  return isMobile ? children : null;
};

/**
 * Component that only renders its children on tablet devices
 */
export const TabletOnly = ({ children }) => {
  const isTablet = useTablet();
  return isTablet ? children : null;
};

/**
 * Component that only renders its children on desktop devices
 */
export const DesktopOnly = ({ children }) => {
  const isDesktop = useDesktop();
  return isDesktop ? children : null;
};

/**
 * Component that renders its children on mobile and tablet devices
 */
export const MobileAndTablet = ({ children }) => {
  const { isSmallScreen } = useDevice();
  return isSmallScreen ? children : null;
};

/**
 * Component that renders different children based on device type
 */
export const Responsive = ({ mobile, tablet, desktop }) => {
  const { isMobile, isTablet, isDesktop } = useDevice();
  
  if (isMobile) return mobile || null;
  if (isTablet) return tablet || mobile || null;
  if (isDesktop) return desktop || null;
  
  return null;
}; 