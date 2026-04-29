import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const [
    { count: totalCustomers },
    { data: empStats },
    { data: regions },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('employee_stats').select('*').order('customer_count', { ascending: false }),
    supabase.from('regions_summary').select('*').order('customer_count', { ascending: false }),
  ])

  return NextResponse.json({
    total_customers:  totalCustomers ?? 0,
    top_employee:     empStats?.[0] ?? null,
    avg_per_employee: empStats?.length ? Math.round((totalCustomers ?? 0) / empStats.length) : 0,
    employees:        empStats ?? [],
    regions:          regions  ?? [],
  })
}
