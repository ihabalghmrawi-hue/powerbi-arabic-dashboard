'use client'

import { useState } from 'react'

const SQL = `-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- 1. Companies table
CREATE TABLE IF NOT EXISTS companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User profiles (links auth.users to companies)
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add company_id to existing tables
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 4. Helper function
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
$$;

-- 5. Enable RLS
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow public read on employees" ON employees;
DROP POLICY IF EXISTS "Allow public read on customers" ON customers;
DROP POLICY IF EXISTS "users_read_own_company"         ON companies;
DROP POLICY IF EXISTS "users_own_profile"              ON user_profiles;
DROP POLICY IF EXISTS "tenant_read_employees"          ON employees;
DROP POLICY IF EXISTS "tenant_insert_employees"        ON employees;
DROP POLICY IF EXISTS "tenant_read_customers"          ON customers;
DROP POLICY IF EXISTS "tenant_insert_customers"        ON customers;

-- Create tenant-scoped policies
CREATE POLICY "users_read_own_company"  ON companies     FOR SELECT USING (id = get_my_company_id());
CREATE POLICY "users_own_profile"       ON user_profiles FOR ALL    USING (id = auth.uid());
CREATE POLICY "tenant_read_employees"   ON employees     FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "tenant_insert_employees" ON employees     FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "tenant_read_customers"   ON customers     FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "tenant_insert_customers" ON customers     FOR INSERT WITH CHECK (company_id = get_my_company_id());

-- 6. Update views
DROP VIEW IF EXISTS employee_stats;
DROP VIEW IF EXISTS regions_summary;

CREATE VIEW regions_summary WITH (security_invoker = true) AS
SELECT region, company_id,
  COUNT(*) AS customer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY company_id), 1) AS percentage
FROM customers GROUP BY region, company_id ORDER BY customer_count DESC;

CREATE VIEW employee_stats WITH (security_invoker = true) AS
SELECT e.employee_id, e.employee_name, e.department, e.region, e.hire_date, e.company_id,
  COUNT(c.customer_id) AS customer_count,
  RANK() OVER (PARTITION BY e.company_id ORDER BY COUNT(c.customer_id) DESC) AS rank
FROM employees e
LEFT JOIN customers c ON c.assigned_employee_id = e.employee_id AND c.company_id = e.company_id
GROUP BY e.employee_id, e.employee_name, e.department, e.region, e.hire_date, e.company_id;

-- 7. Grants
GRANT SELECT ON employee_stats, regions_summary, companies, user_profiles TO authenticated;
GRANT ALL    ON employees, customers TO authenticated;

-- 8. Auto-create company + profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_name TEXT; v_cid UUID;
BEGIN
  v_name := TRIM(NEW.raw_user_meta_data->>'company_name');
  IF v_name IS NULL OR v_name = '' THEN
    v_name := split_part(NEW.email, '@', 1);
  END IF;
  INSERT INTO companies (name) VALUES (v_name) RETURNING id INTO v_cid;
  INSERT INTO user_profiles (id, email, company_id) VALUES (NEW.id, NEW.email, v_cid);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Done! Go back to the app and log in.`

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  function copySql() {
    navigator.clipboard.writeText(SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗄️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>
            إعداد قاعدة البيانات
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            خطوة واحدة فقط — تستغرق أقل من دقيقة
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {[
            { n: '١', title: 'افتح Supabase Dashboard', desc: 'supabase.com → افتح مشروعك' },
            { n: '٢', title: 'SQL Editor → New Query', desc: 'في القائمة الجانبية، اختر SQL Editor ثم New query' },
            { n: '٣', title: 'الصق الكود واضغط Run', desc: 'انسخ الكود أدناه، الصقه، اضغط Run أو Ctrl+Enter' },
          ].map(s => (
            <div key={s.n} style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              background: '#fff', borderRadius: 14, padding: '16px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #E2E8F0',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff', fontWeight: 800, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SQL Box */}
        <div style={{ background: '#0F172A', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.15)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>SQL — انسخ والصق في Supabase</span>
            <button onClick={copySql} style={{
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 12, fontWeight: 700,
              fontFamily: "'IBM Plex Sans Arabic',sans-serif", cursor: 'pointer',
              background: copied ? '#10B981' : 'rgba(99,102,241,.9)',
              transition: 'background .2s',
            }}>
              {copied ? '✅ تم النسخ!' : '📋 نسخ الكود كاملاً'}
            </button>
          </div>
          <pre style={{
            margin: 0, padding: '20px', color: '#94A3B8',
            fontSize: 11, lineHeight: 1.7, overflowX: 'auto',
            fontFamily: "'Courier New',monospace", direction: 'ltr', textAlign: 'left',
            maxHeight: 380, overflowY: 'auto',
          }}>{SQL}</pre>
        </div>

        {/* Done */}
        <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: 16, padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 16 }}>
            بعد تشغيل الكود، ارجع وسجّل دخولك
          </div>
          <a href="/login" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color: '#fff', textDecoration: 'none',
            padding: '12px 28px', borderRadius: 10,
            fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 14px rgba(99,102,241,.4)',
          }}>
            الذهاب إلى تسجيل الدخول →
          </a>
        </div>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#F8FAFC',
    fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: 'rtl', padding: '40px 20px',
  },
  container: { maxWidth: 760, margin: '0 auto' },
}
