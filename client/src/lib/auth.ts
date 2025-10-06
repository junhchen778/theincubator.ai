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
  const redirectUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5000';

  const { data, error } = await supabase.auth.signUp({
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

  if (error) throw error;

  // Manually create the user profile in public.users table
  if (data.user) {
    console.log('Creating profile for new user:', data.user.id);

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        user_type: userType,
        verified: false,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw - user is created in auth, just log the error
    }

    // Create type-specific profile if needed
    if (userType === 'individual_investor') {
      const { error: investorError } = await supabase
        .from('individual_investors')
        .insert({
          user_id: data.user.id,
          accredited: false,
        });

      if (investorError) {
        console.error('Investor profile error:', investorError);
      }
    }
  }

  return data;
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get user profile from database by user ID
 * Auto-creates profile if it doesn't exist (for legacy users)
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    console.log('getUserProfile called for:', userId);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout after 5s')), 5000)
    );

    const fetchPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data, error } = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      // If profile doesn't exist, try to create it from auth user
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating from auth user...');

        // Get auth user data
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const newProfile = {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
            user_type: user.user_metadata?.user_type || 'founder',
            verified: false,
          };

          console.log('Creating missing profile:', newProfile);

          const { data: created, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            return null;
          }

          console.log('Profile created successfully:', created);
          return created as User;
        }
      }

      console.error('Profile fetch error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    if (!data) {
      console.error('No profile data returned for user:', userId);
      return null;
    }

    console.log('Profile data retrieved:', data);
    return data as User;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error);
    return null;
  }
  return session;
}
