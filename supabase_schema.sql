-- ============================================================
-- Supabase Schema - Arabic Power BI Dashboard
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  employee_id    TEXT PRIMARY KEY,            -- e.g. E-001
  employee_name  TEXT NOT NULL,
  department     TEXT NOT NULL,
  email          TEXT UNIQUE NOT NULL,
  hire_date      DATE NOT NULL,
  region         TEXT NOT NULL
);

-- 2. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  customer_id          TEXT PRIMARY KEY,       -- e.g. C-0001
  customer_name        TEXT NOT NULL,
  region               TEXT NOT NULL,
  assigned_employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  registration_date    DATE NOT NULL
);

-- Index for fast employee→customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_employee ON customers(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customers_region   ON customers(region);

-- 3. REGIONS VIEW (used by the API)
-- ============================================================
CREATE OR REPLACE VIEW regions_summary AS
SELECT
  region,
  COUNT(*)                                           AS customer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM customers
GROUP BY region
ORDER BY customer_count DESC;

-- 4. EMPLOYEE STATS VIEW (with rank)
-- ============================================================
CREATE OR REPLACE VIEW employee_stats AS
SELECT
  e.employee_id,
  e.employee_name,
  e.department,
  e.region,
  e.hire_date,
  COUNT(c.customer_id)                          AS customer_count,
  RANK() OVER (ORDER BY COUNT(c.customer_id) DESC) AS rank
FROM employees e
LEFT JOIN customers c ON c.assigned_employee_id = e.employee_id
GROUP BY e.employee_id, e.employee_name, e.department, e.region, e.hire_date
ORDER BY customer_count DESC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Production Safety
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers  ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to READ (for the dashboard)
CREATE POLICY "Allow public read on employees"
  ON employees FOR SELECT USING (true);

CREATE POLICY "Allow public read on customers"
  ON customers FOR SELECT USING (true);

-- Only service_role can INSERT/UPDATE/DELETE
-- (no policy needed → service_role bypasses RLS)

-- ============================================================
-- SAMPLE DATA — Employees
-- ============================================================
INSERT INTO employees (employee_id, employee_name, department, email, hire_date, region) VALUES
  ('E-001', 'سارة ميتشل',    'المبيعات', 's.mitchell@company.com', '2021-03-15', 'الشمال'),
  ('E-002', 'جيمس أوكونكو',  'المبيعات', 'j.okonkwo@company.com',  '2020-07-22', 'الجنوب'),
  ('E-003', 'ليلا باتيل',    'الدعم',    'l.patel@company.com',    '2022-01-10', 'الشرق'),
  ('E-004', 'أندريا توريس',  'الدعم',    'a.torres@company.com',   '2021-11-05', 'الغرب'),
  ('E-005', 'مايكل تشن',     'العمليات', 'm.chen@company.com',     '2019-06-18', 'الشمال'),
  ('E-006', 'رامي حسن',      'العمليات', 'r.hassan@company.com',   '2022-04-30', 'الجنوب'),
  ('E-007', 'دانا إيفانوفا', 'العمليات', 'd.ivanova@company.com',  '2023-02-14', 'الشرق'),
  ('E-008', 'فيليبي نغوين',  'المبيعات', 'p.nguyen@company.com',   '2023-09-01', 'الغرب')
ON CONFLICT (employee_id) DO NOTHING;

-- ============================================================
-- SAMPLE DATA — Customers (40 records from your CSV)
-- ============================================================
INSERT INTO customers (customer_id, customer_name, region, assigned_employee_id, registration_date) VALUES
  ('C-0001', 'شركة أكمي للتجارة',         'الشمال', 'E-001', '2024-01-12'),
  ('C-0002', 'مجموعة الخليج',             'الشمال', 'E-001', '2024-01-18'),
  ('C-0003', 'شركة التقنية المتقدمة',     'الجنوب', 'E-002', '2024-01-22'),
  ('C-0004', 'مؤسسة النور',               'الشرق',  'E-003', '2024-01-25'),
  ('C-0005', 'شركة الأفق الرقمي',         'الغرب',  'E-004', '2024-02-01'),
  ('C-0006', 'جلوبكس المحدودة',           'الشمال', 'E-001', '2024-02-03'),
  ('C-0007', 'إينيتك للتقنية',            'الجنوب', 'E-002', '2024-02-07'),
  ('C-0008', 'مجموعة أمبريلا',            'الشرق',  'E-003', '2024-02-11'),
  ('C-0009', 'دندر ميفلين',               'الغرب',  'E-004', '2024-02-15'),
  ('C-0010', 'شركة المستقبل',             'الشمال', 'E-001', '2024-02-19'),
  ('C-0011', 'مؤسسة الإبداع',             'الجنوب', 'E-005', '2024-02-22'),
  ('C-0012', 'شركة البيانات الذكية',      'الشرق',  'E-006', '2024-02-28'),
  ('C-0013', 'مجموعة الريادة',            'الغرب',  'E-007', '2024-03-04'),
  ('C-0014', 'شركة التحول الرقمي',        'الشمال', 'E-001', '2024-03-08'),
  ('C-0015', 'مؤسسة الابتكار',            'الجنوب', 'E-002', '2024-03-12'),
  ('C-0016', 'شركة الحلول المتكاملة',     'الشرق',  'E-003', '2024-03-17'),
  ('C-0017', 'مجموعة الاستثمار',          'الغرب',  'E-004', '2024-03-21'),
  ('C-0018', 'شركة التجارة الإلكترونية',  'الشمال', 'E-001', '2024-03-25'),
  ('C-0019', 'مؤسسة الجودة',              'الجنوب', 'E-005', '2024-03-29'),
  ('C-0020', 'شركة الخدمات المتقدمة',     'الشرق',  'E-006', '2024-04-02'),
  ('C-0021', 'مجموعة الشرق الأوسط',       'الشمال', 'E-001', '2024-04-06'),
  ('C-0022', 'شركة النهضة',               'الجنوب', 'E-002', '2024-04-10'),
  ('C-0023', 'مؤسسة التميز',              'الشرق',  'E-003', '2024-04-14'),
  ('C-0024', 'شركة الذكاء الاصطناعي',    'الغرب',  'E-004', '2024-04-18'),
  ('C-0025', 'مجموعة المعرفة',            'الشمال', 'E-001', '2024-04-22'),
  ('C-0026', 'شركة البناء الرقمي',        'الجنوب', 'E-005', '2024-04-26'),
  ('C-0027', 'مؤسسة التكنولوجيا',         'الشرق',  'E-006', '2024-04-30'),
  ('C-0028', 'شركة الأعمال الذكية',       'الغرب',  'E-007', '2024-05-04'),
  ('C-0029', 'مجموعة الابتكار التقني',    'الشمال', 'E-001', '2024-05-08'),
  ('C-0030', 'شركة المنصات الرقمية',      'الجنوب', 'E-002', '2024-05-12'),
  ('C-0031', 'مؤسسة الحوسبة السحابية',    'الشرق',  'E-003', '2024-05-16'),
  ('C-0032', 'شركة تحليل البيانات',       'الغرب',  'E-004', '2024-05-20'),
  ('C-0033', 'مجموعة الأمن السيبراني',    'الشمال', 'E-001', '2024-05-24'),
  ('C-0034', 'شركة إدارة المشاريع',       'الجنوب', 'E-005', '2024-05-28'),
  ('C-0035', 'مؤسسة التواصل الرقمي',      'الشرق',  'E-006', '2024-06-01'),
  ('C-0036', 'شركة الأتمتة الذكية',       'الغرب',  'E-007', '2024-06-05'),
  ('C-0037', 'مجموعة التحليلات المتقدمة', 'الشمال', 'E-001', '2024-06-09'),
  ('C-0038', 'شركة إنترنت الأشياء',       'الجنوب', 'E-002', '2024-06-13'),
  ('C-0039', 'مؤسسة الواقع المعزز',       'الشرق',  'E-003', '2024-06-17'),
  ('C-0040', 'شركة سلسلة الكتل',          'الغرب',  'E-004', '2024-06-21')
ON CONFLICT (customer_id) DO NOTHING;
