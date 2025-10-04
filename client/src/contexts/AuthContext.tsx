import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { getCurrentUser, onAuthStateChange, clearUserCache } from '@/lib/auth';
import type { User } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Don't load user on mount - let the auth state change handler do it
    // This prevents race conditions where we try to fetch before auth is ready

    // Single auth listener for entire app
    const { data: { subscription } } = onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser);
        // Set loading false after first auth event
        setLoading(false);
      }
    });
    
    // Set loading to false after a short delay if no auth events fire
    // This handles the case where user is not signed in
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const refetchUser = async () => {
    clearUserCache();
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  // Memoize to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    refetchUser
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

