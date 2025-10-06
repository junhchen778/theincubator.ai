import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth';
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
    // Listen to auth state changes
    // This fires immediately with INITIAL_SESSION event on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email || 'no user');

        if (session?.user) {
          // User is logged in - fetch their full profile
          console.log('Fetching profile for user:', session.user.id);
          const profile = await getUserProfile(session.user.id);
          console.log('Profile fetched:', profile);
          setUser(profile);
        } else {
          // No session - user is logged out
          console.log('No session, setting user to null');
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      setUser(profile);
    }
  };

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
