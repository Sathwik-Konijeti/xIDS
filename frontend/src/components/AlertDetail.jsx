import { useState } from 'react'
import ShapChart from './ShapChart'
import { submitFeedback } from '../services/api'

const TIER_COLORS = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-red-400' }
const ATTACK_COLORS = {
  DDoS: 'bg-red-900 text-red-200',
  'Port Scanning': 'bg-yellow-900 text-yellow-200',
  'Brute Force': 'bg-orange-900 text-orange-200',
  'Web Attacks': 'bg-purple-900 text-purple-200',
  Bots: 'bg-pink-900 text-pink-200',
  DoS: 'bg-red-900 text-red-200',
  benign: 'bg-green-900 text-green-200',
}

export default function AlertDetail({ alert, onClose, onFeedbackSubmit }) {
  const [verdict, setVerdict] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFeedback = async () => {
    if (!verdict) return
    setSubmitting(true)
    try {
      await submitFeedback(alert.id, verdict, comment)
      setSubmitted(true)
      onFeedbackSubmit?.()
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const attackColor = ATTACK_COLORS[alert.attack_type] || 'bg-gray-800 text-gray-200'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${attackColor}`}>
              {alert.attack_type}
            </span>
            <span className="text-gray-400 text-sm">Alert #{alert.id}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* scores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Confidence</p>
              <p className="text-white font-bold">{(alert.confidence_score * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Anomaly Score</p>
              <p className="text-white font-bold">{alert.anomaly_score.toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Tier Reached</p>
              <p className={`font-bold ${TIER_COLORS[alert.tier_reached]}`}>
                Tier {alert.tier_reached}
              </p>
            </div>
          </div>

          {/* IPs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Source IP</p>
              <p className="text-white font-mono text-sm">{alert.source_ip || '—'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Destination IP</p>
              <p className="text-white font-mono text-sm">{alert.destination_ip || '—'}</p>
            </div>
          </div>

          {/* timestamp */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Timestamp</p>
            <p className="text-white text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
          </div>

          {/* shap */}
          {alert.top_shap_features && <ShapChart features={alert.top_shap_features} />}

          {/* llm explanation */}
          {alert.llm_explanation && (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">AI Explanation</p>
              <p className="text-gray-200 text-sm leading-relaxed">{alert.llm_explanation}</p>
            </div>
          )}

          {/* feedback */}
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Analyst Feedback</p>
            {submitted || alert.analyst_feedback ? (
              <p className="text-green-400 text-sm">
                ✓ {alert.analyst_feedback?.verdict?.toUpperCase() || 'Feedback submitted'}
                {alert.analyst_feedback?.comment && ` — ${alert.analyst_feedback.comment}`}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['tp', 'fp', 'suspicious'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVerdict(v)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        verdict === v
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Optional comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <button
                  onClick={handleFeedback}
                  disabled={!verdict || submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
