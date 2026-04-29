import { createClient }                from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies }                     from 'next/headers'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server / API Route client — reads user session from cookies (RLS applies)
export function createServerClient() {
  const cookieStore = cookies()
  return createSSRClient(url, anon, {
    cookies: {
      get(name: string)                        { return cookieStore.get(name)?.value },
      set(name: string, value: string, opts: any) { try { (cookieStore as any).set({ name, value, ...opts }) } catch {} },
      remove(name: string, opts: any)          { try { (cookieStore as any).set({ name, value: '', ...opts }) } catch {} },
    },
  })
}

// Service role client — bypasses RLS, use only for admin operations
export function createServiceClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
