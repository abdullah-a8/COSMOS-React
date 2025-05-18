import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SparklesCore } from './components/sparkles';
import Navbar from './components/navbar';
import Home from './pages/Home';
import LandingPage from './pages/landing-page';
import RagChatbot from './pages/RagChatbot';
import YouTubeProcessor from './pages/YouTubeProcessor';
import GmailResponder from './pages/GmailResponder';
import AuthScreen from './pages/AuthScreen';
import AdminPanel from './pages/AdminPanel';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/auth/ProfilePage';
import { RoboAnimation } from './components/robo-animation';
import { useDevice } from './hooks/useDevice';
import { useAuth } from './hooks/useAuth.tsx';
import { useEffect, useState } from 'react';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth({ refreshInterval: 45 });
  const [showLoader, setShowLoader] = useState(true);
  
  // Only show loading screen after a brief delay
  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
    } else {
      // Add slight delay before showing loader to prevent flicker on fast auth checks
      const timer = setTimeout(() => {
        setShowLoader(isLoading);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (showLoader && isLoading) {
    // Show loading screen
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 relative">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-white/70">Loading...</p>
      </div>
    );
  }
  
  if (isAuthenticated === false) {
    // Redirect to login page with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

// Admin-only route component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth({ refreshInterval: 45 });
  const [showLoader, setShowLoader] = useState(false); // Start with false to avoid flicker
  
  // Only show loading screen after a longer delay to improve UX when navigating
  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
    } else {
      // Increased delay to prevent flicker on fast navigations
      const timer = setTimeout(() => {
        setShowLoader(isLoading);
      }, 300); // Increased from 100ms to 300ms for better UX
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Optimization: If we already know user is admin, render immediately
  // This helps avoid unnecessary loading states during navigation
  if (isAdmin && isAuthenticated) {
    return <>{children}</>;
  }

  // Only show loader for actual pending auth checks, not for quick navigations
  if (showLoader && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 relative">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-white/70">Loading...</p>
      </div>
    );
  }
  
  // Handle unauthorized access
  if (isAuthenticated === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Handle non-admin access - only redirect if we're certain user is not admin
  if (isAdmin === false && isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Fall back to children if auth check is still in progress but we don't want to show loader yet
  return <>{children}</>;
}

function App() {
  const { isMobile } = useDevice();
  const location = useLocation();
  const { isAuthenticated } = useAuth({ refreshInterval: 45 });
  const isAuthPage = ['/auth', '/login', '/register'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';
  
  // Check if we're in production environment
  const [isProduction, setIsProduction] = useState(false);
  
  // Detect production environment - simpler approach
  useEffect(() => {
    // Check if we're not using a development URL
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      setIsProduction(true);
    }
  }, []);
  
  // Redirect from /auth to /login in production
  useEffect(() => {
    if (isProduction && location.pathname === '/auth') {
      // Add a safety check to prevent infinite redirect loops
      const redirectCount = parseInt(sessionStorage.getItem('auth_redirect_count') || '0');
      if (redirectCount < 3) { // Allow maximum 3 redirects to prevent infinite loops
        sessionStorage.setItem('auth_redirect_count', (redirectCount + 1).toString());
        window.location.href = '/login';
      } else {
        console.error('Too many redirects detected, stopping redirect chain');
        sessionStorage.removeItem('auth_redirect_count'); // Reset for next time
      }
    } else if (location.pathname !== '/auth') {
      // Reset redirect count when on a different page
      sessionStorage.removeItem('auth_redirect_count');
    }
  }, [isProduction, location.pathname]);
  
  // Set proper viewport meta tag for mobile devices
  useEffect(() => {
    // Find existing viewport meta tag or create a new one
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    // Set proper content attribute for responsive design
    viewportMeta.setAttribute(
      'content', 
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
    );
  }, []);

  // Prevent scrolling on auth pages
  useEffect(() => {
    if (isAuthPage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthPage]);

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased relative overflow-x-hidden">
      {/* Ambient background with moving particles - fixed to cover entire page */}
      <div className="fixed inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 60 : 100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col overflow-x-hidden">
        {/* Only show navbar if not on auth page or landing page and authenticated */}
        {!isAuthPage && !isLandingPage && isAuthenticated && <Navbar />}
        
        <div className="flex-1 flex flex-col">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Primary authentication routes - must always be accessible */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Legacy beta auth route - only shown in development environment */}
            {!isProduction && <Route path="/auth" element={<AuthScreen />} />}
            
            {/* Protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/rag-chatbot" element={
              <ProtectedRoute>
                <RagChatbot />
              </ProtectedRoute>
            } />
            <Route path="/youtube-processor" element={
              <ProtectedRoute>
                <YouTubeProcessor />
              </ProtectedRoute>
            } />
            <Route path="/gmail-responder" element={
              <ProtectedRoute>
                <GmailResponder />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
            
            {/* Redirect unauthenticated users to landing page for unknown routes */}
            <Route path="*" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
            } />
          </Routes>
        </div>

        {/* Animated robot - Only shown on non-auth pages and non-landing page and non-mobile devices when authenticated */}
        {!isAuthPage && !isLandingPage && !isMobile && isAuthenticated && (
          <div className="fixed bottom-4 right-4 w-64 h-64 z-10 pointer-events-none">
            <RoboAnimation />
          </div>
        )}
        
        {/* Mobile footer - only on non-auth pages when authenticated */}
        {!isAuthPage && isMobile && isAuthenticated && (
          <footer className="mt-auto py-4 px-4 text-center text-gray-500 text-xs">
            <p>© 2025 COSMOS AI. All rights reserved.</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
