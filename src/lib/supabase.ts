import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in localStorage for better reliability
    persistSession: true,
    // Detect session in URL for better auth flow
    detectSessionInUrl: true,
    // Set cookie options for production
    flowType: 'pkce',
    // Handle cookie storage properly
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
}) 