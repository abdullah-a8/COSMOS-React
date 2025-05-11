import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// Define types matching your existing application
export interface InviteCode {
  id: number;
  email: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  redemption_count: number;
  max_redemptions: number;
}

interface AdminStore {
  inviteCodes: InviteCode[];
  lastFetched: number;
  activeFilter: boolean;
  isLoading: boolean;
  error: string | null;
  setInviteCodes: (codes: InviteCode[], activeFilter: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCache: () => void;
}

// Admin data cache validity - 1 minute (matching your current implementation)
export const ADMIN_CACHE_VALIDITY = 60 * 1000;

// Type for our custom storage
type AdminStoreStorage = {
  getItem: (name: string) => any;
  setItem: (name: string, value: unknown) => void;
  removeItem: (name: string) => void;
};

// Persist configuration
const persistConfig: PersistOptions<AdminStore, unknown> = {
  name: 'admin-data-cache',
  // Use sessionStorage to avoid persisting sensitive admin data between browser sessions
  storage: {
    getItem: (name: string) => {
      const str = sessionStorage.getItem(name);
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch (e) {
        console.error('Error parsing admin cache:', e);
        sessionStorage.removeItem(name);
        return null;
      }
    },
    setItem: (name: string, value: unknown) => {
      try {
        sessionStorage.setItem(name, JSON.stringify(value));
      } catch (e) {
        console.error('Error storing admin cache:', e);
      }
    },
    removeItem: (name: string) => {
      sessionStorage.removeItem(name);
    },
  } as AdminStoreStorage,
};

/**
 * Admin store using Zustand with session persistence
 * Caches admin panel data to prevent unnecessary refetches when navigating
 */
export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      inviteCodes: [],
      lastFetched: 0,
      activeFilter: true,
      isLoading: false,
      error: null,
      
      setInviteCodes: (codes: InviteCode[], activeFilter: boolean) => set({ 
        inviteCodes: codes, 
        lastFetched: Date.now(),
        activeFilter
      }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),
      
      clearCache: () => set({ 
        inviteCodes: [], 
        lastFetched: 0 
      }),
    }),
    persistConfig
  )
); 