import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser singleton (anon key + RLS) ───────────────────────
export const supabase = createClient(url, anon)

// ── Server / API Route client (user session via cookies + RLS) ─
export function createServerClient() {
  const cookieStore = cookies()
  return createSSRClient(url, anon, {
    cookies: {
      get(name)              { return cookieStore.get(name)?.value },
      set(name, value, opts) { try { (cookieStore as any).set({ name, value, ...opts }) } catch {} },
      remove(name, opts)     { try { (cookieStore as any).set({ name, value: '', ...opts }) } catch {} },
    },
  })
}

// ── Service role (bypasses RLS — use only for admin ops) ─────
export function createServiceClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
