import { redirect }          from 'next/navigation'
import { getCompanyContext } from '@/lib/auth'
import InsightsClient        from './InsightsClient'

export default async function InsightsPage() {
  const ctx = await getCompanyContext()
  if (!ctx) redirect('/login')
  return <InsightsClient companyName={ctx.companyName} userEmail={ctx.email} />
}
