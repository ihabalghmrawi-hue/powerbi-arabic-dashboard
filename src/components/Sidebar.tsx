'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/',          label: 'لوحة التحكم',   icon: '◈' },
  { href: '/employees', label: 'الموظفون',       icon: '👥' },
  { href: '/regions',   label: 'المناطق',        icon: '🗺' },
  { href: '/upload',    label: 'رفع البيانات',   icon: '⬆' },
]

export default function Sidebar({ onCollapse }: { onCollapse?: (v: boolean) => void }) {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  return (
    <aside style={{
      position: 'fixed',
      top: 0, right: 0,
      width: collapsed ? 72 : 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .3s ease',
      zIndex: 100,
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(0,0,0,.2)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 20px',
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,.07)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#fff',
          flexShrink: 0,
        }}>BI</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>لوحة التحليلات</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, whiteSpace: 'nowrap' }}>Power BI Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: 1.2, padding: '4px 10px 8px', textTransform: 'uppercase' }}>
            القائمة الرئيسية
          </div>
        )}
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '11px' : '11px 12px',
              borderRadius: 10,
              marginBottom: 2,
              textDecoration: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: active
                ? 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.15))'
                : 'transparent',
              borderRight: active ? '3px solid #6366F1' : '3px solid transparent',
              transition: 'all .15s',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}>
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,.6)',
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={toggle} style={{
          width: '100%',
          padding: collapsed ? 11 : '11px 12px',
          borderRadius: 10,
          border: 'none',
          background: 'rgba(255,255,255,.06)',
          color: 'rgba(255,255,255,.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          fontSize: 13,
          fontFamily: 'inherit',
          transition: 'background .15s',
        }}>
          <span style={{ fontSize: 14 }}>{collapsed ? '◀' : '▶'}</span>
          {!collapsed && <span>طيّ القائمة</span>}
        </button>
      </div>
    </aside>
  )
}
