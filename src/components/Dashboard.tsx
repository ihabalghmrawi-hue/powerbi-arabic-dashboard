'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Recharts charts (client-only)
const EmployeeBarChart = dynamic(() => import('./charts/EmployeeBarChart'), { ssr: false, loading: () => <ChartSkeleton /> })
const GrowthLineChart  = dynamic(() => import('./charts/GrowthLineChart'),  { ssr: false, loading: () => <ChartSkeleton /> })
const RegionPieChart   = dynamic(() => import('./charts/RegionPieChart'),   { ssr: false, loading: () => <ChartSkeleton /> })

type Employee = {
  employee_id: string; employee_name: string; department: string
  region: string; hire_date: string; customer_count: number; rank: number
}
type Customer = {
  customer_id: string; customer_name: string; region: string
  registration_date: string; assigned_employee_id: string
}
type Region = { region: string; customer_count: number; percentage: number }
type GrowthPoint = { month: string; label: string; new_customers: number; total_customers: number }

type Props = {
  employees: Employee[]; customers: Customer[]
  regions: Region[]; totalCustomers: number
}

function toAr(n: number | string) { return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) }

const DEPT_STYLE: Record<string, { bg: string; color: string }> = {
  'المبيعات': { bg: '#D1FAE5', color: '#065F46' },
  'الدعم':    { bg: '#EEF2FF', color: '#3730A3' },
  'العمليات': { bg: '#FEF3C7', color: '#92400E' },
}
const REGION_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981']

export default function Dashboard({ employees, customers, regions, totalCustomers }: Props) {
  const [tab, setTab]               = useState<'overview' | 'employees' | 'regions' | 'customers'>('overview')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [filterRegion, setFilterRegion] = useState('')
  const [filterDept, setFilterDept]     = useState('')
  const [filterEmp, setFilterEmp]       = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [growthData, setGrowthData]     = useState<GrowthPoint[]>([])
  const [regionData, setRegionData]     = useState<{ name: string; value: number }[]>([])

  // Fetch growth data once
  useEffect(() => {
    fetch('/api/growth')
      .then(r => r.json())
      .then(d => { setGrowthData(d.growth ?? []); setRegionData(d.regionData ?? []) })
  }, [])

  const topEmp    = employees[0]
  const topRegion = regions[0]
  const avgPerEmp = employees.length ? Math.round(totalCustomers / employees.length) : 0

  // Filtered customers
  const filteredCustomers = useMemo(() => customers.filter(c => {
    if (filterRegion && c.region !== filterRegion)                     return false
    if (filterEmp    && c.assigned_employee_id !== filterEmp)          return false
    if (dateFrom     && c.registration_date < dateFrom)               return false
    if (dateTo       && c.registration_date > dateTo)                 return false
    return true
  }), [customers, filterRegion, filterEmp, dateFrom, dateTo])

  // Filtered employees for bar chart
  const filteredEmployees = useMemo(() => employees.filter(e =>
    (!filterRegion || e.region === filterRegion) &&
    (!filterDept   || e.department === filterDept)
  ), [employees, filterRegion, filterDept])

  const tabs = [
    { id: 'overview',   label: 'نظرة عامة',    icon: '◈' },
    { id: 'employees',  label: 'الموظفون',      icon: '👥' },
    { id: 'regions',    label: 'المناطق',       icon: '🗺' },
    { id: 'customers',  label: 'العملاء',       icon: '🏢' },
  ] as const

  const activeFilters = [filterRegion, filterDept, filterEmp, dateFrom, dateTo].filter(Boolean).length

  return (
    <div className="page-body fade-in">

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 5, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .2s',
              background: tab === t.id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748B',
              boxShadow: tab === t.id ? '0 4px 12px rgba(99,102,241,.3)' : 'none',
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {activeFilters > 0 && (
          <button onClick={() => { setFilterRegion(''); setFilterDept(''); setFilterEmp(''); setDateFrom(''); setDateTo('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEE2E2', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✕ إلغاء الفلاتر ({activeFilters})
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <FilterSelect label="🌍 المنطقة" value={filterRegion}
          options={[{ v: '', l: 'كل المناطق' }, ...regions.map(r => ({ v: r.region, l: r.region }))]}
          onChange={setFilterRegion} />
        <FilterSelect label="🏢 القسم" value={filterDept}
          options={[{ v: '', l: 'كل الأقسام' }, { v: 'المبيعات', l: 'المبيعات' }, { v: 'الدعم', l: 'الدعم' }, { v: 'العمليات', l: 'العمليات' }]}
          onChange={setFilterDept} />
        <FilterSelect label="👤 الموظف" value={filterEmp}
          options={[{ v: '', l: 'كل الموظفين' }, ...employees.map(e => ({ v: e.employee_id, l: e.employee_name }))]}
          onChange={setFilterEmp} />
        <DateInput label="📅 من" value={dateFrom} onChange={setDateFrom} />
        <DateInput label="📅 إلى" value={dateTo}   onChange={setDateTo} />
      </div>

      {/* ══════════════ TAB: OVERVIEW ══════════════ */}
      {tab === 'overview' && (
        <>
          {/* KPI Row */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <KpiCard color="accent" icon="👥" label="إجمالي العملاء"       value={toAr(totalCustomers)}        badge="▲ نشط" badgeType="up" />
            <KpiCard color="green"  icon="🏆" label="أفضل موظف"            value={topEmp?.employee_name ?? '—'} sub={`${toAr(topEmp?.customer_count ?? 0)} عميل`} sm />
            <KpiCard color="gold"   icon="📊" label="متوسط / موظف"         value={toAr(avgPerEmp)}             sub={`من ${toAr(employees.length)} موظفين`} />
            <KpiCard color="cyan"   icon="🗺" label="أفضل منطقة"           value={topRegion?.region ?? '—'}    sub={`${toAr(topRegion?.customer_count ?? 0)} عميل`} sm />
          </div>

          {/* Charts row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
            <ChartCard title="📊 العملاء حسب الموظف" subtitle="مرتّب تنازلياً حسب الأداء">
              <EmployeeBarChart data={filteredEmployees} />
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {[['#6366F1','المبيعات'],['#8B5CF6','الدعم'],['#06B6D4','العمليات']].map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
                  </span>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="🥧 العملاء حسب المنطقة" subtitle="نسبة كل منطقة من الإجمالي">
              <RegionPieChart data={regionData} />
            </ChartCard>
          </div>

          {/* Charts row 2 - full width growth */}
          <ChartCard title="📈 نمو قاعدة العملاء عبر الزمن" subtitle="الخط النيلي = الإجمالي التراكمي · الخط البرتقالي المتقطع = الجدد شهرياً">
            <GrowthLineChart data={growthData} />
          </ChartCard>
        </>
      )}

      {/* ══════════════ TAB: EMPLOYEES ══════════════ */}
      {tab === 'employees' && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
            <KpiCard color="accent" icon="👥" label="الموظفون" value={toAr(filteredEmployees.length)} />
            <KpiCard color="gold"   icon="📊" label="إجمالي العملاء" value={toAr(totalCustomers)} />
            <KpiCard color="green"  icon="📈" label="متوسط / موظف"   value={toAr(avgPerEmp)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
            <ChartCard title="📊 مخطط الأداء" subtitle="عدد العملاء لكل موظف">
              <EmployeeBarChart data={filteredEmployees} />
            </ChartCard>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                <span className="card-title">📋 جدول الموظفين</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{toAr(filteredEmployees.length)} موظف</span>
              </div>
              <table className="data-table">
                <thead><tr><th>#</th><th>الاسم</th><th>القسم</th><th>المنطقة</th><th>العملاء</th></tr></thead>
                <tbody>
                  {filteredEmployees.map(e => {
                    const dept = DEPT_STYLE[e.department] ?? { bg: '#F1F5F9', color: '#64748B' }
                    return (
                      <tr key={e.employee_id} onClick={() => { setSelectedEmp(e); setTab('customers') }}>
                        <td><span className={`rank-badge rank-${e.rank <= 3 ? e.rank : 'n'}`}>{toAr(e.rank)}</span></td>
                        <td style={{ fontWeight: 600 }}>{e.employee_name}</td>
                        <td><span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: dept.bg, color: dept.color }}>{e.department}</span></td>
                        <td style={{ color: '#64748B' }}>{e.region}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 50, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ width: `${(e.customer_count / (employees[0]?.customer_count ?? 1)) * 100}%`, height: '100%', background: '#6366F1', borderRadius: 99 }} />
                            </div>
                            <span style={{ fontWeight: 700 }}>{toAr(e.customer_count)}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ TAB: REGIONS ══════════════ */}
      {tab === 'regions' && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
            {regions.map((r, i) => (
              <div key={r.region} className="kpi-card" style={{ borderRight: `4px solid ${REGION_COLORS[i] ?? '#6366F1'}` }}>
                <div className="kpi-label">{r.region}</div>
                <div className="kpi-value" style={{ fontSize: 24 }}>{toAr(r.customer_count)}</div>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{ width: `${r.percentage}%`, background: REGION_COLORS[i] }} />
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{toAr(Math.round(r.percentage))}٪ من الإجمالي</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ChartCard title="🥧 توزيع المناطق" subtitle="نسبة عملاء كل منطقة">
              <RegionPieChart data={regionData} />
            </ChartCard>
            <ChartCard title="📈 النمو التراكمي" subtitle="إجمالي العملاء عبر الزمن">
              <GrowthLineChart data={growthData} />
            </ChartCard>
          </div>
        </>
      )}

      {/* ══════════════ TAB: CUSTOMERS ══════════════ */}
      {tab === 'customers' && (
        <>
          {selectedEmp && (
            <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E1B4B)', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {selectedEmp.employee_name.charAt(0)}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700 }}>{selectedEmp.employee_name}</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{selectedEmp.department} · {selectedEmp.region}</div>
              </div>
              <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>العملاء</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>{toAr(selectedEmp.customer_count)}</div>
              </div>
              <button onClick={() => setSelectedEmp(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: 'rgba(255,255,255,.6)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>✕ إلغاء</button>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">🏢 قائمة العملاء</span>
              <span style={{ fontSize: 12, color: '#94A3B8', background: '#F1F5F9', padding: '3px 10px', borderRadius: 99 }}>
                {toAr(filteredCustomers.length)} عميل
              </span>
            </div>
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr><th>رقم العميل</th><th>الاسم</th><th>المنطقة</th><th>الموظف المسؤول</th><th>تاريخ التسجيل</th></tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => {
                    const emp = employees.find(e => e.employee_id === c.assigned_employee_id)
                    return (
                      <tr key={c.customer_id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1', fontWeight: 600 }}>{c.customer_id}</td>
                        <td style={{ fontWeight: 500 }}>{c.customer_name}</td>
                        <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>{c.region}</span></td>
                        <td style={{ color: '#64748B', fontSize: 12 }}>{emp?.employee_name ?? c.assigned_employee_id}</td>
                        <td style={{ color: '#94A3B8', fontSize: 12 }}>{fmtDate(c.registration_date)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function KpiCard({ color, icon, label, value, sub, badge, badgeType, sm }: {
  color: string; icon: string; label: string; value: string
  sub?: string; badge?: string; badgeType?: 'up' | 'down' | 'neu'; sm?: boolean
}) {
  return (
    <div className={`kpi-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="kpi-label">{label}</div>
          <div className={`kpi-value${sm ? ' sm' : ''}`}>{value}</div>
          {sub   && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sub}</div>}
          {badge && <div style={{ marginTop: 8 }}><span className={`kpi-badge ${badgeType ?? 'neu'}`}>{badge}</span></div>}
        </div>
        <div className={`kpi-icon ${color}`}>{icon}</div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string
  options: { v: string; l: string }[]; onChange: (v: string) => void
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 13px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 148 }}>
      <label style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', direction: 'rtl' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 13px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <label style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .7 }}>{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#0F172A', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }} />
    </div>
  )
}

function ChartSkeleton() {
  return <div className="skeleton" style={{ height: 260, borderRadius: 8 }} />
}
