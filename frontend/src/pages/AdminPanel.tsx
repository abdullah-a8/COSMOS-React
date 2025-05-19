import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCsrf } from '../hooks/useCsrf';
import { motion } from 'framer-motion'; // Import motion for animations
import { useDevice } from '../hooks/useDevice'; // Import useDevice hook
import { Key } from 'lucide-react'; // Import icons
import { useAdminStore, ADMIN_CACHE_VALIDITY } from '../store/adminStore';

// Define types for our invite code data
interface InviteCode {
  id: number;
  email: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  redemption_count: number;
}

// Define type for the new code form
interface NewInviteCode {
  email: string;
  expires_days: number | null;
}

interface CreateResponse {
  id: number;
  code: string;
  email: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  redemption_count: number;
  max_redemptions: number;
}

// Cache configuration
const DATA_CACHE_VALIDITY = ADMIN_CACHE_VALIDITY; // Use the same cache validity from store

interface DataCache<T> {
  data: T[];
  timestamp: number;
  filter: any; // Cache key based on filter criteria
}

// Email validation regex - balances validation strictness with practical use
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_'+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;

// Get values and functions from the admin store
export default function AdminPanel() {
  // Get values and functions from the admin store
  const storeInviteCodes = useAdminStore(state => state.inviteCodes);
  const storeLastFetched = useAdminStore(state => state.lastFetched);
  const storeActiveFilter = useAdminStore(state => state.activeFilter);
  const storeError = useAdminStore(state => state.error);
  const storeSetInviteCodes = useAdminStore(state => state.setInviteCodes);
  const storeSetError = useAdminStore(state => state.setError);
  const storeSetLoading = useAdminStore(state => state.setLoading);
  
  // Local component state
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(storeInviteCodes);
  const [isLoading, setIsLoading] = useState<boolean>(storeInviteCodes.length === 0);
  const [error, setError] = useState<string | null>(storeError);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(storeActiveFilter);
  const [newCode, setNewCode] = useState<NewInviteCode>({
    email: '',
    expires_days: null
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [expiryError, setExpiryError] = useState<string | null>(null);
  
  // We'll keep the ref for backward compatibility, but we'll primarily use the store
  const dataCache = useRef<DataCache<InviteCode> | null>(null);
  
  const navigate = useNavigate();
  const { fetchWithCsrf } = useCsrf();
  const { isMobile } = useDevice();

  // Email validation function
  const validateEmail = (email: string) => {
    if (!email) return false; // Email is required
    return EMAIL_REGEX.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewCode({...newCode, email});
    
    if (!email) {
      setEmailError('Email is required');
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  // Handle expiry days input change with validation
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const days = value ? parseInt(value) : null;
    setNewCode({...newCode, expires_days: days});
    
    if (days === null) {
      setExpiryError('Expiry days is required');
    } else if (days < 0) {
      setExpiryError('Expiry days must be a positive number or zero');
    } else {
      setExpiryError(null);
    }
  };

  // Check if store cache is valid
  const isStoreCacheValid = useCallback(() => {
    if (storeInviteCodes.length === 0 || !storeLastFetched) return false;
    
    // Check timestamp validity
    const isTimestampValid = Date.now() - storeLastFetched < DATA_CACHE_VALIDITY;
    
    // Check if filter criteria matches
    const isFilterMatching = storeActiveFilter === showActiveOnly;
    
    return isTimestampValid && isFilterMatching;
  }, [storeInviteCodes, storeLastFetched, storeActiveFilter, showActiveOnly]);

  // Legacy cache check - keeping for compatibility
  const isCacheValid = useCallback(() => {
    if (!dataCache.current) return false;
    
    // Check timestamp validity
    const isTimestampValid = Date.now() - dataCache.current.timestamp < DATA_CACHE_VALIDITY;
    
    // Check if filter criteria matches
    const isFilterMatching = dataCache.current.filter === showActiveOnly;
    
    return isTimestampValid && isFilterMatching;
  }, [showActiveOnly]);

  // Load invite codes when component mounts or filter changes
  const fetchInviteCodes = useCallback(async (forceRefresh = false) => {
    // First check the global store cache
    if (!forceRefresh && isStoreCacheValid()) {
      setInviteCodes(storeInviteCodes);
      setIsLoading(false);
      return;
    }
    
    // Then check the legacy cache as fallback
    if (!forceRefresh && !isStoreCacheValid() && isCacheValid()) {
      setInviteCodes(dataCache.current!.data);
      setIsLoading(false);
      return;
    }
    
    // Only show loading indicator on initial load or forced refresh
    if (inviteCodes.length === 0 || forceRefresh) {
      setIsLoading(true);
      storeSetLoading(true);
    }
    
    setError(null);
    storeSetError(null);
    
    try {
      const response = await fetch(`/api/v1/admin/invite-codes?active_only=${showActiveOnly}`);
      
      if (response.status === 401) {
        // Not authenticated as admin, redirect to home
        navigate('/');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch invite codes');
      }
      
      const data = await response.json();
      
      // Update both local state and store
      setInviteCodes(data);
      storeSetInviteCodes(data, showActiveOnly);
      
      // Also update legacy cache for backward compatibility
      dataCache.current = {
        data,
        timestamp: Date.now(),
        filter: showActiveOnly
      };
    } catch (err) {
      const errorMsg = 'Error loading invite codes. Please try again.';
      setError(errorMsg);
      storeSetError(errorMsg);
      console.error('Error fetching invite codes:', err);
    } finally {
      setIsLoading(false);
      storeSetLoading(false);
    }
  }, [
    showActiveOnly, 
    navigate, 
    inviteCodes.length, 
    isCacheValid, 
    isStoreCacheValid, 
    storeInviteCodes,
    storeSetInviteCodes,
    storeSetError,
    storeSetLoading
  ]);

  // Effect to sync the component state with store state
  useEffect(() => {
    if (storeInviteCodes.length > 0 && storeActiveFilter === showActiveOnly) {
      setInviteCodes(storeInviteCodes);
    }
  }, [storeInviteCodes, storeActiveFilter, showActiveOnly]);

  // Effect to update the filter in the store when it changes locally
  useEffect(() => {
    // If filter changed, consider invalidating the cache
    if (storeActiveFilter !== showActiveOnly) {
      fetchInviteCodes(false);
    }
  }, [showActiveOnly, storeActiveFilter, fetchInviteCodes]);

  // Effect for initial load
  useEffect(() => {
    fetchInviteCodes(false);
  }, [fetchInviteCodes]);

  // Effect to clear emailError after 6 seconds
  useEffect(() => {
    if (emailError) {
      const timer = setTimeout(() => {
        setEmailError(null);
      }, 6000); // 6 seconds
      
      return () => clearTimeout(timer);
    }
  }, [emailError]);
  
  // Effect to clear expiryError after 6 seconds
  useEffect(() => {
    if (expiryError) {
      const timer = setTimeout(() => {
        setExpiryError(null);
      }, 6000); // 6 seconds
      
      return () => clearTimeout(timer);
    }
  }, [expiryError]);

  const createInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both fields are filled
    let hasErrors = false;
    
    if (!newCode.email) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(newCode.email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    
    if (newCode.expires_days === null) {
      setExpiryError('Expiry days is required');
      hasErrors = true;
    } else if (newCode.expires_days < 0) {
      setExpiryError('Expiry days must be a positive number or zero');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    storeSetError(null);
    setEmailError(null);
    setExpiryError(null);
    setGeneratedCode(null);
    
    try {
      // Use the fetchWithCsrf utility to automatically include CSRF token
      const response = await fetchWithCsrf('/api/v1/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode)
      });
      
      if (!response.ok) {
        // Try to get detailed error message from response
        let errorMessage = 'Error creating invite code. Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const data: CreateResponse = await response.json();
      setGeneratedCode(data.code);
      
      // Refresh the list with force refresh to bypass cache
      fetchInviteCodes(true);
      
      // Reset form
      setNewCode({
        email: '',
        expires_days: null
      });
    } catch (err) {
      // Get error message from the Error object or use a default
      const errorMsg = err instanceof Error ? err.message : 'Error creating invite code. Please try again.';
      setError(errorMsg);
      storeSetError(errorMsg);
      console.error('Error creating invite code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const deactivateInviteCode = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this invite code?')) {
      return;
    }
    
    setError(null);
    storeSetError(null);
    
    try {
      // Use fetchWithCsrf for DELETE request
      const response = await fetchWithCsrf(`/api/v1/admin/invite-codes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate invite code');
      }
      
      // Refresh the list with force refresh to bypass cache
      fetchInviteCodes(true);
    } catch (err) {
      const errorMsg = 'Error deactivating invite code. Please try again.';
      setError(errorMsg);
      storeSetError(errorMsg);
      console.error('Error deactivating invite code:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    // Add proper padding at the top to avoid navbar overlap
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`container mx-auto px-4 ${isMobile ? 'pt-24' : 'pt-28'} pb-16 max-w-6xl`}
    >
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
          Beta Access Management
        </h1>
      </motion.div>
      
      {/* Create new invite code form */}
      <motion.div 
        variants={itemVariants}
        className="mb-10 bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
      >
        <h2 className="text-xl font-semibold mb-4 text-white">Create New Invite Code</h2>
        
        <form onSubmit={createInviteCode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={newCode.email || ''}
                onChange={handleEmailChange}
                placeholder="user@example.com"
                className={`w-full px-3 py-2 bg-black/30 border ${emailError ? 'border-red-500' : 'border-white/20'} rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 ${emailError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-purple-500 focus:border-purple-500'} transition-colors`}
              />
              {emailError && (
                <p className="text-xs text-red-400 mt-1">{emailError}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1" htmlFor="expires_days">
                Expires After (Days)
              </label>
              <input
                type="number"
                id="expires_days"
                value={newCode.expires_days || ''}
                onChange={handleExpiryChange}
                min="0"
                placeholder="30"
                className={`w-full px-3 py-2 bg-black/30 border ${expiryError ? 'border-red-500' : 'border-white/20'} rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 ${expiryError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-purple-500 focus:border-purple-500'} transition-colors`}
              />
              <p className="text-xs text-white/50 mt-1">Set to 0 for never expires</p>
              {expiryError && (
                <p className="text-xs text-red-400 mt-1">{expiryError}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              type="submit"
              disabled={isGenerating || !!emailError || !!expiryError}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Invite Code'
              )}
            </button>
          </div>
        </form>
        
        {generatedCode && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.2)]"
          >
            <h3 className="text-sm font-medium text-purple-400 mb-2">New Invite Code Generated</h3>
            <div className="flex items-center">
              <code className="bg-purple-950/50 text-purple-200 px-3 py-2 rounded font-mono text-sm flex-1 select-all overflow-x-auto">
                {generatedCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert('Copied to clipboard!');
                }}
                className="ml-2 p-2 text-white/70 hover:text-white bg-purple-800/30 hover:bg-purple-800/50 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Save this code! For security reasons, it can only be viewed once.
            </p>
          </motion.div>
        )}
      </motion.div>
      
      {/* Error message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 shadow-[0_0_15px_rgba(220,38,38,0.1)]"
        >
          {error}
        </motion.div>
      )}
      
      {/* List of invite codes */}
      <motion.div 
        variants={itemVariants}
        className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-white">Invite Codes</h2>
          
          <div className="flex items-center">
            <label className="inline-flex items-center text-sm text-white/70">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500 bg-black/30 border-white/30"
              />
              <span className="ml-2">Show active only</span>
            </label>
            
            <button
              onClick={() => fetchInviteCodes()}
              className="ml-4 p-2 text-white/70 hover:text-white bg-purple-800/30 hover:bg-purple-800/50 rounded-lg transition-colors"
              title="Refresh list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block w-10 h-10 border-4 border-white/20 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-white/60">Loading invite codes...</p>
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="text-center py-10 text-white/60">
            {showActiveOnly ? 
              "No active invite codes found." : 
              "No invite codes found."}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 rounded-lg">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Uses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/10">
                {inviteCodes.map((code) => (
                  <motion.tr 
                    key={code.id} 
                    className={`${code.is_active ? "hover:bg-white/5" : "opacity-50"} transition-colors`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{code.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/90">{code.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{formatDate(code.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{formatDate(code.expires_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {code.redemption_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {code.is_active && (
                        <button
                          onClick={() => deactivateInviteCode(code.id)}
                          className="text-red-400 hover:text-red-300 focus:outline-none p-1 hover:bg-red-900/20 rounded transition-colors"
                          title="Deactivate code"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
} 