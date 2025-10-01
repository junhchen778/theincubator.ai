import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmvhinisflafruvzznqq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdmhpbmlzZmxhZnJ1dnp6bnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTI1MjAsImV4cCI6MjA3NDc4ODUyMH0.tcNQxcHwGmD6BxjpRHekhoicp6gjmPFfWPqum_GGOiA';

// Get the current origin for redirect URLs
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:5000/auth/callback';
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce', // Use PKCE flow for better security
  },
});

// Database types
export type UserType = 'founder' | 'individual_investor' | 'firm_member';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: UserType;
  bio: string | null;
  linkedin_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

