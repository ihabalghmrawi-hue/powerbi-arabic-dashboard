import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const ALLOWED = new Set(['employees', 'customers', 'all'])

export async function DELETE(req: Request) {
  try {
    const { table } = await req.json() as { table: string }

    if (!ALLOWED.has(table)) {
      return NextResponse.json({ error: 'جدول غير مسموح' }, { status: 400 })
    }

    const supabase = createServerClient()

    if (table === 'all' || table === 'customers') {
      // Delete customers first (FK dependency)
      const { error, count } = await supabase
        .from('customers')
        .delete({ count: 'exact' })
        .neq('customer_id', '')   // matches all rows
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (table === 'all' || table === 'employees') {
      const { error, count } = await supabase
        .from('employees')
        .delete({ count: 'exact' })
        .neq('employee_id', '')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const label = table === 'all' ? 'جميع البيانات' : table === 'employees' ? 'الموظفون' : 'العملاء'
    return NextResponse.json({ success: true, message: `تم حذف ${label} بنجاح` })

  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
