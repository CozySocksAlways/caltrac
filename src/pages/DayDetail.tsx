import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { deleteEntry, getDayFile, pathForDate, updateEntry } from '../lib/github'
import { loadSettings, isConfigured } from '../lib/settings'
import type { Entry } from '../lib/types'

function parseDateParam(param: string): Date | null {
  const match = param.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export default function DayDetail() {
  const { date: dateParam } = useParams<{ date: string }>()
  const settings = loadSettings()
  const date = dateParam ? parseDateParam(dateParam) : null

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ description: string; calories: number } | null>(null)

  useEffect(() => {
    if (!date || !isConfigured(settings)) return
    setLoading(true)
    getDayFile(pathForDate(date), settings)
      .then(({ entries }) => setEntries(entries))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam])

  if (!isConfigured(settings)) {
    return (
      <div className="empty-state">
        <p>Set up your LLM and data repo first.</p>
        <Link to="/setup">Go to Setup</Link>
      </div>
    )
  }

  if (!date) {
    return <div className="error-banner">Invalid date.</div>
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setDraft({ description: entry.description, calories: entry.calories })
  }

  async function saveEdit(entry: Entry) {
    if (!draft || !date) return
    setBusyId(entry.id)
    setError(null)
    try {
      const updated: Entry = { ...entry, description: draft.description, calories: draft.calories }
      await updateEntry(date, updated, settings)
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)))
      setEditingId(null)
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(entry: Entry) {
    if (!date) return
    setBusyId(entry.id)
    setError(null)
    try {
      await deleteEntry(date, entry.id, settings)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const total = entries.reduce((sum, e) => sum + e.calories, 0)

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && entries.length === 0 && <div className="empty-state">No entries logged this day.</div>}

      {!loading && entries.length > 0 && (
        <>
          <div className="card">
            {entries.map((entry) =>
              editingId === entry.id && draft ? (
                <div key={entry.id} className="entry-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div className="field">
                    <input
                      type="text"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <input
                      type="number"
                      value={draft.calories}
                      onChange={(e) => setDraft({ ...draft, calories: Number(e.target.value) })}
                    />
                  </div>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingId(null)
                        setDraft(null)
                      }}
                    >
                      Cancel
                    </button>
                    <button type="button" className="btn" onClick={() => saveEdit(entry)} disabled={busyId === entry.id}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div key={entry.id} className="entry-row">
                  <span className="entry-time">{entry.time}</span>
                  <span className="entry-desc">{entry.description}</span>
                  <span className="entry-cal">{entry.calories}</span>
                  <button type="button" className="icon-btn" onClick={() => startEdit(entry)} aria-label="Edit">
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleDelete(entry)}
                    disabled={busyId === entry.id}
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              ),
            )}
          </div>
          <p style={{ marginTop: 12, fontWeight: 600 }}>Total: {total} kcal</p>
        </>
      )}
    </div>
  )
}
