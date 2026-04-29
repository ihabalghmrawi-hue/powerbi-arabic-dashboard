-- ============================================================
-- Multi-Tenant SaaS Schema — Arabic Dashboard
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. COMPANIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. USER PROFILES (extends auth.users) ────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. ADD company_id TO EXISTING TABLES ─────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ── 4. HELPER: returns current user's company_id ──────────────
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
$$;

-- ── 5. RLS — COMPANIES ───────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_company" ON companies;
CREATE POLICY "users_read_own_company" ON companies
  FOR SELECT USING (id = get_my_company_id());

-- ── 6. RLS — USER PROFILES ───────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- ── 7. RLS — EMPLOYEES (replace old public policies) ─────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on employees"    ON employees;
DROP POLICY IF EXISTS "auth users read employees"         ON employees;
DROP POLICY IF EXISTS "tenant_read_employees"             ON employees;
DROP POLICY IF EXISTS "tenant_insert_employees"           ON employees;
DROP POLICY IF EXISTS "tenant_update_employees"           ON employees;
DROP POLICY IF EXISTS "tenant_delete_employees"           ON employees;

CREATE POLICY "tenant_read_employees"   ON employees FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "tenant_insert_employees" ON employees FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "tenant_update_employees" ON employees FOR UPDATE USING (company_id = get_my_company_id());
CREATE POLICY "tenant_delete_employees" ON employees FOR DELETE USING (company_id = get_my_company_id());

-- ── 8. RLS — CUSTOMERS ───────────────────────────────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on customers"    ON customers;
DROP POLICY IF EXISTS "auth users read customers"         ON customers;
DROP POLICY IF EXISTS "tenant_read_customers"             ON customers;
DROP POLICY IF EXISTS "tenant_insert_customers"           ON customers;
DROP POLICY IF EXISTS "tenant_update_customers"           ON customers;
DROP POLICY IF EXISTS "tenant_delete_customers"           ON customers;

CREATE POLICY "tenant_read_customers"   ON customers FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "tenant_insert_customers" ON customers FOR INSERT WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "tenant_update_customers" ON customers FOR UPDATE USING (company_id = get_my_company_id());
CREATE POLICY "tenant_delete_customers" ON customers FOR DELETE USING (company_id = get_my_company_id());

-- ── 9. VIEWS (security_invoker = RLS is applied) ─────────────
DROP VIEW IF EXISTS employee_stats;
DROP VIEW IF EXISTS regions_summary;

CREATE VIEW regions_summary WITH (security_invoker = true) AS
SELECT
  region,
  company_id,
  COUNT(*)                                                                    AS customer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY company_id), 1) AS percentage
FROM customers
GROUP BY region, company_id
ORDER BY customer_count DESC;

CREATE VIEW employee_stats WITH (security_invoker = true) AS
SELECT
  e.employee_id,
  e.employee_name,
  e.department,
  e.region,
  e.hire_date,
  e.company_id,
  COUNT(c.customer_id)                                                             AS customer_count,
  RANK() OVER (PARTITION BY e.company_id ORDER BY COUNT(c.customer_id) DESC)      AS rank
FROM employees e
LEFT JOIN customers c
  ON c.assigned_employee_id = e.employee_id
 AND c.company_id           = e.company_id
GROUP BY e.employee_id, e.employee_name, e.department, e.region, e.hire_date, e.company_id;

-- ── 10. TRIGGER: auto-create company + profile on signup ──────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_name TEXT;
  v_company_id   UUID;
BEGIN
  v_company_name := TRIM(NEW.raw_user_meta_data->>'company_name');
  IF v_company_name IS NULL OR v_company_name = '' THEN
    v_company_name := 'شركة ' || split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO companies (name)
  VALUES (v_company_name)
  RETURNING id INTO v_company_id;

  INSERT INTO user_profiles (id, email, company_id)
  VALUES (NEW.id, NEW.email, v_company_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ── 11. GRANT view access to authenticated role ───────────────
GRANT SELECT ON employee_stats  TO authenticated;
GRANT SELECT ON regions_summary TO authenticated;
GRANT SELECT ON companies       TO authenticated;
GRANT SELECT ON user_profiles   TO authenticated;
GRANT ALL    ON employees       TO authenticated;
GRANT ALL    ON customers       TO authenticated;

-- ============================================================
-- ✅ Done. Now:
--  1. Go to Supabase → Authentication → Settings
--  2. Disable "Enable email confirmations" (for testing)
--     OR keep it ON for production (emails will be sent)
--  3. Restart your Vercel deployment
-- ============================================================
