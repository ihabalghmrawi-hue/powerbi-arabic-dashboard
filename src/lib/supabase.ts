import { createBrowserClient } from '@supabase/ssr'

// Uses createBrowserClient so the session is stored in COOKIES (not localStorage).
// This is required for the middleware to read the session on the server side.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
