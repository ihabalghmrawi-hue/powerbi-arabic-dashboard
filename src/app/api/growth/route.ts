import { NextResponse }        from 'next/server'
import { createServerClient }  from '@/lib/supabase-server'
import { getCompanyContext }   from '@/lib/auth'

export async function GET() {
  try {
    const ctx = await getCompanyContext()
    if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const supabase = createServerClient()
    const { data: customers, error } = await supabase
      .from('customers')
      .select('registration_date, region')
      .eq('company_id', ctx.companyId)
      .order('registration_date')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!customers?.length) return NextResponse.json({ growth: [], regionData: [] })

    // Monthly cumulative growth
    const monthly: Record<string, number> = {}
    for (const c of customers) {
      const month = c.registration_date.slice(0, 7)
      monthly[month] = (monthly[month] ?? 0) + 1
    }

    let cumulative = 0
    const growth = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        cumulative += count
        return { month, new: count, total: cumulative }
      })

    // Region breakdown for pie
    const regionMap: Record<string, number> = {}
    for (const c of customers) {
      regionMap[c.region] = (regionMap[c.region] ?? 0) + 1
    }
    const regionData = Object.entries(regionMap).map(([region, value]) => ({ region, value }))

    return NextResponse.json({ growth, regionData })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
