import { supabase, type UserType, type User } from './supabase';

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
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
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
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user with their profile
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.log('No auth user found:', authError);
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
      return null;
    }

    console.log('Current user loaded:', profile.email, 'type:', profile.user_type);
    return profile as User;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
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
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

