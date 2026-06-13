export default function StatsPanel({ stats }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Alerts</p>
        <p className="text-white text-2xl font-bold">{stats.total_alerts}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Flows</p>
        <p className="text-white text-2xl font-bold">{stats.total_flows}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Flagged Flows</p>
        <p className="text-white text-2xl font-bold">{stats.flagged_flows}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Attack Types</p>
        <p className="text-white text-2xl font-bold">
          {Object.keys(stats.by_attack_type).length}
        </p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl col-span-2 md:col-span-4 p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">By Attack Type</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.by_attack_type).map(([type, count]) => (
            <span key={type} className="bg-blue-900 text-blue-200 text-xs px-3 py-1 rounded-full">
              {type}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
