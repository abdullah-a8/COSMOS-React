import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing CSRF tokens
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch a CSRF token from the server
  const fetchCsrfToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get the token from cookies first
      const cookieToken = getCsrfTokenFromCookies();
      if (cookieToken) {
        setCsrfToken(cookieToken);
        setIsLoading(false);
        return cookieToken;
      }
      
      // If no token in cookies, fetch from API
      const response = await fetch('/api/v1/csrf-token');
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      
      const data = await response.json();
      setCsrfToken(data.csrf_token);
      setIsLoading(false);
      return data.csrf_token;
    } catch (err) {
      setError('Could not fetch CSRF token');
      console.error('Error fetching CSRF token:', err);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Extract CSRF token from cookies
  const getCsrfTokenFromCookies = () => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'cosmos_csrf_token') {
        return value;
      }
    }
    return null;
  };

  // Add CSRF token to fetch requests
  const fetchWithCsrf = useCallback(async (url: string, options: RequestInit = {}) => {
    // Make sure we have a token
    let token = csrfToken;
    if (!token) {
      token = await fetchCsrfToken();
      if (!token) {
        throw new Error('Could not get CSRF token for request');
      }
    }
    
    // Prepare headers
    const headers = new Headers(options.headers || {});
    headers.set('X-CSRF-Token', token);
    
    // Make the request
    return fetch(url, {
      ...options,
      headers
    });
  }, [csrfToken, fetchCsrfToken]);

  // Fetch the token when the hook is first used
  useEffect(() => {
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  return {
    csrfToken,
    isLoading,
    error,
    fetchCsrfToken,
    fetchWithCsrf
  };
} 