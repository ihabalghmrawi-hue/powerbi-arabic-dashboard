'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })

    const { error: err } = await fn
    setLoading(false)

    if (err) {
      setError(err.message)
    } else if (mode === 'signup') {
      setError('')
      setMode('login')
      alert('تم إنشاء الحساب! يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.')
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.2),transparent)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.15),transparent)', bottom: -50, left: -50 }} />
      </div>

      <div className="auth-card fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, color: '#fff',
            boxShadow: '0 8px 24px rgba(99,102,241,.4)',
          }}>BI</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            {mode === 'login' ? 'مرحباً بك' : 'إنشاء حساب جديد'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>
            {mode === 'login' ? 'سجّل الدخول للوصول إلى لوحة التحكم' : 'أنشئ حسابك للبدء'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5', display: 'flex', gap: 8, alignItems: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" style={{ color: 'rgba(255,255,255,.6)' }}>البريد الإلكتروني</label>
            <input
              className="input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: 'rgba(255,255,255,.6)' }}>كلمة المرور</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? <><div className="spinner" /> جارٍ المعالجة…</> : mode === 'login' ? '🚀 تسجيل الدخول' : '✨ إنشاء الحساب'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
          {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#818CF8', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            {mode === 'login' ? 'أنشئ حساباً' : 'سجّل الدخول'}
          </button>
        </div>
      </div>
    </div>
  )
}
