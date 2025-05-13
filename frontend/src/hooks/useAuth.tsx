import { useState, useEffect, useCallback } from 'react';

interface UseAuthOptions {
  refreshInterval?: number; // In minutes
}

// Cache validity period in milliseconds
const AUTH_CACHE_VALIDITY = 300 * 1000; // 5 minutes (increased from 30 seconds)

interface AuthCache {
  timestamp: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Enable verbose debugging
const DEBUG = false;

// Add logout detection
const LOGOUT_KEY = "cosmos_logout_in_progress";
// Add API prevention flag to stop API calls during logout
const PREVENT_API_REQUESTS_KEY = "cosmos_prevent_api_requests";

export function useAuth({ refreshInterval = 45 }: UseAuthOptions = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [authCache, setAuthCache] = useState<AuthCache | null>(null);

  // Function to check authentication status
  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    try {
      if (DEBUG) console.log('Checking auth status...');
      
      // Check if logout is in progress or API requests are prevented
      if (sessionStorage.getItem(LOGOUT_KEY) === 'true' || 
          sessionStorage.getItem(PREVENT_API_REQUESTS_KEY) === 'true') {
        if (DEBUG) console.log('Logout in progress or API requests prevented, returning unauthenticated');
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAuthCache(null);
        setIsLoading(false);
        return false;
      }
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && authCache && (Date.now() - authCache.timestamp < AUTH_CACHE_VALIDITY)) {
        if (DEBUG) console.log('Using cached auth status');
        
        // Return immediately with cached values
        if (!isAuthenticated && authCache.isAuthenticated) {
          setIsAuthenticated(authCache.isAuthenticated);
        }
        
        if (isAdmin !== authCache.isAdmin) {
          setIsAdmin(authCache.isAdmin);
        }
        
        setIsLoading(false);
        return authCache.isAuthenticated;
      }
      
      // Perform an immediate check if isAuthenticated is null
      // This ensures faster initial auth state resolution
      if (isAuthenticated === null) {
        setIsLoading(true);
      } else if (!authCache || forceRefresh) {
        // Only set loading if we're actually making a network request
        setIsLoading(true);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/v1/auth-status', {
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Auth status check failed:', response.status, response.statusText);
        throw new Error(`Auth status check failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (DEBUG) {
        console.log('Auth status response:', data);
        console.log('✅ Authentication status:', data.authenticated);
        console.log('👑 Admin status:', !!data.is_admin);
        console.log('Admin status type:', typeof data.is_admin);
      }
      
      setIsAuthenticated(data.authenticated);
      
      // Handle admin status explicitly
      const adminStatus = !!data.is_admin;
      setIsAdmin(adminStatus);
      
      // Store debug info if available
      if (data.debug_info) {
        setDebugInfo(data.debug_info);
      }
      
      // Update auth cache
      setAuthCache({
        timestamp: Date.now(),
        isAuthenticated: data.authenticated,
        isAdmin: adminStatus
      });
      
      return data.authenticated;
    } catch (err) {
      console.error('Error checking authentication status:', err);
      setError('Failed to verify authentication status');
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthCache(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authCache, isAuthenticated, isAdmin]);

  // Add logout function
  const logout = useCallback(async () => {
    try {
      // Set logout flag to prevent further auth calls
      sessionStorage.setItem(LOGOUT_KEY, 'true');
      // Also set the API prevention flag
      sessionStorage.setItem(PREVENT_API_REQUESTS_KEY, 'true');
      
      // Clear auth state immediately
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthCache(null);
      
      // Make API call to server
      await fetch('/api/v1/users/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: AbortSignal.timeout(3000)
      });
      
      // Clear client storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api/v1;`;
        }
      });
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear client state
      sessionStorage.clear();
      localStorage.clear();
      return false;
    }
  }, []);

  // Function to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // Don't refresh if logout is in progress
      if (sessionStorage.getItem(LOGOUT_KEY) === 'true') {
        return false;
      }
      
      if (DEBUG) console.log('Refreshing session...');
      
      const response = await fetch('/api/v1/auth/refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Session refresh failed:', response.status, response.statusText);
        // If session refresh fails, update state
        setIsAuthenticated(false);
        setIsAdmin(false);
        
        // Clear auth cache
        setAuthCache(null);
        
        return false;
      }
      
      // Parse response and update admin status
      const data = await response.json();
      console.log('Session refresh response:', data); // Debug logging
      
      setIsAuthenticated(true);
      
      // Handle admin status explicitly
      const adminStatus = !!data.is_admin;
      setIsAdmin(adminStatus);
      
      if (DEBUG) {
        console.log('✅ Authentication refreshed');
        console.log('👑 Admin status after refresh:', adminStatus);
      }
      
      // Update auth cache after refresh
      setAuthCache({
        timestamp: Date.now(),
        isAuthenticated: true,
        isAdmin: adminStatus
      });
      
      return true;
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Failed to refresh session');
      return false;
    }
  }, []);

  // Clear logout flag if it exists on mount
  useEffect(() => {
    if (sessionStorage.getItem(LOGOUT_KEY) === 'true') {
      sessionStorage.removeItem(LOGOUT_KEY);
    }
    if (sessionStorage.getItem(PREVENT_API_REQUESTS_KEY) === 'true') {
      sessionStorage.removeItem(PREVENT_API_REQUESTS_KEY);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up session refresh interval
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      // Only try to refresh if we believe the user is currently authenticated
      // and not logging out
      if (isAuthenticated && sessionStorage.getItem(LOGOUT_KEY) !== 'true') {
        refreshSession();
      }
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refreshSession, isAuthenticated]);

  // Add a utility to check if API requests should be prevented
  const shouldPreventAPIRequests = useCallback(() => {
    return sessionStorage.getItem(PREVENT_API_REQUESTS_KEY) === 'true';
  }, []);

  return {
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    checkAuthStatus,
    refreshSession,
    logout,
    shouldPreventAPIRequests,
    debug: {
      adminStatus: isAdmin,
      authStatus: isAuthenticated,
      debugInfo
    }
  };
} 