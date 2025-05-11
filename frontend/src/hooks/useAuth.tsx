import { useState, useEffect, useCallback } from 'react';

interface UseAuthOptions {
  refreshInterval?: number; // In minutes
}

// Cache validity period in milliseconds
const AUTH_CACHE_VALIDITY = 30 * 1000; // 30 seconds

interface AuthCache {
  timestamp: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Enable verbose debugging
const DEBUG = false;

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
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && authCache && (Date.now() - authCache.timestamp < AUTH_CACHE_VALIDITY)) {
        if (DEBUG) console.log('Using cached auth status');
        setIsAuthenticated(authCache.isAuthenticated);
        setIsAdmin(authCache.isAdmin);
        setIsLoading(false);
        return authCache.isAuthenticated;
      }
      
      const response = await fetch('/api/v1/auth-status');
      
      if (!response.ok) {
        console.error('Auth status check failed:', response.status, response.statusText);
        throw new Error(`Auth status check failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Auth status response:', data); // Debug logging
      
      // Explicitly log authentication and admin status
      if (DEBUG) {
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
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authCache]);

  // Function to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
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

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up session refresh interval
  useEffect(() => {
    if (!refreshInterval) return;
    
    const intervalId = setInterval(() => {
      // Only try to refresh if we believe the user is currently authenticated
      if (isAuthenticated) {
        refreshSession();
      }
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refreshSession, isAuthenticated]);

  return {
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    checkAuthStatus,
    refreshSession,
    debug: {
      adminStatus: isAdmin,
      authStatus: isAuthenticated,
      debugInfo
    }
  };
} 