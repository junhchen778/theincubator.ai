import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

/**
 * Global auth handler that listens for authentication events
 * and handles email confirmation redirects
 */
export function AuthHandler({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const hasHandledAuth = useRef(false);

  useEffect(() => {
    // Handle auth code in URL (from email confirmation) - only run once
    const handleAuthCode = async () => {
      if (hasHandledAuth.current) return;
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        console.error('Auth error:', error, errorDescription);
        setLocation('/auth/sign-in?error=' + encodeURIComponent(errorDescription || error));
        return;
      }

      if (code) {
        hasHandledAuth.current = true;
        console.log('Found auth code, exchanging for session...');
        
        try {
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            setLocation('/auth/sign-in?error=' + encodeURIComponent(exchangeError.message));
            return;
          }

          if (data.session) {
            console.log('Session created successfully!');
            
            // Clear the code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Get user profile to determine redirect
            const user = await getCurrentUser();
            
            if (user) {
              // Redirect based on user type
              if (user.user_type === 'founder') {
                setLocation('/onboarding/company');
              } else if (user.user_type === 'individual_investor') {
                setLocation('/onboarding/investor');
              } else if (user.user_type === 'firm_member') {
                setLocation('/onboarding/firm');
              } else {
                setLocation('/feed');
              }
            }
          }
        } catch (err) {
          console.error('Auth code exchange error:', err);
          setLocation('/auth/sign-in?error=verification_failed');
        }
      }
    };

    handleAuthCode();

    // Listen for auth state changes - set up only once
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  return <>{children}</>;
}

