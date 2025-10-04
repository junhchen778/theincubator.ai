import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

/**
 * Global auth handler that listens for authentication events
 * and handles email confirmation redirects
 */
export function AuthHandler({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const hasHandledAuth = useRef(false);
  const isHandlingCode = useRef(false);

  useEffect(() => {
    // Handle auth code in URL (from email confirmation) - only run once
    const handleAuthCode = async () => {
      if (hasHandledAuth.current || isHandlingCode.current) return;
      
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
        isHandlingCode.current = true;
        console.log('Found auth code, exchanging for session...');
        
        try {
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            isHandlingCode.current = false;
            setLocation('/auth/sign-in?error=' + encodeURIComponent(exchangeError.message));
            return;
          }

          if (data.session) {
            console.log('Session created successfully!');
            
            // Clear the code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Wait a moment for auth state to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Redirect to feed - onboarding button will show in nav if needed
            console.log('Redirecting to feed...');
            isHandlingCode.current = false;
            setLocation('/feed');
          } else {
            isHandlingCode.current = false;
          }
        } catch (err) {
          console.error('Auth code exchange error:', err);
          isHandlingCode.current = false;
          setLocation('/auth/sign-in?error=verification_failed');
        }
      }
    };

    handleAuthCode();

    // Note: Auth state changes are now handled by AuthContext
    // This component only handles email confirmation codes
  }, []); // Empty dependency array - only run once on mount

  return <>{children}</>;
}

