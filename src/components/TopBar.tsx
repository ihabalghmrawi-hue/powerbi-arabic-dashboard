'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function TopBar({ title }: { title: string }) {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user?.email ?? null)
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{
      height: 64,
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          background: '#F1F5F9', color: '#475569',
          border: '1px solid #E2E8F0',
        }}>
          📅 {new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {user && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 8px', borderRadius: 99,
              border: '1px solid #E2E8F0', background: 'transparent',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F1F5F9')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 11,
              }}>
                {user.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user}
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>▾</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', left: 0,
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.12)',
                minWidth: 160, padding: 6, zIndex: 200,
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>مسجّل كـ</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', wordBreak: 'break-all' }}>{user}</div>
                </div>
                <button onClick={signOut} style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, color: '#EF4444', textAlign: 'right',
                  borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FEE2E2')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  🚪 تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
