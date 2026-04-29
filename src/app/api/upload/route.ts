import { NextResponse }       from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCompanyContext }  from '@/lib/auth'

const ALLOWED_TABLES = new Set(['employees', 'customers'])

function sanitizeKey(k: string) {
  return k.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
}

export async function POST(req: Request) {
  try {
    const ctx = await getCompanyContext()
    if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { table, rows } = await req.json() as { table: string; rows: Record<string, unknown>[] }

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: 'جدول غير مسموح به' }, { status: 400 })
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للرفع' }, { status: 400 })
    }

    // Sanitize column names + inject company_id
    const sanitized = rows.map(row => {
      const clean: Record<string, unknown> = { company_id: ctx.companyId }
      for (const [k, v] of Object.entries(row)) {
        clean[sanitizeKey(k)] = v
      }
      return clean
    })

    const supabase = createServerClient()
    const { error } = await supabase.from(table).upsert(sanitized)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, count: sanitized.length })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
