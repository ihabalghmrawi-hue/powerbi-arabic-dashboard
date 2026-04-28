'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

type Emp = { employee_name: string; customer_count: number; department: string }

const DEPT_COLOR: Record<string, string> = {
  'المبيعات': '#6366F1',
  'الدعم':    '#8B5CF6',
  'العمليات': '#06B6D4',
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: Emp; value: number }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#0F172A', color: '#fff', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, direction: 'rtl',
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.employee_name}</div>
      <div style={{ color: '#94A3B8' }}>القسم: <span style={{ color: '#A5B4FC' }}>{d.department}</span></div>
      <div style={{ color: '#94A3B8' }}>العملاء: <span style={{ color: '#34D399', fontWeight: 700 }}>{d.customer_count}</span></div>
    </div>
  )
}

export default function EmployeeBarChart({ data }: { data: Emp[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="employee_name"
          tick={{ fontSize: 11, fill: '#475569', direction: 'rtl' }}
          width={90}
          axisLine={false}
          tickLine={false}
          mirror
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
        <Bar dataKey="customer_count" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={i} fill={DEPT_COLOR[entry.department] ?? '#6366F1'} />
          ))}
          <LabelList dataKey="customer_count" position="right" style={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
