import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SparklesCore } from '../../components/sparkles';
import RegisterForm from '../../components/auth/RegisterForm';
import { useDevice } from '../../hooks/useDevice';

const RegisterPage: React.FC = () => {
  const { isMobile } = useDevice();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Check if already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/v1/auth-status');
        const data = await response.json();
        
        // If already authenticated, redirect to home
        if (data.authenticated) {
          navigate('/');
        }
      } catch (err) {
        // Silently fail - user will stay on register page
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  const handleSuccess = () => {
    setError(null);
    setSuccess('Account created successfully! You can now log in.');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      navigate('/login?registered=true');
    }, 2000);
  };
  
  const handleError = (message: string) => {
    setError(message);
    setSuccess(null);
  };
  
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased relative flex flex-col items-center justify-center px-4 overflow-hidden">
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
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 animate-[gradient_8s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Purple glow effects */}
      <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl opacity-30 z-0 animate-pulse"></div>
      <div className="absolute w-64 h-64 bg-blue-600/20 -right-20 -bottom-20 rounded-full filter blur-3xl opacity-20 z-0"></div>
      
      {/* Beta badge */}
      <div className="absolute top-4 right-4 backdrop-blur-sm border border-white/20 shadow-xl px-4 py-1.5 rounded-full z-10 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/90 via-purple-600/90 to-blue-500/90 opacity-90"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <span className="relative font-bold tracking-widest text-sm uppercase bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent animate-pulse">
          Closed Beta
        </span>
      </div>
      
      <div className="max-w-md w-full bg-black/40 backdrop-blur-xl p-8 rounded-xl shadow-2xl border border-white/10 z-10 transition-all duration-300 hover:border-purple-500/30 relative overflow-hidden">
        {/* Glass card effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none"></div>
        
        {/* Animated border glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-purple-600/50 via-blue-500/50 to-purple-600/50 blur opacity-50 group-hover:opacity-100 transition-all duration-1000 group-hover:duration-200 animate-[gradient_8s_ease-in-out_infinite]"></div>
        
        <div className="relative">
          <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-purple-400 via-purple-600 to-blue-500 bg-clip-text text-transparent tracking-tight animate-in">
            Create Account
          </h1>
          
          <p className="text-white/70 text-center mb-8 font-medium tracking-wide">
            Join <span className="text-white font-semibold">COSMOS</span> to get started with your AI journey
          </p>
          
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-white p-4 rounded-lg text-sm mb-6 animate-in">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/30 border border-green-500/50 text-white p-4 rounded-lg text-sm mb-6 animate-in">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}
          
          <RegisterForm onSuccess={handleSuccess} onError={handleError} />
          
          <div className="mt-8 text-center text-sm text-white/70 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5 text-xs text-white/40 text-center tracking-wide font-medium">
            &copy; 2025 COSMOS AI. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 