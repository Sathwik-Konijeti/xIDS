import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ShapChart({ features }) {
  if (!features) return null

  const data = Object.entries(features).map(([name, info]) => ({
    name: name.length > 20 ? name.slice(0, 20) + '...' : name,
    shap: parseFloat(info.shap.toFixed(4)),
    value: info.value,
  })).sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">Top SHAP Features</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            stroke="#6b7280"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#f9fafb' }}
            formatter={(val, _, props) => [
              `SHAP: ${val} | Value: ${props.payload.value}`,
              ''
            ]}
          />
          {data.map((entry, index) => (
            <Bar key={index} dataKey="shap" radius={[0, 4, 4, 0]}>
              <Cell fill={entry.shap >= 0 ? '#3b82f6' : '#ef4444'} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
