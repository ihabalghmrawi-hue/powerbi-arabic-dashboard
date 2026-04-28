'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts'

type Point = { month: string; label: string; new_customers: number; total_customers: number }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0F172A', color: '#fff', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, direction: 'rtl',
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#A5B4FC' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: '#94A3B8' }}>
          {p.name === 'total_customers' ? 'الإجمالي' : 'جديد'}:
          <span style={{ color: p.name === 'total_customers' ? '#34D399' : '#F59E0B', fontWeight: 700, marginRight: 6 }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function GrowthLineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total_customers"
          stroke="#6366F1"
          strokeWidth={2.5}
          fill="url(#totalGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="new_customers"
          stroke="#F59E0B"
          strokeWidth={2}
          fill="url(#newGrad)"
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
