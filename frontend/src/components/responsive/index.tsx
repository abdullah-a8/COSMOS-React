import React, { ReactNode } from 'react';
import { useDevice, useMobile, useTablet, useDesktop } from '../../hooks/useDevice';

interface ChildrenProps {
  children: ReactNode;
}

/**
 * Component that only renders its children on mobile devices
 */
export const MobileOnly: React.FC<ChildrenProps> = ({ children }) => {
  const isMobile = useMobile();
  return isMobile ? <>{children}</> : null;
};

/**
 * Component that only renders its children on tablet devices
 */
export const TabletOnly: React.FC<ChildrenProps> = ({ children }) => {
  const isTablet = useTablet();
  return isTablet ? <>{children}</> : null;
};

/**
 * Component that only renders its children on desktop devices
 */
export const DesktopOnly: React.FC<ChildrenProps> = ({ children }) => {
  const isDesktop = useDesktop();
  return isDesktop ? <>{children}</> : null;
};

/**
 * Component that renders its children on mobile and tablet devices
 */
export const MobileAndTablet: React.FC<ChildrenProps> = ({ children }) => {
  const { isSmallScreen } = useDevice();
  return isSmallScreen ? <>{children}</> : null;
};

interface ResponsiveProps {
  mobile: ReactNode;
  tablet?: ReactNode;
  desktop: ReactNode;
}

/**
 * Component that renders different children based on device type
 */
export const Responsive: React.FC<ResponsiveProps> = ({ mobile, tablet, desktop }) => {
  const { isMobile, isTablet, isDesktop } = useDevice();
  
  if (isMobile) return <>{mobile}</> || null;
  if (isTablet) return <>{tablet || mobile}</> || null;
  if (isDesktop) return <>{desktop}</> || null;
  
  return null;
}; 