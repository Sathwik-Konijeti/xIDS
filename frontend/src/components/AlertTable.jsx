const ATTACK_COLORS = {
  DDoS: 'bg-red-900 text-red-200',
  'Port Scanning': 'bg-yellow-900 text-yellow-200',
  'Brute Force': 'bg-orange-900 text-orange-200',
  'Web Attacks': 'bg-purple-900 text-purple-200',
  Bots: 'bg-pink-900 text-pink-200',
  DoS: 'bg-red-900 text-red-200',
  benign: 'bg-green-900 text-green-200',
}

const TIER_COLORS = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-red-400' }

export default function AlertTable({ alerts, onSelect }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-500">No alerts yet</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">ID</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Attack Type</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Source IP</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Confidence</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Tier</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Timestamp</th>
            <th className="text-left text-gray-400 text-xs uppercase tracking-wider px-4 py-3">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              onClick={() => onSelect(alert)}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition"
            >
              <td className="px-4 py-3 text-gray-400">#{alert.id}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ATTACK_COLORS[alert.attack_type] || 'bg-gray-800 text-gray-200'}`}>
                  {alert.attack_type}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-300 font-mono">{alert.source_ip || '—'}</td>
              <td className="px-4 py-3 text-white">{(alert.confidence_score * 100).toFixed(1)}%</td>
              <td className={`px-4 py-3 font-medium ${TIER_COLORS[alert.tier_reached]}`}>
                Tier {alert.tier_reached}
              </td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(alert.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                {alert.analyst_feedback ? (
                  <span className="text-green-400 text-xs">
                    ✓ {alert.analyst_feedback.verdict?.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
