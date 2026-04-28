import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (uses anon key + RLS)
export const supabase = createClient(url, anon)

// Server-only client (service role bypasses RLS)
export function createServerClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
