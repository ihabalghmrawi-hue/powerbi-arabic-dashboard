import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('employees')
    .select(`
      employee_id,
      employee_name,
      department,
      email,
      hire_date,
      region,
      customers(count)
    `)
    .order('employee_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
