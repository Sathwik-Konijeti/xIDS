import { useState, useEffect, useCallback } from 'react'
import { getAlerts, getStats } from '../services/api'
import StatsPanel from '../components/StatsPanel'
import AlertTable from '../components/AlertTable'
import AlertDetail from '../components/AlertDetail'

export default function Dashboard({ onLogout }) {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attackFilter, setAttackFilter] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const params = {}
      if (attackFilter) params.attack_type = attackFilter
      const [alertsRes, statsRes] = await Promise.all([
        getAlerts(params),
        getStats()
      ])
      setAlerts(alertsRes.data)
      setStats(statsRes.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [attackFilter])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* navbar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">xIDS</h1>
          <span className="text-gray-500 text-sm">Explainable Intrusion Detection</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-gray-400 text-xs">Live</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* stats */}
        {loading ? (
          <div className="text-gray-500 text-sm mb-6">Loading...</div>
        ) : (
          <StatsPanel stats={stats} />
        )}

        {/* filters */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Alerts</h2>
          <div className="flex items-center gap-3">
            <select
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              value={attackFilter}
              onChange={e => setAttackFilter(e.target.value)}
            >
              <option value="">All attack types</option>
              <option value="DDoS">DDoS</option>
              <option value="Port Scanning">Port Scanning</option>
              <option value="Brute Force">Brute Force</option>
              <option value="Web Attacks">Web Attacks</option>
              <option value="Bots">Bots</option>
              <option value="DoS">DoS</option>
            </select>
            <button
              onClick={fetchData}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* table */}
        <AlertTable alerts={alerts} onSelect={setSelected} />
      </div>

      {/* detail modal */}
      {selected && (
        <AlertDetail
          alert={selected}
          onClose={() => setSelected(null)}
          onFeedbackSubmit={() => {
            fetchData()
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
