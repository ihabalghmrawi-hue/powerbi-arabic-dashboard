import { NextResponse }       from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCompanyContext }  from '@/lib/auth'

export async function GET() {
  const ctx = await getCompanyContext()
  if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const supabase = createServerClient()
  const cid = ctx.companyId

  const [
    { count: totalCustomers },
    { data: empStats },
    { data: regions },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', cid),
    supabase.from('employee_stats').select('*').eq('company_id', cid).order('customer_count', { ascending: false }),
    supabase.from('regions_summary').select('*').eq('company_id', cid).order('customer_count', { ascending: false }),
  ])

  return NextResponse.json({
    total_customers:  totalCustomers ?? 0,
    top_employee:     empStats?.[0] ?? null,
    avg_per_employee: empStats?.length ? Math.round((totalCustomers ?? 0) / empStats.length) : 0,
    employees:        empStats ?? [],
    regions:          regions  ?? [],
  })
}
