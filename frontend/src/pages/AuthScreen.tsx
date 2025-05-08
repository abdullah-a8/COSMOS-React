import { useState, useEffect } from 'react';
import { SparklesCore } from '../components/sparkles';
import { useDevice } from '../hooks/useDevice';
import { useSearchParams, useLocation } from 'react-router-dom';

export default function AuthScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isMobile } = useDevice();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid') {
      setError('Invalid access key. Please try again.');
    } else if (errorParam === 'system') {
      setError('An unexpected error occurred. Please try again.');
    }
  }, [searchParams]);
  
  // Check if already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/v1/auth-status');
        const data = await response.json();
        
        // If already authenticated, redirect to home or original location
        if (data.authenticated) {
          const returnPath = location.state?.from?.pathname || '/';
          window.location.href = returnPath;
        }
      } catch (err) {
        // Silently fail - user will stay on auth page
      }
    };
    
    checkAuthStatus();
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      // Use the same endpoint as the existing auth system
      const response = await fetch('/cosmos-auth', {
        method: 'POST',
        body: formData,
      });
      
      // If successful, the server will set the cookie and redirect
      if (response.ok) {
        // If redirect doesn't happen automatically, handle it manually
        const returnPath = location.state?.from?.pathname || '/';
        window.location.href = returnPath;
      } else {
        setError('Invalid access key. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased relative flex flex-col items-center justify-center px-4">
      {/* Background sparkles */}
      <div className="fixed inset-0 z-0">
        <SparklesCore
          id="auth-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 60 : 100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      
      {/* Purple glow effect behind the form */}
      <div className="absolute w-72 h-72 bg-purple-600/20 rounded-full filter blur-3xl opacity-30 z-0"></div>
      
      {/* Beta badge */}
      <div className="absolute top-4 right-4 bg-purple-600 text-white py-1 px-3 rounded-full text-xs font-semibold uppercase tracking-wider z-10">
        Closed Beta
      </div>
      
      <div className="max-w-md w-full bg-black/40 backdrop-blur-xl p-8 rounded-xl shadow-2xl border border-white/10 z-10 animate-in relative overflow-hidden">
        {/* Subtle purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none"></div>
        
        {/* Subtle border glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-purple-600/30 to-blue-500/30 blur-sm rounded-xl opacity-50"></div>
        
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
            COSMOS
          </h1>
          
          <p className="text-white/80 text-center mb-8 leading-relaxed">
            This site is currently in closed beta. Please enter the access key to continue.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/90 block tracking-wide">
                Access Key
              </label>
              
              {/* Simplified input container */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  autoFocus
                  disabled={isLoading}
                  placeholder="Enter your access key"
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/20 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Enter'
              )}
            </button>
            
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-md border border-red-500/20">
                {error}
              </div>
            )}
          </form>
          
          <footer className="mt-8 text-xs text-white/50 text-center tracking-wide">
            &copy; 2025 COSMOS AI. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
} 