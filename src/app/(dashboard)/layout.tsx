import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import SidebarWrapper from '@/components/SidebarWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, companies(name)')
    .eq('id', user.id)
    .single()

  const companyName = (profile?.companies as any)?.name ?? 'شركتك'

  return (
    <div className="app-shell">
      <SidebarWrapper companyName={companyName} userEmail={user.email ?? ''} />
      <div id="main-content" className="main-content">
        {children}
      </div>
    </div>
  )
}
