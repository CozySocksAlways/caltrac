import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDayFile, pathForDate } from '../lib/github'
import { loadSettings, isConfigured } from '../lib/settings'

interface DaySummary {
  date: Date
  total: number
  count: number
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const settings = loadSettings()
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [days, setDays] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured(settings)) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
    const today = new Date()
    const isCurrentMonth =
      today.getFullYear() === monthStart.getFullYear() && today.getMonth() === monthStart.getMonth()
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth

    const dates = Array.from({ length: lastDay }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1))

    Promise.all(
      dates.map(async (date) => {
        const { entries } = await getDayFile(pathForDate(date), settings)
        const total = entries.reduce((sum, e) => sum + e.calories, 0)
        return { date, total, count: entries.length }
      }),
    )
      .then((results) => {
        if (cancelled) return
        setDays(results.filter((d) => d.count > 0).sort((a, b) => b.date.getTime() - a.date.getTime()))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart.getFullYear(), monthStart.getMonth()])

  if (!isConfigured(settings)) {
    return (
      <div className="empty-state">
        <p>Set up your LLM and data repo to see your dashboard.</p>
        <Link to="/setup" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Go to Setup
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="btn-row" style={{ alignItems: 'center', marginBottom: 12 }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        >
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>{monthLabel(monthStart)}</div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          →
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && days.length === 0 && !error && <div className="empty-state">No entries this month.</div>}

      {!loading &&
        days.map((d) => (
          <Link key={dayKey(d.date)} to={`/day/${dayKey(d.date)}`} className="day-row">
            <span>{d.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span>
              <strong>{d.total}</strong> <span className="muted">kcal · {d.count} entries</span>
            </span>
          </Link>
        ))}
    </div>
  )
}
