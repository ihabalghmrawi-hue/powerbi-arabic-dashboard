'use client'

import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

type Slice = { name: string; value: number }

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: Slice }[] }) => {
  if (!active || !payload?.length) return null
  const total = payload[0].payload.value
  return (
    <div style={{
      background: '#0F172A', color: '#fff', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, direction: 'rtl',
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{payload[0].name}</div>
      <div style={{ color: '#94A3B8' }}>
        العملاء: <span style={{ color: '#34D399', fontWeight: 700 }}>{total}</span>
      </div>
    </div>
  )
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number
}) => {
  if (percent < 0.05) return null
  const R = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + R * Math.cos(-midAngle * (Math.PI / 180))
  const y = cy + R * Math.sin(-midAngle * (Math.PI / 180))
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}٪`}
    </text>
  )
}

export default function RegionPieChart({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          outerRadius={100}
          innerRadius={52}
          dataKey="value"
          nameKey="name"
          paddingAngle={3}
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, color: '#475569' }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
