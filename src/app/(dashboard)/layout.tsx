'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F1F5F9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid #E2E8F0',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin .7s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 14, color: '#94A3B8' }}>جارٍ التحقق من الجلسة…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar onCollapse={setCollapsed} />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        {children}
      </div>
    </div>
  )
}
