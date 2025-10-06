import { createClient } from '@supabase/supabase-js';
import type { Database } from '../client/src/lib/database.types';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '⚠️  Missing Supabase configuration. AI Summary feature will not work.\n' +
    '   Please set these environment variables:\n' +
    '   - VITE_SUPABASE_URL\n' +
    '   - SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as any;
