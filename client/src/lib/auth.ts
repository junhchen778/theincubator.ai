import { supabase, type UserType, type User } from './supabase';

// Simple in-memory cache for current user to avoid repeated DB calls
let userCache: User | null | undefined = undefined;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 60 seconds - cache user data for 1 minute

// Request de-duplication: prevent multiple simultaneous DB calls
let userFetchPromise: Promise<User | null> | null = null;

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userType: UserType;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user and create their profile
 */
export async function signUp({ email, password, fullName, userType }: SignUpData) {
  try {
    // Get the redirect URL - use root path since AuthHandler will handle it
    const redirectUrl = typeof window !== 'undefined' 
      ? window.location.origin
      : 'http://localhost:5000';

    console.log('Signing up with redirect URL:', redirectUrl);

    // Create auth user - the profile will be created automatically via database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create type-specific profile if needed
    if (userType === 'individual_investor') {
      // Check if record already exists
      const { data: existing } = await supabase
        .from('individual_investors')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (!existing) {
        const { error: investorError } = await supabase
          .from('individual_investors')
          .insert({
            user_id: authData.user.id,
            accredited: false,
          });

        if (investorError) {
          console.error('Investor profile creation error:', investorError);
          // Don't throw - allow sign-up to complete
        }
      }
    }

    return { user: authData.user, session: authData.session };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  // Clear cache BEFORE signing in to ensure fresh user data will be fetched
  // This must happen before signInWithPassword() because auth state changes fire immediately
  clearUserCache();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    // Clear cache on sign out
    userCache = null;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user with their profile
 * Uses a 60-second cache to avoid repeated database calls on navigation
 * De-duplicates simultaneous requests to prevent multiple DB calls
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (userCache !== undefined && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached user:', userCache?.email);
      return userCache;
    }

    // If a fetch is already in progress, return that promise
    if (userFetchPromise) {
      console.log('Fetch already in progress, waiting for existing request...');
      const result = await userFetchPromise;
      console.log('Existing request completed, user:', result?.email || 'none');
      return result;
    }

    console.log('Cache miss, fetching user from database...');
    
    // Create and store the fetch promise
    userFetchPromise = (async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.log('No auth user found:', authError);
          userCache = null;
          cacheTimestamp = now;
          return null;
        }

        // Get full user profile from public.users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError);
          userCache = null;
          cacheTimestamp = now;
          return null;
        }

        console.log('Current user loaded from DB:', profile.email, 'type:', profile.user_type);
        // Store in cache
        userCache = profile as User;
        cacheTimestamp = now;
        return profile as User;
      } finally {
        // Clear the in-flight promise
        userFetchPromise = null;
      }
    })();

    return userFetchPromise;
  } catch (error) {
    console.error('Get current user error:', error);
    userCache = null;
    cacheTimestamp = Date.now();
    userFetchPromise = null;
    return null;
  }
}

/**
 * Clear the user cache
 * Use this after profile updates to force a fresh fetch
 */
export function clearUserCache() {
  console.log('Clearing user cache');
  userCache = undefined;
  cacheTimestamp = 0;
  userFetchPromise = null; // Also clear in-flight requests
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 * Clears cache appropriately based on auth state
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      console.log('Auth state changed:', event, '- clearing cache');
      clearUserCache();
      callback(null);
    } else if (event === 'SIGNED_IN') {
      console.log('Auth state changed:', event, '- fetching fresh user data');
      // Don't clear cache here since signIn() already cleared it
      // Just fetch fresh data
      const user = await getCurrentUser();
      callback(user);
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('Auth state changed:', event, '- keeping cache');
      // Token refresh doesn't invalidate user data
      if (session?.user) {
        const user = await getCurrentUser();
        callback(user);
      }
    } else {
      // INITIAL_SESSION or other events
      if (session?.user) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    }
  });
}

