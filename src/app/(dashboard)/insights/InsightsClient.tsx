'use client'

import TopBar from '@/components/TopBar'
import { useEffect, useState } from 'react'
import type { AiInsight, ScoredCustomer } from '@/lib/aiScoring'

type InsightsData = {
  insights: AiInsight[]
  scoredCustomers: ScoredCustomer[]
  distribution: { high: number; medium: number; low: number }
  totalCustomers: number
}

const INSIGHT_STYLE: Record<AiInsight['type'], { border: string; bg: string; badge: string; badgeFg: string; dot: string }> = {
  success: { border: '#6EE7B7', bg: '#F0FDF4', badge: '#D1FAE5', badgeFg: '#065F46', dot: '#10B981' },
  info:    { border: '#A5B4FC', bg: '#EEF2FF', badge: '#E0E7FF', badgeFg: '#3730A3', dot: '#6366F1' },
  warning: { border: '#FCD34D', bg: '#FFFBEB', badge: '#FEF3C7', badgeFg: '#92400E', dot: '#F59E0B' },
  danger:  { border: '#FCA5A5', bg: '#FFF1F2', badge: '#FEE2E2', badgeFg: '#991B1B', dot: '#EF4444' },
}

const LABEL_META = {
  high:   { label: 'عالي',   bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  medium: { label: 'متوسط', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  low:    { label: 'منخفض', bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
}

function toAr(n: number | string) { return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]) }
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export default function InsightsClient({ companyName, userEmail }: { companyName?: string; userEmail?: string }) {
  const [data, setData]       = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState<'insights' | 'customers'>('insights')
  const [filter, setFilter]   = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetch('/api/insights')
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`)
        return json
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filteredCustomers = data?.scoredCustomers.filter(c =>
    filter === 'all' || c.ai_label === filter
  ) ?? []

  /* ── Loading ── */
  if (loading) return (
    <>
      <TopBar title="الذكاء الاصطناعي" companyName={companyName} userEmail={userEmail} />
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      </div>
    </>
  )

  /* ── Error ── */
  if (error) return (
    <>
      <TopBar title="الذكاء الاصطناعي" companyName={companyName} userEmail={userEmail} />
      <div className="page-body">
        <div style={{
          background: '#FFF1F2', border: '1px solid #FCA5A5',
          borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 560, margin: '40px auto',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#991B1B', marginBottom: 10 }}>
            تعذّر تحميل بيانات الذكاء الاصطناعي
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 12, background: '#FEE2E2',
            padding: '10px 16px', borderRadius: 8, color: '#7F1D1D',
            marginBottom: 20, wordBreak: 'break-all', textAlign: 'left',
          }}>{error}</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.8 }}>
            <strong>الحلول المحتملة:</strong><br />
            ١. تأكد أن متغيرات البيئة مضبوطة في Vercel<br />
            ② تأكد من تشغيل <code>supabase_schema.sql</code> في Supabase<br />
            ③ تأكد أن الجداول تحتوي على بيانات
          </div>
          <button onClick={() => { setLoading(true); setError(''); window.location.reload() }}
            className="btn btn-primary">🔄 إعادة المحاولة</button>
        </div>
      </div>
    </>
  )

  if (!data) return null

  const { insights, distribution, totalCustomers } = data
  const pct = (n: number) => totalCustomers ? Math.round((n / totalCustomers) * 100) : 0

  return (
    <>
      <TopBar title="الذكاء الاصطناعي" companyName={companyName} userEmail={userEmail} />
      <div className="page-body fade-in">

        <div style={{ marginBottom: 24 }}>
          <div className="page-title">🤖 مركز الذكاء الاصطناعي</div>
          <div className="page-subtitle">رؤى وتوصيات مولّدة تلقائياً من بيانات العملاء والموظفين</div>
        </div>

        {/* Distribution KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {(['high','medium','low'] as const).map(level => {
            const m = LABEL_META[level]
            const count = distribution[level]
            return (
              <div key={level} className="kpi-card" style={{ borderRight: `4px solid ${m.dot}`, cursor: 'pointer' }}
                onClick={() => { setTab('customers'); setFilter(level) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">احتمالية التفاعل — {m.label}</div>
                    <div className="kpi-value" style={{ fontSize: 28, color: m.dot }}>{toAr(count)}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{toAr(pct(count))}٪ من الإجمالي</div>
                  </div>
                  <span style={{ fontSize: 26 }}>{level === 'high' ? '💎' : level === 'medium' ? '⭐' : '⚠️'}</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: `${pct(count)}%`, background: m.dot }} />
                </div>
                <div style={{ fontSize: 10, color: m.dot, fontWeight: 600, marginTop: 8 }}>انقر لعرض العملاء ←</div>
              </div>
            )
          })}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#fff', padding: 5, borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
          {([['insights','💡 التوصيات الذكية'],['customers','📋 تقييم العملاء']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              background: tab === id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
              color: tab === id ? '#fff' : '#64748B',
              boxShadow: tab === id ? '0 4px 12px rgba(99,102,241,.3)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* ── INSIGHTS TAB ── */}
        {tab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {insights.map((ins, i) => {
              const s = INSIGHT_STYLE[ins.type]
              return (
                <div key={ins.id} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 14, padding: '18px 20px',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  animation: `fadeIn .35s ease ${i * 0.07}s both`,
                  boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                    boxShadow: `0 4px 12px ${s.border}80`,
                  }}>{ins.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{ins.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.badge, color: s.badgeFg, flexShrink: 0 }}>
                        {ins.type === 'success' ? '✅ إيجابي' : ins.type === 'warning' ? '⚠️ تحذير' : ins.type === 'danger' ? '🔴 عاجل' : 'ℹ️ معلومة'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.75 }}>{ins.body}</div>
                  </div>
                  {ins.metric && (
                    <div style={{ flexShrink: 0, textAlign: 'center', background: '#fff', borderRadius: 10, padding: '10px 16px', border: `1px solid ${s.border}`, minWidth: 80 }}>
                      <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>المقياس</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.dot }}>{ins.metric}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── CUSTOMERS SCORE TAB ── */}
        {tab === 'customers' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['all','high','medium','low'] as const).map(f => {
                const m = f === 'all' ? null : LABEL_META[f]
                const count = f === 'all' ? data.scoredCustomers.length : distribution[f]
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 16px', borderRadius: 99, border: '2px solid',
                    borderColor: filter === f ? (m?.dot ?? '#6366F1') : '#E2E8F0',
                    background: filter === f ? (m?.bg ?? '#EEF2FF') : '#fff',
                    color: filter === f ? (m?.color ?? '#3730A3') : '#64748B',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {f === 'all' ? 'الكل' : m!.label} ({toAr(count)})
                  </button>
                )
              })}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 560, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>العميل</th>
                      <th>المنطقة</th>
                      <th>الموظف</th>
                      <th>تاريخ التسجيل</th>
                      <th>حداثة /١٠</th>
                      <th>أداء الموظف /١٠</th>
                      <th>نمو المنطقة /١٠</th>
                      <th>الدرجة</th>
                      <th>التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => {
                      const m = LABEL_META[c.ai_label]
                      return (
                        <tr key={c.customer_id}>
                          <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                          <td>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>
                              {c.region}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: '#64748B' }}>{c.employee_name}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{fmtDate(c.registration_date)}</td>
                          <td><ScorePip value={c.recency_score} /></td>
                          <td><ScorePip value={c.employee_score} /></td>
                          <td><ScorePip value={c.growth_score} /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 44, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${(c.total_score / 10) * 100}%`, height: '100%', background: m.dot, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: m.dot }}>{c.total_score}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />
                              {m.label}
                            </span>
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
      </div>
    </>
  )
}

function ScorePip({ value }: { value: number }) {
  const color = value >= 7 ? '#10B981' : value >= 4 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 12, borderRadius: 2, background: i < Math.round(value / 2) ? color : '#F1F5F9', transition: 'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 20 }}>{value}</span>
    </div>
  )
}
