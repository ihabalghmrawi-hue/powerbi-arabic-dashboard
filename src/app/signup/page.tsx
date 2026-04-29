'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { company_name: companyName.trim() } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>تم إنشاء حسابك!</h2>
          <p style={{ color: '#64748B', lineHeight: 1.8, marginBottom: 28 }}>
            تم إرسال رسالة تأكيد إلى <strong>{email}</strong><br />
            يرجى تأكيد بريدك ثم تسجيل الدخول.
          </p>
          <Link href="/login" style={{ ...styles.btn, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            الذهاب إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>إنشاء حساب جديد</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>ابدأ رحلتك مع لوحة التحكم</div>
        </div>

        <form onSubmit={handleSignup} style={styles.form}>
          <label style={styles.label}>اسم الشركة
            <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="شركة المستقبل للتقنية" style={styles.input} />
          </label>
          <label style={styles.label}>البريد الإلكتروني
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@company.com" style={styles.input} dir="ltr" />
          </label>
          <label style={styles.label}>كلمة المرور
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل" style={styles.input} dir="ltr" />
          </label>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب →'}
          </button>
        </form>

        <div style={{ background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:12,padding:'14px 16px',fontSize:12,color:'#15803D',lineHeight:2,marginTop:16 }}>
          <strong>ما الذي سيحدث تلقائياً؟</strong><br />
          ١. إنشاء شركة جديدة باسمك<br />
          ٢. بيانات معزولة 100% عن الشركات الأخرى<br />
          ٣. يمكنك رفع موظفيك وعملاءك الخاصين
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#64748B' }}>
          لديك حساب؟{' '}
          <Link href="/login" style={{ color:'#6366F1', fontWeight:700, textDecoration:'none' }}>تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight:'100vh', background:'linear-gradient(135deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:24, fontFamily:"'IBM Plex Sans Arabic',sans-serif", direction:'rtl',
  },
  card: {
    background:'#fff', borderRadius:24, padding:'48px 40px',
    width:'100%', maxWidth:440, boxShadow:'0 25px 60px rgba(0,0,0,.4)',
  },
  form: { display:'flex', flexDirection:'column', gap:20 },
  label: { fontSize:14, fontWeight:600, color:'#374151', display:'flex', flexDirection:'column', gap:8 },
  input: {
    padding:'12px 16px', border:'2px solid #E5E7EB', borderRadius:10,
    fontSize:14, fontFamily:"'IBM Plex Sans Arabic',sans-serif",
    outline:'none', background:'#F9FAFB', width:'100%', boxSizing:'border-box',
  },
  errorBox: { background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#991B1B' },
  btn: {
    background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none',
    borderRadius:10, padding:'14px 24px', fontSize:15, fontWeight:700,
    fontFamily:"'IBM Plex Sans Arabic',sans-serif", cursor:'pointer',
    boxShadow:'0 4px 14px rgba(99,102,241,.4)',
  },
}
