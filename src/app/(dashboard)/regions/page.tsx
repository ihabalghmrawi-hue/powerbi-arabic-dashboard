import { redirect } from 'next/navigation'
import { getCompanyContext } from '@/lib/auth'
import TopBar from '@/components/TopBar'

export default async function RegionsPage() {
  const ctx = await getCompanyContext()
  if (!ctx) redirect('/login')
  return (
    <>
      <TopBar title="المناطق" companyName={ctx.companyName} userEmail={ctx.email} />
      <div className="page-body fade-in">
        <div className="page-title">🗺 المناطق الجغرافية</div>
        <div className="page-subtitle">توزيع العملاء حسب المناطق — {ctx.companyName}</div>
        <p style={{ color: '#64748B', marginTop: 24 }}>البيانات تُحمَّل من لوحة التحكم الرئيسية — استخدم تبويب المناطق.</p>
      </div>
    </>
  )
}
