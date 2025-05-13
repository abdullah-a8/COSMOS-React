import React, { useState, useEffect } from 'react';
import { useCsrf } from '../../hooks/useCsrf';
import { useAuth } from '../../hooks/useAuth';

interface User {
  id: number;
  email: string;
  display_name: string | null;
  access_key: string;
}

interface ProfileFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDisplayNameChange?: (name: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, onError, onDisplayNameChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState<boolean | null>(null);
  const { fetchWithCsrf } = useCsrf();
  const { shouldPreventAPIRequests } = useAuth();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      // Skip API calls if we're in the process of logging out
      if (shouldPreventAPIRequests()) return;
      
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/v1/users/me', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        setUser(userData);
        setDisplayName(userData.display_name || '');
        if (onDisplayNameChange) {
          onDisplayNameChange(userData.display_name || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        onError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [onError, onDisplayNameChange, shouldPreventAPIRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip API calls if we're in the process of logging out
    if (shouldPreventAPIRequests()) return;
    
    // Validate display name
    if (displayName && displayName.length < 3) {
      onError('Display name must be at least 3 characters');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Use fetchWithCsrf instead of regular fetch to include the CSRF token
      const response = await fetchWithCsrf('/api/v1/users/me/display-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update display name');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      if (onDisplayNameChange) {
        onDisplayNameChange(displayName);
      }
      
      onSuccess('Display name updated successfully');
    } catch (error) {
      console.error('Error updating display name:', error);
      onError(error instanceof Error ? error.message : 'Failed to update display name');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin"></div>
          <div className="h-16 w-16 rounded-full border-r-2 border-l-2 border-blue-500 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 bg-black/20 rounded-lg border border-white/5">
        <div className="text-white/80 font-medium">
          No user data available. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account information section */}
      <div className="space-y-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-white/90">Email</h4>
        </div>
        <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5 hover:border-purple-500/30 transition-all duration-300 text-white">
          {user.email}
          <span className="text-white/50 text-xs ml-2">(cannot be changed)</span>
        </div>
      </div>

      {/* Access key section */}
      <div className="space-y-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-white/90">Access Key</h4>
        </div>
        <div className="relative">
          <div 
            className="bg-black/40 rounded-lg px-4 py-3 border border-white/5 hover:border-purple-500/30 transition-all duration-300 font-mono text-sm text-white/80 break-all flex items-center"
          >
            {isCopied 
              ? <span className="text-green-400">Key copied to clipboard!</span>
              : isCopied === false 
                ? <span>{user.access_key}</span>
                : <span className="select-none tracking-wider">••••••••••••••••••••••••••••••••</span>
            }
            <button 
              onClick={() => {
                if (isCopied === null) {
                  navigator.clipboard.writeText(user.access_key)
                    .then(() => {
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    })
                    .catch(err => {
                      console.error('Failed to copy: ', err);
                      onError('Failed to copy to clipboard');
                    });
                } else {
                  setIsCopied(null);
                }
              }}
              className="ml-auto p-2 rounded-md hover:bg-purple-500/20 transition-colors"
              aria-label={isCopied === null ? "Hide key" : "Show key"}
            >
              {isCopied !== null ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-white/50">Secure credential for API access. Keep this private and use for connecting to COSMOS services.</p>
      </div>

      {/* Display name section */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-white/90">Display Name</h4>
        </div>
        <div className="relative group">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={isSaving}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 focus:border-purple-500/60 hover:border-purple-500/30 text-white placeholder-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200"
          />
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
        <p className="text-xs text-white/50">This is how you'll appear to others in the COSMOS platform</p>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 group relative overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-purple-800 to-purple-900"></span>
            <span className="relative flex items-center justify-center">
              {isSaving ? (
                <>
                  <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm; 