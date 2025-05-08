import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SparklesCore } from './components/sparkles';
import Navbar from './components/navbar';
import Home from './pages/Home';
import RagChatbot from './pages/RagChatbot';
import YouTubeProcessor from './pages/YouTubeProcessor';
import GmailResponder from './pages/GmailResponder';
import AuthScreen from './pages/AuthScreen';
import { RoboAnimation } from './components/robo-animation';
import { useDevice } from './hooks/useDevice';
import { useEffect, useState } from 'react';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v1/auth-status');
        const data = await response.json();
        setAuthStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
      } catch (err) {
        // If API fails, assume unauthenticated
        setAuthStatus('unauthenticated');
      }
    };
    
    checkAuth();
  }, []);
  
  if (authStatus === 'loading') {
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
  
  if (authStatus === 'unauthenticated') {
    // Redirect to auth page with return path
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { isMobile } = useDevice();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  
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
        {/* Only show navbar if not on auth page */}
        {!isAuthPage && <Navbar />}
        
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/" element={
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
          </Routes>
        </div>

        {/* Animated robot - Only shown on non-auth pages and non-mobile devices */}
        {!isAuthPage && !isMobile && (
          <div className="fixed bottom-4 right-4 w-64 h-64 z-10 pointer-events-none">
            <RoboAnimation />
          </div>
        )}
        
        {/* Mobile footer - only on non-auth pages */}
        {!isAuthPage && isMobile && (
          <footer className="mt-auto py-4 px-4 text-center text-gray-500 text-xs">
            <p>© 2025 COSMOS AI. All rights reserved.</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
