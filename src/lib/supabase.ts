import { createClient } from '@supabase/supabase-js'

// SMU Wiki bruger SAMME Supabase-projekt som SMU OS (delt login + brugere).
// Kun anon key — al adgang er beskyttet af de stramme wiki_-RLS-politikker.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL og anon key mangler i .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
