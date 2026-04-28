import { createServerClient } from '@/lib/supabase'
import TopBar from '@/components/TopBar'

function toAr(n: number | string) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
}

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981']

export default async function RegionsPage() {
  const supabase = createServerClient()
  const [{ data: regions }, { data: empByRegion }] = await Promise.all([
    supabase.from('regions_summary').select('*').order('customer_count', { ascending: false }),
    supabase.from('employees').select('region, employee_id').order('region'),
  ])

  const empCount: Record<string, number> = {}
  empByRegion?.forEach(e => { empCount[e.region] = (empCount[e.region] ?? 0) + 1 })

  const total = regions?.reduce((s, r) => s + r.customer_count, 0) ?? 0

  return (
    <>
      <TopBar title="تحليل المناطق" />
      <div className="page-body">
        <div className="page-title">🗺 تحليل المناطق</div>
        <div className="page-subtitle">توزيع العملاء والموظفين على المناطق الجغرافية</div>

        {/* KPI row */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
          {regions?.map((r, i) => (
            <div key={r.region} className="kpi-card" style={{ borderRight: `4px solid ${COLORS[i] ?? '#6366F1'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kpi-label">{r.region}</div>
                  <div className="kpi-value" style={{ fontSize: 24 }}>{toAr(r.customer_count)}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    {toAr(empCount[r.region] ?? 0)} موظف
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${COLORS[i]}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {['🥇', '🥈', '🥉', '📍'][i]}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>الحصة السوقية</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS[i] }}>{toAr(Math.round(r.percentage))}٪</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${r.percentage}%`, height: '100%', background: COLORS[i], borderRadius: 99 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
          {/* Visual breakdown */}
          <div className="card">
            <div className="card-header"><span className="card-title">📊 التوزيع البصري</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {regions?.map((r, i) => (
                <div key={r.region}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.region}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS[i] }}>{toAr(r.customer_count)}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 6 }}>عميل</span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${r.percentage}%`, height: '100%',
                      background: `linear-gradient(90deg,${COLORS[i]},${COLORS[i]}99)`,
                      borderRadius: 99, transition: 'width 1.2s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{toAr(empCount[r.region] ?? 0)} موظف</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{toAr(Math.round(r.percentage))}٪</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
              <span className="card-title">📋 جدول تفصيلي</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>المنطقة</th>
                  <th>العملاء</th>
                  <th>الموظفون</th>
                  <th>متوسط / موظف</th>
                  <th>النسبة</th>
                </tr>
              </thead>
              <tbody>
                {regions?.map((r, i) => {
                  const emps = empCount[r.region] ?? 0
                  const avg  = emps ? Math.round(r.customer_count / emps) : 0
                  return (
                    <tr key={r.region}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                          {r.region}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: COLORS[i] }}>{toAr(r.customer_count)}</td>
                      <td>{toAr(emps)}</td>
                      <td>{toAr(avg)}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${COLORS[i]}18`, color: COLORS[i] }}>
                          {toAr(Math.round(r.percentage))}٪
                        </span>
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                  <td>الإجمالي</td>
                  <td style={{ color: '#6366F1', fontWeight: 800 }}>{toAr(total)}</td>
                  <td>{toAr(Object.values(empCount).reduce((a, b) => a + b, 0))}</td>
                  <td>—</td>
                  <td>١٠٠٪</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
