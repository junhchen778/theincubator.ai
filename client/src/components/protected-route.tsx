import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        setLocation('/auth/sign-in');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    }
    
    // Check auth on mount
    checkAuth();
    
    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (!user) {
        setLocation('/auth/sign-in');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setLocation]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

