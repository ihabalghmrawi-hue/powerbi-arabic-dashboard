-- ============================================================
-- Supabase Schema v2 — Auth + RLS update
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Only needed if you already ran supabase_schema.sql before
-- ============================================================

-- Enable email auth in Supabase Dashboard:
-- Authentication → Providers → Email → Enable

-- ── Update RLS to support authenticated users ──────────────

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow public read on employees" ON employees;
DROP POLICY IF EXISTS "Allow public read on customers"  ON customers;

-- Allow authenticated users to read all data
CREATE POLICY "auth users read employees"
  ON employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth users read customers"
  ON customers FOR SELECT TO authenticated USING (true);

-- Allow service_role to write (bypasses RLS automatically)

-- ── If views don't exist yet, create them ─────────────────

CREATE OR REPLACE VIEW regions_summary AS
SELECT
  region,
  COUNT(*)                                                    AS customer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)         AS percentage
FROM customers
GROUP BY region
ORDER BY customer_count DESC;

CREATE OR REPLACE VIEW employee_stats AS
SELECT
  e.employee_id,
  e.employee_name,
  e.department,
  e.region,
  e.hire_date,
  COUNT(c.customer_id)                              AS customer_count,
  RANK() OVER (ORDER BY COUNT(c.customer_id) DESC) AS rank
FROM employees e
LEFT JOIN customers c ON c.assigned_employee_id = e.employee_id
GROUP BY e.employee_id, e.employee_name, e.department, e.region, e.hire_date
ORDER BY customer_count DESC;
