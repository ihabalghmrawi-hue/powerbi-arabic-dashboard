import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'تحليلات الموظفين والعملاء',
  description: 'لوحة تحكم Power BI - تحليلات الموظفين والعملاء',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
