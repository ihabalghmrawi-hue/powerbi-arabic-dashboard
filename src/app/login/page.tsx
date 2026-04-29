'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : error.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>لوحة التحكم</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>منصة تحليل البيانات</div>
        </div>

        <h1 style={styles.title}>تسجيل الدخول</h1>
        <p style={styles.subtitle}>أدخل بياناتك للوصول إلى لوحة التحكم</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>البريد الإلكتروني
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@company.com" style={styles.input} dir="ltr" />
          </label>

          <label style={styles.label}>كلمة المرور
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={styles.input} dir="ltr" />
          </label>

          {error && (
            <div style={styles.errorBox}>⚠️ {error}</div>
          )}

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748B' }}>
          ليس لديك حساب؟{' '}
          <Link href="/signup" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: 'rtl',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 40px',
    width: '100%', maxWidth: 440, boxShadow: '0 25px 60px rgba(0,0,0,.4)',
  },
  logo: { textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  label: { fontSize: 14, fontWeight: 600, color: '#374151', display: 'flex', flexDirection: 'column', gap: 8 },
  input: {
    padding: '12px 16px', border: '2px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, fontFamily: "'IBM Plex Sans Arabic',sans-serif",
    outline: 'none', background: '#F9FAFB', width: '100%', boxSizing: 'border-box',
  },
  errorBox: {
    background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
    padding: '12px 16px', fontSize: 13, color: '#991B1B',
  },
  btn: {
    background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none',
    borderRadius: 10, padding: '14px 24px', fontSize: 15, fontWeight: 700,
    fontFamily: "'IBM Plex Sans Arabic',sans-serif", cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(99,102,241,.4)',
  },
}
