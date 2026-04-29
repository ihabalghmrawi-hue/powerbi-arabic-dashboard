import { NextResponse }       from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCompanyContext }  from '@/lib/auth'
import { scoreCustomers, buildRegionGrowthScores, generateInsights } from '@/lib/aiScoring'

export async function GET() {
  try {
    const ctx = await getCompanyContext()
    if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const supabase = createServerClient()
    const cid = ctx.companyId

    const [
      { data: employees, error: e1 },
      { data: customers, error: e2 },
      { data: regions,   error: e3 },
      { count: total },
    ] = await Promise.all([
      supabase.from('employee_stats').select('*').eq('company_id', cid).order('rank'),
      supabase.from('customers').select('customer_id,customer_name,region,registration_date,assigned_employee_id').eq('company_id', cid).order('registration_date'),
      supabase.from('regions_summary').select('*').eq('company_id', cid).order('customer_count', { ascending: false }),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', cid),
    ])

    const dbError = e1 || e2 || e3
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    if (!employees?.length || !customers?.length) {
      return NextResponse.json({ error: 'لا توجد بيانات — يرجى رفع الموظفين والعملاء أولاً' }, { status: 404 })
    }

    const empMap: Record<string, { rank: number; name: string }> = {}
    for (const e of employees) {
      empMap[e.employee_id] = { rank: e.rank, name: e.employee_name }
    }

    const flatCustomers = customers.map(c => ({
      customer_id:          c.customer_id,
      customer_name:        c.customer_name,
      region:               c.region,
      registration_date:    c.registration_date,
      assigned_employee_id: c.assigned_employee_id,
      employee_name:        empMap[c.assigned_employee_id]?.name ?? c.assigned_employee_id,
      employee_rank:        empMap[c.assigned_employee_id]?.rank ?? employees.length,
    }))

    const growthScores    = buildRegionGrowthScores(flatCustomers)
    const scoredCustomers = scoreCustomers(flatCustomers, employees.length, growthScores)
    const insights        = generateInsights({
      employees,
      regions:        regions ?? [],
      customers:      flatCustomers,
      scoredCustomers,
      totalCustomers: total ?? 0,
    })

    const dist = { high: 0, medium: 0, low: 0 }
    for (const c of scoredCustomers) dist[c.ai_label]++

    return NextResponse.json({ insights, scoredCustomers, distribution: dist, totalCustomers: total ?? 0 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
