import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import SidebarWrapper from '@/components/SidebarWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Try to load company — if schema not set up yet, redirect to setup
  let companyName = ''
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('company_id, companies(name)')
      .eq('id', user.id)
      .single()

    if (error) {
      // Table doesn't exist or no profile yet — send to setup
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist')) {
        redirect('/setup')
      }
    }

    companyName = (profile?.companies as any)?.name ?? user.email?.split('@')[0] ?? ''
  } catch {
    redirect('/setup')
  }

  return (
    <div className="app-shell">
      <SidebarWrapper companyName={companyName} userEmail={user.email ?? ''} />
      <div id="main-content" className="main-content">
        {children}
      </div>
    </div>
  )
}
