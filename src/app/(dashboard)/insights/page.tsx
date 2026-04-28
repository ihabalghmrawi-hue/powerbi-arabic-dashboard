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
  high:   { label: 'عالي',    bg: '#D1FAE5', color: '#065F46', dot: '#10B981', bar: '#10B981' },
  medium: { label: 'متوسط',  bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', bar: '#F59E0B' },
  low:    { label: 'منخفض',  bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', bar: '#EF4444' },
}

function toAr(n: number | string) { return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function InsightsPage() {
  const [data, setData]       = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'insights' | 'customers'>('insights')
  const [filter, setFilter]   = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const filteredCustomers = data?.scoredCustomers.filter(c =>
    filter === 'all' || c.ai_label === filter
  ) ?? []

  if (loading) return (
    <>
      <TopBar title="الذكاء الاصطناعي" />
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      </div>
    </>
  )

  if (!data) return null

  const { insights, distribution, totalCustomers } = data
  const pct = (n: number) => totalCustomers ? Math.round((n / totalCustomers) * 100) : 0

  return (
    <>
      <TopBar title="الذكاء الاصطناعي" />
      <div className="page-body fade-in">
        <div style={{ marginBottom: 28 }}>
          <div className="page-title">🤖 مركز الذكاء الاصطناعي</div>
          <div className="page-subtitle">رؤى وتوصيات مولّدة تلقائياً من بيانات قاعدة العملاء</div>
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
                  <span style={{ fontSize: 24 }}>{level === 'high' ? '💎' : level === 'medium' ? '⭐' : '⚠️'}</span>
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
              padding: '8px 18px', borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
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
                <div key={ins.id} className="fade-in" style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 14, padding: '18px 20px',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  animation: `fadeIn .4s ease ${i * .08}s both`,
                  boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                }}>
                  {/* Icon bubble */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                    boxShadow: `0 4px 12px ${s.border}60`,
                  }}>{ins.icon}</div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{ins.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.badge, color: s.badgeFg, flexShrink: 0 }}>
                        {ins.type === 'success' ? 'إيجابي' : ins.type === 'warning' ? 'تحذير' : ins.type === 'danger' ? 'عاجل' : 'معلومة'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{ins.body}</div>
                  </div>

                  {/* Metric */}
                  {ins.metric && (
                    <div style={{ flexShrink: 0, textAlign: 'left', background: '#fff', borderRadius: 10, padding: '8px 14px', border: `1px solid ${s.border}` }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>المقياس</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.dot }}>{ins.metric}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── CUSTOMERS AI SCORE TAB ── */}
        {tab === 'customers' && (
          <>
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['all','high','medium','low'] as const).map(f => {
                const m = f === 'all' ? null : LABEL_META[f]
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 16px', borderRadius: 99, border: '2px solid',
                    borderColor: filter === f ? (m?.dot ?? '#6366F1') : '#E2E8F0',
                    background: filter === f ? (m?.bg ?? '#EEF2FF') : '#fff',
                    color: filter === f ? (m?.color ?? '#3730A3') : '#64748B',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {f === 'all' ? `الكل (${toAr(data.scoredCustomers.length)})` : `${m!.label} (${toAr(distribution[f])})`}
                  </button>
                )
              })}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 580, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>العميل</th>
                      <th>المنطقة</th>
                      <th>الموظف</th>
                      <th>تاريخ التسجيل</th>
                      <th>حداثة</th>
                      <th>الموظف</th>
                      <th>نمو المنطقة</th>
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
                          <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>{c.region}</span></td>
                          <td style={{ fontSize: 12, color: '#64748B' }}>{c.employee_name ?? c.assigned_employee_id}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{fmtDate(c.registration_date)}</td>
                          <td><ScorePip value={c.recency_score} /></td>
                          <td><ScorePip value={c.employee_score} /></td>
                          <td><ScorePip value={c.growth_score} /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 40, height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${(c.total_score / 10) * 100}%`, height: '100%', background: m.dot, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: m.dot }}>{c.total_score}</span>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 12, borderRadius: 2, background: i < Math.round(value / 2) ? color : '#F1F5F9' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{value}/١٠</span>
    </div>
  )
}
