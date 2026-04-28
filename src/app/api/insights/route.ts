import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  scoreCustomers,
  buildRegionGrowthScores,
  generateInsights,
} from '@/lib/aiScoring'

export async function GET() {
  const supabase = createServerClient()

  const [
    { data: employees },
    { data: customers },
    { data: regions },
    { count: total },
  ] = await Promise.all([
    supabase.from('employee_stats').select('*').order('rank'),
    supabase
      .from('customers')
      .select(`
        customer_id, customer_name, region,
        registration_date, assigned_employee_id,
        employees(employee_name)
      `)
      .order('registration_date'),
    supabase.from('regions_summary').select('*').order('customer_count', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ])

  if (!employees || !customers || !regions) {
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 })
  }

  // Build employee rank lookup
  const empRankMap: Record<string, { rank: number; name: string }> = {}
  for (const e of employees) {
    empRankMap[e.employee_id] = { rank: e.rank, name: e.employee_name }
  }

  // Flatten joined employee data
  const flatCustomers = customers.map((c: Record<string, unknown>) => ({
    customer_id:          c.customer_id as string,
    customer_name:        c.customer_name as string,
    region:               c.region as string,
    registration_date:    c.registration_date as string,
    assigned_employee_id: c.assigned_employee_id as string,
    employee_name:        (c.employees as Record<string, string> | null)?.employee_name,
    employee_rank:        empRankMap[c.assigned_employee_id as string]?.rank ?? employees.length,
  }))

  const growthScores    = buildRegionGrowthScores(flatCustomers)
  const scoredCustomers = scoreCustomers(flatCustomers, employees.length, growthScores)
  const insights        = generateInsights({
    employees,
    regions,
    customers: flatCustomers,
    scoredCustomers,
    totalCustomers: total ?? 0,
  })

  // Distribution summary
  const dist = { high: 0, medium: 0, low: 0 }
  for (const c of scoredCustomers) dist[c.ai_label]++

  return NextResponse.json({
    insights,
    scoredCustomers,
    distribution: dist,
    totalCustomers: total ?? 0,
  })
}
