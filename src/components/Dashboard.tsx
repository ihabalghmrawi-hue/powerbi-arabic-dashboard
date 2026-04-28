'use client'

import { useState } from 'react'

type Employee = {
  employee_id: string
  employee_name: string
  department: string
  region: string
  hire_date: string
  customer_count: number
  rank: number
}

type Customer = {
  customer_id: string
  customer_name: string
  region: string
  registration_date: string
  assigned_employee_id: string
}

type Region = {
  region: string
  customer_count: number
  percentage: number
}

type Props = {
  employees: Employee[]
  customers: Customer[]
  regions: Region[]
  totalCustomers: number
}

function toAr(n: number) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const DEPT_CLASS: Record<string, string> = {
  'المبيعات': 'd-sales',
  'الدعم': 'd-support',
  'العمليات': 'd-ops',
}

const RANK_CLASS = ['', 'r1', 'r2', 'r3']

export default function Dashboard({ employees, customers, regions, totalCustomers }: Props) {
  const [tab, setTab] = useState<'perf' | 'region' | 'detail'>('perf')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [filterRegion, setFilterRegion] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const topEmployee = employees[0]
  const avgPerEmployee = employees.length
    ? Math.round(totalCustomers / employees.length)
    : 0
  const topRegion = regions[0]

  const filteredEmployees = employees.filter((e) => {
    if (filterRegion && e.region !== filterRegion) return false
    if (filterDept && e.department !== filterDept) return false
    return true
  })

  const maxCount = filteredEmployees[0]?.customer_count ?? 1

  const empCustomers = selectedEmployee
    ? customers.filter((c) => c.assigned_employee_id === selectedEmployee.employee_id)
    : []

  function goDetail(emp: Employee) {
    setSelectedEmployee(emp)
    setTab('detail')
  }

  return (
    <div>
      {/* Top bar */}
      <div style={{
        background: '#1B2A4A', color: '#fff', padding: '0 24px',
        height: 56, display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{
          background: '#F2C811', color: '#1B2A4A', width: 32, height: 32,
          borderRadius: 6, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0
        }}>BI</div>
        <h1 style={{ fontSize: 15, fontWeight: 500 }}>تحليلات الموظفين والعملاء</h1>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 4 }}>
          {(['perf', 'region', 'detail'] as const).map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? '#F2C811' : 'rgba(255,255,255,0.1)',
              border: 'none', color: tab === t ? '#1B2A4A' : 'rgba(255,255,255,0.75)',
              padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: tab === t ? 600 : 400
            }}>
              {['أداء الموظفين', 'تحليل المناطق', 'تفاصيل الموظف'][i]}
            </button>
          ))}
        </div>
      </div>

      {/* Page 1: Employee Performance */}
      {tab === 'perf' && (
        <div style={{ padding: 20 }}>
          {/* Slicers */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              {
                label: 'المنطقة',
                options: ['كل المناطق', 'الشمال', 'الجنوب', 'الشرق', 'الغرب'],
                value: filterRegion,
                onChange: (v: string) => setFilterRegion(v === 'كل المناطق' ? '' : v),
              },
              {
                label: 'القسم',
                options: ['كل الأقسام', 'المبيعات', 'الدعم', 'العمليات'],
                value: filterDept,
                onChange: (v: string) => setFilterDept(v === 'كل الأقسام' ? '' : v),
              },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
                padding: '8px 14px', flex: 1
              }}>
                <label style={{ display: 'block', fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>
                  {s.label}
                </label>
                <select
                  value={s.value || s.options[0]}
                  onChange={(e) => s.onChange(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#1B2A4A', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', width: '100%', direction: 'rtl' }}
                >
                  {s.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard color="#F2C811" label="إجمالي العملاء" value={toAr(totalCustomers)} sub="إجمالي العملاء المسجلين" />
            <KpiCard color="#1D9E75" label="أفضل موظف" value={topEmployee?.employee_name ?? '—'} sub={`${toAr(topEmployee?.customer_count ?? 0)} عميل · ${topEmployee?.department ?? ''}`} large />
            <KpiCard color="#378ADD" label="متوسط العملاء لكل موظف" value={toAr(avgPerEmployee)} sub={`من ${toAr(employees.length)} موظفين`} />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
            {/* Bar chart */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                العملاء حسب الموظف
              </div>
              {filteredEmployees.map((emp) => (
                <div key={emp.employee_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <span style={{ fontSize: 12, color: '#64748B', width: 110, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.employee_name}
                  </span>
                  <div style={{ flex: 1, height: 18, background: '#F0F2F5', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(emp.customer_count / maxCount) * 100}%`,
                      height: '100%', borderRadius: 4,
                      background: emp.rank === 1 ? '#F2C811' : emp.rank <= 4 ? '#378ADD' : '#1D9E75',
                      transition: 'width .6s'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1B2A4A', width: 30, textAlign: 'left' }}>
                    {toAr(emp.customer_count)}
                  </span>
                </div>
              ))}
            </div>

            {/* Ranking table */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                ترتيب الموظفين
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['الترتيب', 'الموظف', 'القسم', 'العدد'].map((h) => (
                      <th key={h} style={{ background: '#1B2A4A', color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 500, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.slice(0, 8).map((emp) => (
                    <tr key={emp.employee_id}
                      onClick={() => goDetail(emp)}
                      style={{ borderBottom: '1px solid #F0F2F5', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-flex', width: 22, height: 22, borderRadius: '50%',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          background: emp.rank === 1 ? '#F2C811' : emp.rank === 2 ? '#C0C0C0' : emp.rank === 3 ? '#CD7F32' : '#F0F2F5',
                          color: emp.rank <= 2 ? '#1B2A4A' : emp.rank === 3 ? '#fff' : '#64748B'
                        }}>
                          {toAr(emp.rank)}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{emp.employee_name}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                          background: emp.department === 'المبيعات' ? '#E1F5EE' : emp.department === 'الدعم' ? '#E6F1FB' : '#FAEEDA',
                          color: emp.department === 'المبيعات' ? '#0F6E56' : emp.department === 'الدعم' ? '#185FA5' : '#854F0B',
                        }}>
                          {emp.department}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{toAr(emp.customer_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: 8, border: '1px dashed #E2E8F0', borderRadius: 6, marginTop: 10, background: '#F8FAFC' }}>
                انقر على أي صف للانتقال إلى تفاصيل الموظف ←
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page 2: Region Analysis */}
      {tab === 'region' && (
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard color="#F2C811" label="أفضل منطقة" value={topRegion?.region ?? '—'} sub={`${toAr(topRegion?.customer_count ?? 0)} عميل`} large />
            <KpiCard color="#378ADD" label="إجمالي العملاء" value={toAr(totalCustomers)} sub={`في ${toAr(regions.length)} مناطق`} />
            <KpiCard color="#1D9E75" label="متوسط المناطق" value={toAr(regions.length ? Math.round(totalCustomers / regions.length) : 0)} sub="متوسط لكل منطقة" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                العملاء حسب المنطقة
              </div>
              {/* Column chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130, padding: '0 8px' }}>
                {regions.map((r, i) => {
                  const maxR = regions[0]?.customer_count ?? 1
                  const colors = ['#F2C811', '#378ADD', '#378ADD', '#1D9E75']
                  return (
                    <div key={r.region} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#1B2A4A' }}>{toAr(r.customer_count)}</span>
                      <div style={{ width: '100%', height: `${(r.customer_count / maxR) * 100}%`, background: colors[i] ?? '#378ADD', borderRadius: '4px 4px 0 0' }} />
                      <span style={{ fontSize: 10, color: '#64748B' }}>{r.region}</span>
                    </div>
                  )
                })}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 16 }}>
                <thead>
                  <tr>
                    {['الترتيب', 'المنطقة', 'العملاء', 'النسبة'].map((h) => (
                      <th key={h} style={{ background: '#1B2A4A', color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 500, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r, i) => (
                    <tr key={r.region} style={{ borderBottom: '1px solid #F0F2F5' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          display: 'inline-flex', width: 22, height: 22, borderRadius: '50%',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          background: i === 0 ? '#F2C811' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F0F2F5',
                          color: i < 2 ? '#1B2A4A' : i === 2 ? '#fff' : '#64748B'
                        }}>
                          {toAr(i + 1)}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{r.region}</td>
                      <td style={{ padding: '8px 10px' }}>{toAr(r.customer_count)}</td>
                      <td style={{ padding: '8px 10px' }}>{toAr(Math.round(r.percentage))}٪</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                توزيع المناطق
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {regions.map((r, i) => {
                  const colors = ['#F2C811', '#378ADD', '#378ADD', '#1D9E75']
                  const sizes = [12, 10, 9, 7]
                  return (
                    <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, flexDirection: 'row-reverse' }}>
                      <div style={{ width: sizes[i] ?? 7, height: sizes[i] ?? 7, borderRadius: '50%', background: colors[i] ?? '#378ADD', flexShrink: 0 }} />
                      {r.region} — {toAr(r.customer_count)} عميل ({toAr(Math.round(r.percentage))}٪)
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page 3: Employee Detail */}
      {tab === 'detail' && (
        <div style={{ padding: 20 }}>
          {selectedEmployee ? (
            <>
              <div style={{
                background: '#fff', borderRadius: 10, padding: '16px 20px',
                border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#1B2A4A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F2C811', fontWeight: 700, fontSize: 15, flexShrink: 0
                }}>
                  {selectedEmployee.employee_name.slice(0, 2)}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 600 }}>{selectedEmployee.employee_name}</h2>
                  <p style={{ fontSize: 12, color: '#64748B' }}>قسم {selectedEmployee.department} · {selectedEmployee.employee_id}</p>
                </div>
                <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px' }}>إجمالي العملاء</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1B2A4A' }}>{toAr(selectedEmployee.customer_count)}</div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  قائمة العملاء التابعين
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['رقم العميل', 'اسم العميل', 'المنطقة', 'تاريخ التسجيل'].map((h) => (
                        <th key={h} style={{ background: '#1B2A4A', color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 500, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {empCustomers.map((c) => (
                      <tr key={c.customer_id} style={{ borderBottom: '1px solid #F0F2F5' }}>
                        <td style={{ padding: '8px 10px' }}>{c.customer_id}</td>
                        <td style={{ padding: '8px 10px' }}>{c.customer_name}</td>
                        <td style={{ padding: '8px 10px' }}>{c.region}</td>
                        <td style={{ padding: '8px 10px' }}>{formatDate(c.registration_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 14 }}>
              انقر على موظف في صفحة &quot;أداء الموظفين&quot; لعرض تفاصيله
            </div>
          )}
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: 16, fontSize: 11, color: '#94A3B8', borderTop: '1px solid #E2E8F0', marginTop: 20 }}>
        تم إنشاؤه بمساعدة Claude · Anthropic | مشروع تحليلات الموظفين والعملاء
      </footer>
    </div>
  )
}

function KpiCard({ color, label, value, sub, large }: { color: string; label: string; value: string; sub: string; large?: boolean }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '16px 18px',
      border: '1px solid #E2E8F0', borderRight: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: large ? 17 : 26, fontWeight: 600, color: '#1B2A4A', paddingTop: large ? 4 : 0 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sub}</div>
    </div>
  )
}
