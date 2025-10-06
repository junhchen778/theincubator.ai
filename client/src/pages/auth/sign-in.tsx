import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn } from '@/lib/auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already signed in, redirecting to /feed');
      setLocation('/feed');
    }
  }, [user, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      // Sign-in successful - the useEffect will handle redirect when user state updates
      console.log('Sign-in successful, waiting for auth state to update...');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Incubator.ai account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center space-y-2">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setLocation('/auth/forgot-password')}
                type="button"
              >
                Forgot your password?
              </Button>

              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setLocation('/auth/sign-up')}
                  type="button"
                >
                  Sign Up
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

