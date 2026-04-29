'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  title:       string
  companyName?: string
  userEmail?:  string
}

export default function TopBar({ title, companyName, userEmail }: Props) {
  const router  = useRouter()
  const [open,  setOpen]  = useState(false)
  const [busy,  setBusy]  = useState(false)

  async function handleLogout() {
    setBusy(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      height: 64, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      gap: 16,
    }}>
      {/* Title */}
      <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</div>

      {/* Company badge */}
      {companyName && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
          background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE',
        }}>
          🏢 {companyName}
        </div>
      )}

      {/* Date */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
        background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
      }}>
        📅 {new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {/* User dropdown */}
      {userEmail && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 10, border: '1px solid #E2E8F0',
            background: '#F8FAFC', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#374151',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {userEmail[0].toUpperCase()}
            </div>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </span>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>▼</span>
          </button>

          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', left: 0, top: 44, minWidth: 200, zIndex: 100,
                background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.15)',
                border: '1px solid #E2E8F0', overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>مسجّل الدخول بـ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{userEmail}</div>
                </div>
                <button onClick={handleLogout} disabled={busy} style={{
                  width: '100%', padding: '12px 16px', border: 'none', background: 'transparent',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  fontSize: 13, color: '#EF4444', fontFamily: 'inherit', fontWeight: 600,
                }}>
                  🚪 {busy ? 'جارٍ الخروج...' : 'تسجيل الخروج'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
