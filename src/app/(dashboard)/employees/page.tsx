import { redirect } from 'next/navigation'
import { getCompanyContext } from '@/lib/auth'
import TopBar from '@/components/TopBar'

export default async function EmployeesPage() {
  const ctx = await getCompanyContext()
  if (!ctx) redirect('/login')
  return (
    <>
      <TopBar title="الموظفون" companyName={ctx.companyName} userEmail={ctx.email} />
      <div className="page-body fade-in">
        <div className="page-title">👥 إدارة الموظفين</div>
        <div className="page-subtitle">بيانات موظفي {ctx.companyName}</div>
        <p style={{ color: '#64748B', marginTop: 24 }}>البيانات تُحمَّل من لوحة التحكم الرئيسية — استخدم تبويب الموظفين.</p>
      </div>
    </>
  )
}
