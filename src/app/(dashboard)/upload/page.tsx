import { redirect } from 'next/navigation'
import { getCompanyContext } from '@/lib/auth'
import TopBar from '@/components/TopBar'
import UploadClient from './UploadClient'

export default async function UploadPage() {
  const ctx = await getCompanyContext()
  if (!ctx) redirect('/login')
  return (
    <>
      <TopBar title="رفع البيانات" companyName={ctx.companyName} userEmail={ctx.email} />
      <UploadClient />
    </>
  )
}
