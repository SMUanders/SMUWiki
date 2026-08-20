import { createClient } from '@supabase/supabase-js'
import { platformAuthStorage } from '../platform-nav/platformStorage'

// SMU Wiki bruger SAMME Supabase-projekt som SMU OS (delt login + brugere).
// Kun anon key — al adgang er beskyttet af de stramme wiki_-RLS-politikker.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL og anon key mangler i .env.local')
}

// Kun `storage` er overridet — miljøbevidst platform-session: delt cookie på
// *.smu.signmeup.dk (fælles login på tværs af SMU-apps), ellers localStorage.
// På det nuværende *.netlify.app-domæne er adfærden derfor UÆNDRET, indtil Wiki
// får sit custom subdomæne. Ingen anden auth-logik og ingen flowType er rørt.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: platformAuthStorage(),
  },
})
