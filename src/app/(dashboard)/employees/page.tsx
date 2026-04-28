import { createServerClient } from '@/lib/supabase'
import TopBar from '@/components/TopBar'
import Link from 'next/link'

function toAr(n: number | string) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
}

const DEPT: Record<string, { bg: string; color: string }> = {
  'المبيعات': { bg: '#D1FAE5', color: '#065F46' },
  'الدعم':    { bg: '#EEF2FF', color: '#3730A3' },
  'العمليات': { bg: '#FEF3C7', color: '#92400E' },
}

export default async function EmployeesPage() {
  const supabase = createServerClient()
  const { data: employees } = await supabase
    .from('employee_stats')
    .select('*')
    .order('rank')

  const total = employees?.reduce((s, e) => s + (e.customer_count ?? 0), 0) ?? 0

  return (
    <>
      <TopBar title="الموظفون" />
      <div className="page-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="page-title">👥 قائمة الموظفين</div>
            <div className="page-subtitle">جميع الموظفين مع إحصائيات أداء العملاء</div>
          </div>
          <Link href="/upload" className="btn btn-primary">⬆ رفع موظفين جدد</Link>
        </div>

        {/* Summary cards */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
          <div className="kpi-card accent">
            <div className="kpi-label">إجمالي الموظفين</div>
            <div className="kpi-value">{toAr(employees?.length ?? 0)}</div>
          </div>
          <div className="kpi-card gold">
            <div className="kpi-label">إجمالي العملاء</div>
            <div className="kpi-value">{toAr(total)}</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">متوسط العملاء / موظف</div>
            <div className="kpi-value">{toAr(employees?.length ? Math.round(total / employees.length) : 0)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="card-title">📋 بيانات الموظفين</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{toAr(employees?.length ?? 0)} موظف</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الترتيب</th>
                  <th>الرقم</th>
                  <th>الاسم</th>
                  <th>القسم</th>
                  <th>المنطقة</th>
                  <th>تاريخ التعيين</th>
                  <th>العملاء</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map(emp => {
                  const dept = DEPT[emp.department] ?? { bg: '#F1F5F9', color: '#64748B' }
                  return (
                    <tr key={emp.employee_id}>
                      <td>
                        <span className={`rank-badge ${emp.rank <= 3 ? `rank-${emp.rank}` : 'rank-n'}`}>
                          {toAr(emp.rank)}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1', fontWeight: 700 }}>{emp.employee_id}</td>
                      <td style={{ fontWeight: 600 }}>{emp.employee_name}</td>
                      <td>
                        <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: dept.bg, color: dept.color }}>
                          {emp.department}
                        </span>
                      </td>
                      <td>{emp.region}</td>
                      <td style={{ color: '#64748B' }}>{fmtDate(emp.hire_date)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 60, height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                              width: `${(emp.customer_count / (employees[0]?.customer_count ?? 1)) * 100}%`,
                              height: '100%', background: '#6366F1', borderRadius: 99
                            }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{toAr(emp.customer_count)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
