import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLocation('/auth/sign-in');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    }
    loadUser();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.full_name || 'User'}! 👋</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-600">
                <strong>User Type:</strong> {user.user_type.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-slate-600">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-slate-600">
                <strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

