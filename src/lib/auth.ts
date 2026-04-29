import { createServerClient } from './supabase-server'

export type CompanyContext = {
  userId:      string
  email:       string
  companyId:   string
  companyName: string
}

/**
 * Returns the authenticated user's company context.
 * Returns null if unauthenticated or profile missing.
 */
export async function getCompanyContext(): Promise<CompanyContext | null> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return null

  return {
    userId:      user.id,
    email:       user.email ?? '',
    companyId:   profile.company_id,
    companyName: (profile.companies as any)?.name ?? '',
  }
}
