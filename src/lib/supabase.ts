import { createClient } from '@supabase/supabase-js';

// .trim() removes any newlines that env providers (Vercel) may inject
const supabaseUrl = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined)?.trim() ?? '';

// Only create client if env vars are configured
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
