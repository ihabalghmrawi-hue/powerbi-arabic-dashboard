import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { getCompanyContext } from '@/lib/auth'
import TopBar from '@/components/TopBar'
import DashboardClient from '@/components/Dashboard'

async function getData(companyId: string) {
  const supabase = createServerClient()
  const [
    { data: employees },
    { data: customers },
    { data: regions },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('employee_stats').select('*').eq('company_id', companyId).order('customer_count', { ascending: false }),
    supabase.from('customers').select('customer_id,customer_name,region,registration_date,assigned_employee_id').eq('company_id', companyId).order('registration_date'),
    supabase.from('regions_summary').select('*').eq('company_id', companyId).order('customer_count', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
  ])
  return {
    employees:      employees      ?? [],
    customers:      customers      ?? [],
    regions:        regions        ?? [],
    totalCustomers: totalCustomers ?? 0,
  }
}

export default async function DashboardPage() {
  const ctx = await getCompanyContext()
  if (!ctx) redirect('/login')

  const data = await getData(ctx.companyId)
  return (
    <>
      <TopBar title="لوحة التحكم" companyName={ctx.companyName} userEmail={ctx.email} />
      <DashboardClient {...data} />
    </>
  )
}
