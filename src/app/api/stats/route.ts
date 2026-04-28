import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()

  const [{ count: totalCustomers }, { data: empStats }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('employee_stats').select('*').order('customer_count', { ascending: false }),
  ])

  const topEmployee = empStats?.[0] ?? null
  const avgPerEmployee = empStats?.length
    ? Math.round((totalCustomers ?? 0) / empStats.length)
    : 0

  return NextResponse.json({
    total_customers: totalCustomers ?? 0,
    top_employee: topEmployee,
    avg_per_employee: avgPerEmployee,
    employees: empStats ?? [],
  })
}
