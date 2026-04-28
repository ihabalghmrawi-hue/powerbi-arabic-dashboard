'use client'

import { useState, useMemo } from 'react'

type Employee = {
  employee_id: string; employee_name: string; department: string
  region: string; hire_date: string; customer_count: number; rank: number
}
type Customer = {
  customer_id: string; customer_name: string; region: string
  registration_date: string; assigned_employee_id: string
}
type Region = { region: string; customer_count: number; percentage: number }

type Props = {
  employees: Employee[]; customers: Customer[]
  regions: Region[]; totalCustomers: number
}

function toAr(n: number | string) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
}

const DEPT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'المبيعات': { bg: '#D1FAE5', color: '#065F46', label: 'مبيعات' },
  'الدعم':    { bg: '#EEF2FF', color: '#3730A3', label: 'دعم' },
  'العمليات': { bg: '#FEF3C7', color: '#92400E', label: 'عمليات' },
}
const BAR_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']
const REGION_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981']

export default function Dashboard({ employees, customers, regions, totalCustomers }: Props) {
  const [tab, setTab] = useState<'perf' | 'region' | 'detail'>('perf')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [filterRegion, setFilterRegion] = useState('')
  const [filterDept, setFilterDept]     = useState('')

  const topEmp    = employees[0]
  const avgPerEmp = employees.length ? Math.round(totalCustomers / employees.length) : 0
  const topRegion = regions[0]
  const maxCount  = employees[0]?.customer_count ?? 1

  const filtered = useMemo(() =>
    employees.filter(e =>
      (!filterRegion || e.region === filterRegion) &&
      (!filterDept   || e.department === filterDept)
    ), [employees, filterRegion, filterDept])

  const empCustomers = useMemo(() =>
    selectedEmp ? customers.filter(c => c.assigned_employee_id === selectedEmp.employee_id) : []
  , [selectedEmp, customers])

  const tabs = [
    { id: 'perf',   label: 'أداء الموظفين',  icon: '📊' },
    { id: 'region', label: 'تحليل المناطق',  icon: '🗺' },
    { id: 'detail', label: 'تفاصيل الموظف',  icon: '👤' },
  ] as const

  return (
    <div className="page-body fade-in">

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: '#FFFFFF', padding: 6, borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 8, border: 'none',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all .2s',
            background: tab === t.id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
            color: tab === t.id ? '#fff' : '#64748B',
            boxShadow: tab === t.id ? '0 4px 12px rgba(99,102,241,.35)' : 'none',
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Employee Performance ── */}
      {tab === 'perf' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[
              { label: '🌍 المنطقة', opts: ['كل المناطق', 'الشمال', 'الجنوب', 'الشرق', 'الغرب'], val: filterRegion, set: (v: string) => setFilterRegion(v === 'كل المناطق' ? '' : v) },
              { label: '🏢 القسم',   opts: ['كل الأقسام', 'المبيعات', 'الدعم', 'العمليات'],      val: filterDept,   set: (v: string) => setFilterDept(v === 'كل الأقسام' ? '' : v) },
            ].map(f => (
              <div key={f.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: .6 }}>{f.label}</label>
                <select value={f.val || f.opts[0]} onChange={e => f.set(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', direction: 'rtl' }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {(filterRegion || filterDept) && (
              <button onClick={() => { setFilterRegion(''); setFilterDept('') }}
                className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
                ✕ إلغاء الفلتر
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KpiCard color="accent" icon="👥" label="إجمالي العملاء" value={toAr(totalCustomers)} badge={{ text: '▲ نشط', type: 'up' }} />
            <KpiCard color="green"  icon="🏆" label="أفضل موظف" value={topEmp?.employee_name ?? '—'} sub={`${toAr(topEmp?.customer_count ?? 0)} عميل · ${topEmp?.department ?? ''}`} sm />
            <KpiCard color="gold"   icon="📈" label="متوسط العملاء / موظف" value={toAr(avgPerEmp)} sub={`من ${toAr(employees.length)} موظفين`} />
            <KpiCard color="cyan"   icon="🗺" label="أفضل منطقة" value={topRegion?.region ?? '—'} sub={`${toAr(topRegion?.customer_count ?? 0)} عميل`} sm />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* Bar Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📊 العملاء حسب الموظف</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{toAr(filtered.length)} موظف</span>
              </div>
              {filtered.map((emp, i) => (
                <div key={emp.employee_id} className="bar-row">
                  <span className="bar-label">{emp.employee_name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{
                      width: `${(emp.customer_count / maxCount) * 100}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                    }} />
                  </div>
                  <span className="bar-val">{toAr(emp.customer_count)}</span>
                </div>
              ))}
            </div>

            {/* Ranking Table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🏅 ترتيب الموظفين</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>الموظف</th><th>القسم</th><th>العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 8).map((emp) => {
                    const dept = DEPT_COLORS[emp.department] ?? { bg: '#F1F5F9', color: '#64748B', label: emp.department }
                    return (
                      <tr key={emp.employee_id} onClick={() => { setSelectedEmp(emp); setTab('detail') }}>
                        <td>
                          <span className={`rank-badge ${emp.rank <= 3 ? `rank-${emp.rank}` : 'rank-n'}`}>
                            {toAr(emp.rank)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{emp.employee_name}</td>
                        <td>
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, fontWeight: 600, background: dept.bg, color: dept.color }}>
                            {dept.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{toAr(emp.customer_count)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 12, fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '8px', border: '1px dashed #E2E8F0', borderRadius: 8, background: '#F8FAFC' }}>
                انقر على صف لعرض تفاصيل الموظف ←
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: Regions ── */}
      {tab === 'region' && (
        <>
          <div className="kpi-grid">
            <KpiCard color="accent" icon="🥇" label="أفضل منطقة"      value={topRegion?.region ?? '—'}        sub={`${toAr(topRegion?.customer_count ?? 0)} عميل`} sm />
            <KpiCard color="gold"   icon="👥" label="إجمالي العملاء"  value={toAr(totalCustomers)}              sub={`في ${toAr(regions.length)} مناطق`} />
            <KpiCard color="green"  icon="📊" label="متوسط المناطق"  value={toAr(regions.length ? Math.round(totalCustomers / regions.length) : 0)} sub="متوسط لكل منطقة" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">🗺 العملاء حسب المنطقة</span>
              </div>

              {/* Column Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, marginBottom: 28, padding: '0 8px' }}>
                {regions.map((r, i) => (
                  <div key={r.region} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{toAr(r.customer_count)}</span>
                    <div style={{
                      width: '100%',
                      height: `${(r.customer_count / (regions[0]?.customer_count ?? 1)) * 100}%`,
                      background: REGION_COLORS[i] ?? '#6366F1',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height .8s cubic-bezier(.4,0,.2,1)',
                      position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.15)', borderRadius: 'inherit' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{r.region}</span>
                  </div>
                ))}
              </div>

              <table className="data-table">
                <thead><tr><th>الترتيب</th><th>المنطقة</th><th>العملاء</th><th>النسبة</th></tr></thead>
                <tbody>
                  {regions.map((r, i) => (
                    <tr key={r.region}>
                      <td><span className={`rank-badge ${i < 3 ? `rank-${i + 1}` : 'rank-n'}`}>{toAr(i + 1)}</span></td>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: REGION_COLORS[i], flexShrink: 0 }} />
                          {r.region}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{toAr(r.customer_count)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${r.percentage}%`, height: '100%', background: REGION_COLORS[i], borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 32 }}>{toAr(Math.round(r.percentage))}٪</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Region Legend Card */}
            <div className="card">
              <div className="card-header"><span className="card-title">📍 مقارنة المناطق</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {regions.map((r, i) => (
                  <div key={r.region}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.region}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: REGION_COLORS[i] }}>{toAr(r.customer_count)}</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${r.percentage}%`, height: '100%', background: `linear-gradient(90deg,${REGION_COLORS[i]},${REGION_COLORS[i]}88)`, borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{toAr(Math.round(r.percentage))}٪ من الإجمالي</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 3: Employee Detail ── */}
      {tab === 'detail' && (
        selectedEmp ? (
          <>
            {/* Employee Header Card */}
            <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,#0F172A,#1E1B4B)', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0,
                  border: '3px solid rgba(255,255,255,.2)',
                }}>
                  {selectedEmp.employee_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{selectedEmp.employee_name}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)' }}>{selectedEmp.employee_id}</span>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(99,102,241,.3)', color: '#A5B4FC' }}>{selectedEmp.department}</span>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)' }}>📍 {selectedEmp.region}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4 }}>إجمالي العملاء</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{toAr(selectedEmp.customer_count)}</div>
                  <div style={{ fontSize: 11, color: '#A5B4FC', marginTop: 4 }}>ترتيب #{toAr(selectedEmp.rank)}</div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
              <StatMini label="تاريخ التعيين" value={fmtDate(selectedEmp.hire_date)} icon="📅" />
              <StatMini label="المنطقة" value={selectedEmp.region} icon="🗺" />
              <StatMini label="القسم" value={selectedEmp.department} icon="🏢" />
            </div>

            {/* Customers table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">👥 العملاء التابعون ({toAr(empCustomers.length)})</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEmp(null)}>← رجوع</button>
              </div>
              <table className="data-table">
                <thead><tr><th>رقم العميل</th><th>اسم العميل</th><th>المنطقة</th><th>تاريخ التسجيل</th></tr></thead>
                <tbody>
                  {empCustomers.map(c => (
                    <tr key={c.customer_id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1', fontWeight: 600 }}>{c.customer_id}</td>
                      <td style={{ fontWeight: 500 }}>{c.customer_name}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>{c.region}</span>
                      </td>
                      <td style={{ color: '#64748B' }}>{fmtDate(c.registration_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>لم يتم اختيار موظف</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>انتقل إلى تبويب "أداء الموظفين" وانقر على موظف</div>
            <button className="btn btn-primary" onClick={() => setTab('perf')}>📊 عرض الموظفين</button>
          </div>
        )
      )}
    </div>
  )
}

function KpiCard({ color, icon, label, value, sub, badge, sm }: {
  color: string; icon: string; label: string; value: string
  sub?: string; badge?: { text: string; type: 'up' | 'down' | 'neu' }; sm?: boolean
}) {
  return (
    <div className={`kpi-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className={`kpi-value${sm ? ' sm' : ''}`}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sub}</div>}
          {badge && <div style={{ marginTop: 8 }}><span className={`kpi-badge ${badge.type}`}>{badge.text}</span></div>}
        </div>
        <div className={`kpi-icon ${color}`} style={{ fontSize: 20 }}>{icon}</div>
      </div>
    </div>
  )
}

function StatMini({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{value}</div>
        </div>
      </div>
    </div>
  )
}
