import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../../components/auth/ProfileForm';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { isMobile } = useDevice();
  const navigate = useNavigate();
  const { logout, shouldPreventAPIRequests } = useAuth();
  const [formNotification, setFormNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sidebarNotification, setSidebarNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Skip API calls if we're in the process of logging out
      if (shouldPreventAPIRequests()) return;
      
      try {
        const response = await fetch('/api/v1/auth-status');
        const data = await response.json();
        
        // If not authenticated, redirect to login
        if (!data.authenticated) {
          navigate('/login?required=true');
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        navigate('/login?required=true');
      }
    };
    
    checkAuthStatus();
  }, [navigate, shouldPreventAPIRequests]);

  // Fetch user's display name
  useEffect(() => {
    const fetchUserData = async () => {
      // Skip API calls if we're in the process of logging out
      if (shouldPreventAPIRequests()) return;
      
      try {
        const response = await fetch('/api/v1/users/me', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        setDisplayName(userData.display_name || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [shouldPreventAPIRequests]);
  
  const handleFormSuccess = (message: string) => {
    setFormNotification({ type: 'success', message });
    
    // Clear notification after a few seconds
    setTimeout(() => {
      setFormNotification(null);
    }, 5000);
  };
  
  const handleFormError = (message: string) => {
    setFormNotification({ type: 'error', message });
    
    // Clear notification after a few seconds
    setTimeout(() => {
      setFormNotification(null);
    }, 5000);
  };

  // Handle logout with proper API call
  const handleLogout = async () => {
    try {
      // Prevent multiple logout attempts
      if (isLoggingOut) return;
      
      setIsLoggingOut(true);
      setSidebarNotification({
        type: 'success',
        message: 'Signing out...'
      });
      
      // Use the useAuth logout function which handles everything
      await logout();
      
      // Short delay to ensure all state is cleared before navigation
      setTimeout(() => {
        // Navigate to login page
        window.location.replace('/login?logout=true');
      }, 200); // Small delay to ensure all flags are set and API calls are stopped
    } catch (error) {
      console.error("Logout error:", error);
      
      // Still try to redirect even if error occurs
      window.location.replace('/login?logout=true');
    }
  };
  
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0">
        <SparklesCore
          id="profile-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 40 : 70}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      
      {/* Purple glow effects */}
      <div className="absolute w-96 h-96 top-1/4 left-1/4 bg-purple-600/20 rounded-full filter blur-3xl opacity-20 z-0 animate-pulse"></div>
      <div className="absolute w-64 h-64 bottom-1/4 right-1/4 bg-blue-600/20 rounded-full filter blur-3xl opacity-20 z-0"></div>
      
      {/* Main content */}
      <div className="container mx-auto pt-32 pb-16 px-4 relative z-10">
        {/* Page header with icon */}
        <div className="flex items-center mb-8 space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent tracking-tight animate-in">
            Your Profile
          </h1>
        </div>
        
        {/* Form Notification */}
        {formNotification && (
          <div 
            className={`mb-8 p-4 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 ${
              formNotification.type === 'success' 
                ? 'bg-green-900/30 border border-green-500/50 shadow-green-900/10' 
                : 'bg-red-900/30 border border-red-500/50 shadow-red-900/10'
            }`}
          >
            <div className="flex items-center">
              {formNotification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-white font-medium">{formNotification.message}</span>
            </div>
          </div>
        )}
        
        {/* Main profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 transition-all duration-300 hover:border-purple-500/30 relative overflow-hidden h-full">
              <div className="relative p-6 flex flex-col items-center">
                {/* Profile image with purple glow */}
                <div className="relative w-32 h-32 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-lg opacity-70 animate-pulse"></div>
                  <div className="absolute inset-1 rounded-full bg-black"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 overflow-hidden border-2 border-white/10">
                    <svg className="w-full h-full text-white/80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-1">{displayName || 'COSMOS User'}</h2>
                <p className="text-white/60 text-sm mb-6">AI Enthusiast</p>
                
                {/* Sidebar Notification */}
                {sidebarNotification && (
                  <div 
                    className={`w-full mb-4 p-3 rounded-lg shadow-lg animate-in fade-in-50 duration-300 ${
                      sidebarNotification.type === 'success' 
                        ? 'bg-green-900/30 border border-green-500/50 shadow-green-900/10' 
                        : 'bg-red-900/30 border border-red-500/50 shadow-red-900/10'
                    }`}
                  >
                    <div className="flex items-center">
                      {sidebarNotification.type === 'success' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-white text-sm font-medium">{sidebarNotification.message}</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex justify-center items-center mb-4 group relative overflow-hidden shadow-lg shadow-purple-900/20"
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-purple-800 to-purple-900"></span>
                  <span className="relative flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Dashboard
                  </span>
                </button>
                
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-600/70 to-red-700/70 hover:from-rose-700/80 hover:to-red-800/80 text-white font-medium rounded-lg transition-all duration-200 flex justify-center items-center space-x-2 group relative overflow-hidden shadow-lg shadow-rose-900/20 disabled:opacity-70"
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-rose-800/90 to-red-900/90"></span>
                  <span className="relative flex items-center justify-center">
                    {isLoggingOut ? (
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 2.414L14.586 8H12V5.414zM5 11v-1h6v1H5zm0 2v1h6v-1H5z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Profile form section */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 transition-all duration-300 hover:border-purple-500/30 relative overflow-hidden h-full">
              <div className="relative p-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </h3>
                
                <ProfileForm onSuccess={handleFormSuccess} onError={handleFormError} onDisplayNameChange={setDisplayName} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-white/40 text-xs">&copy; 2025 COSMOS AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 