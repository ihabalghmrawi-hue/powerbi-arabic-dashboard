'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/',          label: 'لوحة التحكم',      icon: '◈' },
  { href: '/employees', label: 'الموظفون',          icon: '👥' },
  { href: '/regions',   label: 'المناطق',           icon: '🗺' },
  { href: '/upload',    label: 'رفع البيانات',      icon: '⬆' },
  { href: '/insights',  label: 'الذكاء الاصطناعي', icon: '🤖', badge: 'AI' },
]

type SidebarProps = {
  onCollapse?:  (v: boolean) => void
  companyName?: string
  userEmail?:   string
}

export default function Sidebar({ onCollapse, companyName, userEmail }: SidebarProps) {
  const path    = usePathname()
  const router  = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0,
      width: collapsed ? 72 : 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .3s ease',
      zIndex: 100, overflow: 'hidden',
      boxShadow: '0 0 40px rgba(0,0,0,.25)',
    }}>
      {/* Logo + Company */}
      <div style={{
        padding: '0 20px', height: 'var(--topbar-h)',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99,102,241,.4)',
        }}>BI</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
              {companyName ?? 'لوحة التحليلات'}
            </div>
            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 10, whiteSpace: 'nowrap' }}>AI Analytics Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.2)', letterSpacing: 1.5, padding: '4px 10px 10px', textTransform: 'uppercase' }}>
            القائمة الرئيسية
          </div>
        )}

        {NAV.map((item) => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center',
              gap: 12, padding: collapsed ? '11px' : '10px 12px',
              borderRadius: 10, marginBottom: 3,
              textDecoration: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: active
                ? 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.15))'
                : 'transparent',
              borderRight: active ? '3px solid #6366F1' : '3px solid transparent',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,.6)',
                  whiteSpace: 'nowrap', flex: 1,
                }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 6px',
                  borderRadius: 99, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  color: '#fff', letterSpacing: .5,
                }}>{item.badge}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      {userEmail && (
        <div style={{ padding: '10px 10px 0', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>الحساب</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
            </div>
          )}
          <button onClick={handleLogout} disabled={loggingOut} style={{
            width: '100%', padding: collapsed ? 11 : '9px 12px',
            borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.15)',
            color: '#FCA5A5', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10, fontSize: 12, fontFamily: 'inherit', marginBottom: 6,
          }}>
            <span>🚪</span>
            {!collapsed && <span>{loggingOut ? 'جارٍ الخروج...' : 'تسجيل الخروج'}</span>}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
        <button onClick={toggle} style={{
          width: '100%', padding: collapsed ? 11 : '10px 12px',
          borderRadius: 10, border: 'none',
          background: 'rgba(255,255,255,.05)',
          color: 'rgba(255,255,255,.45)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, fontSize: 12, fontFamily: 'inherit', transition: 'background .15s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.1)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.05)')}>
          <span style={{ fontSize: 13 }}>{collapsed ? '◀' : '▶'}</span>
          {!collapsed && <span>طيّ القائمة</span>}
        </button>
      </div>
    </aside>
  )
}
