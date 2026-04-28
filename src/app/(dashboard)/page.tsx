import { createServerClient } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import DashboardClient from '@/components/Dashboard'

async function getData() {
  const supabase = createServerClient()
  const [
    { data: employees },
    { data: customers },
    { data: regions },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('employee_stats').select('*').order('customer_count', { ascending: false }),
    supabase.from('customers').select('customer_id,customer_name,region,registration_date,assigned_employee_id').order('registration_date'),
    supabase.from('regions_summary').select('*').order('customer_count', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ])
  return {
    employees: employees ?? [],
    customers: customers ?? [],
    regions:   regions   ?? [],
    totalCustomers: totalCustomers ?? 0,
  }
}

export default async function DashboardPage() {
  const data = await getData()
  return (
    <>
      <TopBar title="لوحة التحكم" />
      <DashboardClient {...data} />
    </>
  )
}
