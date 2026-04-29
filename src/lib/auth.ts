import { createServerClient } from './supabase-server'

export type CompanyContext = {
  userId:      string
  email:       string
  companyId:   string
  companyName: string
}

export async function getCompanyContext(): Promise<CompanyContext | null> {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('company_id, companies(name)')
      .eq('id', user.id)
      .single()

    // Schema not set up yet — return null so caller redirects to /setup
    if (error) return null
    if (!profile?.company_id) return null

    return {
      userId:      user.id,
      email:       user.email ?? '',
      companyId:   profile.company_id,
      companyName: (profile.companies as any)?.name ?? '',
    }
  } catch {
    return null
  }
}
