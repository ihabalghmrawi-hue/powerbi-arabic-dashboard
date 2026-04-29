import TopBar from '@/components/TopBar'

export default function EmployeesPage() {
  return (
    <>
      <TopBar title="الموظفون" />
      <div className="page-body fade-in">
        <div className="page-title">👥 الموظفون</div>
        <div className="page-subtitle">بيانات الموظفين متاحة في لوحة التحكم الرئيسية</div>
      </div>
    </>
  )
}
