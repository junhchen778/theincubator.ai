import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL parameters (for PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        // Also check for error in URL
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (code) {
          // Exchange the code for a session (PKCE flow)
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }
          
          if (!data.session) {
            throw new Error('No session created');
          }
        } else {
          // Fallback: Check for hash-based tokens (older flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (!accessToken) {
            throw new Error('No authentication code or token found');
          }
        }

        // Get the user's profile to determine their type
        const user = await getCurrentUser();
        
        if (!user) {
          throw new Error('Failed to get user profile');
        }

        setStatus('success');

        // Wait a moment to show success, then redirect based on user type
        setTimeout(() => {
          if (user.user_type === 'founder') {
            setLocation('/onboarding/company');
          } else if (user.user_type === 'individual_investor') {
            setLocation('/onboarding/investor');
          } else if (user.user_type === 'firm_member') {
            setLocation('/onboarding/firm');
          } else {
            setLocation('/feed');
          }
        }, 1500);

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <p className="text-slate-600">
              Please wait while we verify your email address.
            </p>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Your email has been verified successfully! Redirecting you to complete your profile...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 text-sm">
                {error}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setLocation('/auth/sign-up')}>
                  Try signing up again
                </Button>
                <Button variant="outline" onClick={() => setLocation('/auth/sign-in')}>
                  Go to Sign In
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

