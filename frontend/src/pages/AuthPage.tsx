import React, { useState, useEffect } from 'react';
import { SparklesCore } from '../components/sparkles';
import { useDevice } from '../hooks/useDevice';

const AuthPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { isMobile } = useDevice();
  
  // Add subtle movement to the card
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return; // Don't apply effect on mobile
      
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      
      setPosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);
  
  // Security feature: clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if rate limited
    if (isRateLimited) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/cosmos-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          password: password
        }),
        redirect: 'manual' // Prevent automatic redirects
      });
      
      // Handle redirect response (successful auth)
      if (response.status === 303) {
        window.location.href = '/';
        return;
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        setIsRateLimited(true);
        setError('Too many failed attempts. Please try again later.');
        
        // Auto-reset after 10 minutes
        setTimeout(() => {
          setIsRateLimited(false);
          setError(null);
        }, 10 * 60 * 1000);
        
        return;
      }
      
      // Error handling
      if (response.status === 401 || response.status === 400) {
        setError('Invalid access key. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      // Clear password field on error for security
      setPassword('');
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/[0.96] antialiased relative flex items-center justify-center p-4">
      {/* Ambient background with particles */}
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
      
      {/* Grid pattern overlay for depth */}
      <div className="fixed inset-0 z-0 bg-grid-white/[0.02]"></div>
      
      {/* Closed Beta Badge */}
      <div className="fixed top-4 right-4 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
        Closed Beta
      </div>
      
      {/* Auth container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div 
          className="bg-card/95 backdrop-blur-md border border-border/40 rounded-lg shadow-xl p-8 animate-fadeIn"
          style={{
            transform: `perspective(1000px) rotateX(${position.y * 0.1}deg) rotateY(${position.x * 0.1}deg)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/5 opacity-50 blur-xl -z-10"></div>
          
          {/* Logo and title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">COSMOS</h1>
            <p className="text-muted-foreground mt-2">
              This site is currently in closed beta. Please enter the access key to continue.
            </p>
          </div>
          
          {/* Auth form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Access Key
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background/60 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your access key"
                required
                autoFocus
                disabled={isLoading || isRateLimited}
                autoComplete="off" // Prevent browser autocomplete for security
              />
            </div>
            
            <button
              type="submit"
              className={`w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors relative overflow-hidden ${(isLoading || isRateLimited) ? 'cursor-not-allowed opacity-80' : ''}`}
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Enter</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                </>
              ) : isRateLimited ? (
                'Temporarily Locked'
              ) : (
                'Enter'
              )}
            </button>
            
            {error && (
              <div className="text-destructive text-center text-sm mt-4 animate-fadeIn">
                {error}
              </div>
            )}
          </form>
          
          <footer className="mt-8 text-center text-xs text-muted-foreground">
            &copy; 2025 COSMOS AI. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;