import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employee_id')
  const region = searchParams.get('region')

  const supabase = createServerClient()
  let query = supabase
    .from('customers')
    .select(`
      customer_id,
      customer_name,
      region,
      registration_date,
      assigned_employee_id,
      employees(employee_name, department)
    `)
    .order('registration_date')

  if (employeeId) query = query.eq('assigned_employee_id', employeeId)
  if (region) query = query.eq('region', region)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
