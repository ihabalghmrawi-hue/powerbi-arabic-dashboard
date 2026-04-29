import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('registration_date, region')
    .order('registration_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by month → cumulative growth line
  const byMonth: Record<string, number> = {}
  for (const c of customers ?? []) {
    const month = c.registration_date.slice(0, 7) // "2024-01"
    byMonth[month] = (byMonth[month] ?? 0) + 1
  }

  // Build sorted array with cumulative count
  let cumulative = 0
  const growth = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      cumulative += count
      return {
        month,
        label: new Date(month + '-01').toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
        new_customers: count,
        total_customers: cumulative,
      }
    })

  // Group by region for pie
  const byRegion: Record<string, number> = {}
  for (const c of customers ?? []) {
    byRegion[c.region] = (byRegion[c.region] ?? 0) + 1
  }
  const regionData = Object.entries(byRegion).map(([name, value]) => ({ name, value }))

  return NextResponse.json({ growth, regionData })
}
