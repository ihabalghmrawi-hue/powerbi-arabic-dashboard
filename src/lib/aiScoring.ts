/**
 * AI Scoring Engine — RFM-based customer intelligence
 *
 * Dimensions scored (each 0–10):
 *   R  Recency   – how recently was the customer registered / last active
 *   E  Employee  – how high-performing is their assigned employee
 *   G  Growth    – how fast is their region growing
 *
 * Final score = R×0.5 + E×0.3 + G×0.2
 * High ≥ 7 | Medium ≥ 4 | Low < 4
 */

export type AiScore = 'high' | 'medium' | 'low'

export interface ScoredCustomer {
  customer_id: string
  customer_name: string
  region: string
  registration_date: string
  assigned_employee_id: string
  employee_name?: string
  recency_score: number
  employee_score: number
  growth_score: number
  total_score: number
  ai_label: AiScore
}

export interface AiInsight {
  id: string
  type: 'success' | 'warning' | 'info' | 'danger'
  icon: string
  title: string
  body: string
  metric?: string
  priority: number   // lower = shown first
}

// ── Recency scorer ──────────────────────────────────────────
function recencyScore(registrationDate: string): number {
  const days = (Date.now() - new Date(registrationDate).getTime()) / 86_400_000
  if (days < 30)  return 10
  if (days < 60)  return 8
  if (days < 90)  return 7
  if (days < 120) return 5
  if (days < 180) return 3
  return 1
}

// ── Employee performance scorer (rank 1 = best) ─────────────
function employeeScore(rank: number, total: number): number {
  if (total === 0) return 5
  return Math.round(10 - ((rank - 1) / total) * 9)
}

// ── Region growth scorer ────────────────────────────────────
// Returns a 0-10 score per region based on registrations in last 90 days
export function buildRegionGrowthScores(
  customers: { region: string; registration_date: string }[]
): Record<string, number> {
  const cutoff = Date.now() - 90 * 86_400_000
  const recent: Record<string, number> = {}
  const total:  Record<string, number> = {}

  for (const c of customers) {
    total[c.region]  = (total[c.region]  ?? 0) + 1
    if (new Date(c.registration_date).getTime() > cutoff)
      recent[c.region] = (recent[c.region] ?? 0) + 1
  }

  const scores: Record<string, number> = {}
  for (const region of Object.keys(total)) {
    const ratio = (recent[region] ?? 0) / total[region]
    scores[region] = Math.round(ratio * 10)
  }
  return scores
}

// ── Main scorer ─────────────────────────────────────────────
export function scoreCustomers(
  customers: {
    customer_id: string
    customer_name: string
    region: string
    registration_date: string
    assigned_employee_id: string
    employee_name?: string
    employee_rank?: number
  }[],
  totalEmployees: number,
  regionGrowthScores: Record<string, number>
): ScoredCustomer[] {
  return customers.map(c => {
    const R = recencyScore(c.registration_date)
    const E = employeeScore(c.employee_rank ?? totalEmployees, totalEmployees)
    const G = regionGrowthScores[c.region] ?? 5

    const total = R * 0.5 + E * 0.3 + G * 0.2
    const label: AiScore = total >= 7 ? 'high' : total >= 4 ? 'medium' : 'low'

    return {
      customer_id:          c.customer_id,
      customer_name:        c.customer_name,
      region:               c.region,
      registration_date:    c.registration_date,
      assigned_employee_id: c.assigned_employee_id,
      employee_name:        c.employee_name,
      recency_score:        Math.round(R),
      employee_score:       Math.round(E),
      growth_score:         Math.round(G),
      total_score:          Math.round(total * 10) / 10,
      ai_label:             label,
    }
  })
}

// ── Insight generator ───────────────────────────────────────
export function generateInsights(params: {
  employees:       { employee_id: string; employee_name: string; department: string; region: string; customer_count: number; rank: number }[]
  regions:         { region: string; customer_count: number; percentage: number }[]
  customers:       { region: string; registration_date: string; assigned_employee_id: string }[]
  scoredCustomers: ScoredCustomer[]
  totalCustomers:  number
}): AiInsight[] {
  const { employees, regions, customers, scoredCustomers, totalCustomers } = params
  const insights: AiInsight[] = []

  // ── 1. Top employee ─────────────────────────────────────
  const top = employees[0]
  if (top) {
    insights.push({
      id: 'top-employee',
      type: 'success',
      icon: '🏆',
      priority: 1,
      title: `${top.employee_name} هو أفضل موظف أداءً`,
      body: `يمتلك ${top.customer_count} عميل — أعلى من المتوسط بمقدار ${Math.round(top.customer_count - totalCustomers / employees.length)} عميل. يستحق مكافأة أداء.`,
      metric: `${top.customer_count} عميل`,
    })
  }

  // ── 2. Underperforming employee ─────────────────────────
  const last = employees[employees.length - 1]
  if (last && employees.length > 1) {
    insights.push({
      id: 'low-employee',
      type: 'warning',
      icon: '⚠️',
      priority: 3,
      title: `${last.employee_name} يحتاج دعماً`,
      body: `لديه فقط ${last.customer_count} عميل — أدنى من المتوسط. يُنصح بتدريب إضافي أو إعادة توزيع الحمل.`,
      metric: `${last.customer_count} عميل`,
    })
  }

  // ── 3. Fastest growing region ───────────────────────────
  const cutoff90 = Date.now() - 90 * 86_400_000
  const regionRecent: Record<string, number> = {}
  for (const c of customers) {
    if (new Date(c.registration_date).getTime() > cutoff90)
      regionRecent[c.region] = (regionRecent[c.region] ?? 0) + 1
  }
  const topGrowthRegion = Object.entries(regionRecent).sort((a, b) => b[1] - a[1])[0]
  if (topGrowthRegion) {
    insights.push({
      id: 'growth-region',
      type: 'success',
      icon: '📈',
      priority: 2,
      title: `منطقة ${topGrowthRegion[0]} تنمو بسرعة`,
      body: `سُجّل ${topGrowthRegion[1]} عميل جديد في الـ 90 يوماً الأخيرة. ضع مزيداً من الموظفين في هذه المنطقة.`,
      metric: `+${topGrowthRegion[1]} في 90 يوم`,
    })
  }

  // ── 4. Inactive customers (registered 90+ days ago) ─────
  const inactiveCount = scoredCustomers.filter(c => c.recency_score <= 3).length
  if (inactiveCount > 0) {
    insights.push({
      id: 'inactive',
      type: 'danger',
      icon: '🔴',
      priority: 4,
      title: `${inactiveCount} عميل غير نشط منذ أكثر من 90 يوماً`,
      body: `هؤلاء العملاء بحاجة لمتابعة فورية. تواصل معهم لإعادة التفاعل قبل فقدانهم نهائياً.`,
      metric: `${Math.round((inactiveCount / totalCustomers) * 100)}٪ من الإجمالي`,
    })
  }

  // ── 5. High-value customers ─────────────────────────────
  const highCount = scoredCustomers.filter(c => c.ai_label === 'high').length
  if (highCount > 0) {
    insights.push({
      id: 'high-value',
      type: 'info',
      icon: '💎',
      priority: 5,
      title: `${highCount} عميل ذو قيمة عالية`,
      body: `هؤلاء يمثلون ${Math.round((highCount / totalCustomers) * 100)}٪ من قاعدة عملائك وأكثر عرضة للتجاوب. خصّص لهم عروضاً حصرية.`,
      metric: `${Math.round((highCount / totalCustomers) * 100)}٪`,
    })
  }

  // ── 6. Best region ─────────────────────────────────────
  const topRegion = regions[0]
  if (topRegion) {
    insights.push({
      id: 'top-region',
      type: 'success',
      icon: '🗺️',
      priority: 6,
      title: `منطقة ${topRegion.region} تستحوذ على ${Math.round(topRegion.percentage)}٪ من العملاء`,
      body: `أعلى منطقة من حيث قاعدة العملاء بـ ${topRegion.customer_count} عميل. عزّز الموارد هنا للحفاظ على الريادة.`,
      metric: `${topRegion.customer_count} عميل`,
    })
  }

  // ── 7. Weakest region ─────────────────────────────────
  const weakRegion = regions[regions.length - 1]
  if (weakRegion && regions.length > 1) {
    insights.push({
      id: 'weak-region',
      type: 'warning',
      icon: '📉',
      priority: 7,
      title: `منطقة ${weakRegion.region} تحتاج تركيزاً أكبر`,
      body: `أقل المناطق عملاءً بنسبة ${Math.round(weakRegion.percentage)}٪ فقط. فرصة توسّع لم تُستغل بعد.`,
      metric: `${weakRegion.customer_count} عميل`,
    })
  }

  // ── 8. Department balance ──────────────────────────────
  const deptCounts: Record<string, number> = {}
  for (const e of employees) deptCounts[e.department] = (deptCounts[e.department] ?? 0) + 1
  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]
  if (topDept) {
    insights.push({
      id: 'dept',
      type: 'info',
      icon: '🏢',
      priority: 8,
      title: `قسم ${topDept[0]} الأكثر توظيفاً`,
      body: `يضم ${topDept[1]} موظف. تأكد من التوازن بين الأقسام لتوزيع الحمل بكفاءة.`,
      metric: `${topDept[1]} موظف`,
    })
  }

  return insights.sort((a, b) => a.priority - b.priority)
}
