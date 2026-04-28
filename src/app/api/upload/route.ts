import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const ALLOWED_TABLES = ['employees', 'customers'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { table, rows } = body as { table: AllowedTable; rows: Record<string, string>[] }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'جدول غير مسموح به' }, { status: 400 })
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للرفع' }, { status: 400 })
    }

    // Sanitise: strip keys not matching expected column patterns
    const sanitised = rows.map(row => {
      const clean: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        // Only allow alphanumeric + underscore column names
        if (/^[a-z_]+$/.test(k) && typeof v === 'string') {
          clean[k] = v.trim()
        }
      }
      return clean
    })

    const supabase = createServerClient()
    const { error } = await supabase
      .from(table)
      .upsert(sanitised, { onConflict: table === 'employees' ? 'employee_id' : 'customer_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, inserted: sanitised.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
