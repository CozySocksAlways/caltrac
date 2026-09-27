import { useState } from 'react'
import { Link } from 'react-router-dom'
import { estimateCalories } from '../lib/llm'
import { appendEntry } from '../lib/github'
import { loadSettings, isConfigured } from '../lib/settings'
import type { CalorieEstimate, Entry } from '../lib/types'

type Status = 'idle' | 'estimating' | 'reviewing' | 'saving' | 'saved'

export default function Log() {
  const settings = loadSettings()
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isConfigured(settings)) {
    return (
      <div className="empty-state">
        <p>Set up your LLM and data repo before logging a meal.</p>
        <Link to="/setup" className="btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Go to Setup
        </Link>
      </div>
    )
  }

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setError(null)
    setStatus('estimating')
    try {
      const result = await estimateCalories(description.trim(), settings)
      setEstimate(result)
      setStatus('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('idle')
    }
  }

  async function handleConfirm() {
    if (!estimate) return
    setError(null)
    setStatus('saving')
    try {
      const now = new Date()
      const entry: Entry = {
        id: crypto.randomUUID(),
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        description: description.trim(),
        calories: estimate.calories,
        macros: estimate.macros,
        source: 'text',
      }
      await appendEntry(now, entry, settings)
      setStatus('saved')
      setDescription('')
      setEstimate(null)
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('reviewing')
    }
  }

  function updateEstimate<K extends keyof CalorieEstimate>(key: K, value: CalorieEstimate[K]) {
    setEstimate((e) => (e ? { ...e, [key]: value } : e))
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {status !== 'reviewing' && status !== 'saving' && (
        <form onSubmit={handleEstimate}>
          <div className="field">
            <label htmlFor="description">What did you eat?</label>
            <textarea
              id="description"
              placeholder="e.g. chicken salad with olive oil dressing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn" disabled={!description.trim() || status === 'estimating'}>
            {status === 'estimating' ? 'Estimating…' : 'Estimate calories'}
          </button>
        </form>
      )}

      {estimate && (status === 'reviewing' || status === 'saving') && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="muted" style={{ marginTop: 0 }}>{description}</p>

          <div className="field">
            <label htmlFor="calories">Calories</label>
            <input
              id="calories"
              type="number"
              value={estimate.calories}
              onChange={(e) => updateEstimate('calories', Number(e.target.value))}
            />
          </div>

          {estimate.macros && (
            <div className="field">
              <label>Macros (g)</label>
              <div className="btn-row">
                <input
                  type="number"
                  aria-label="Protein"
                  value={estimate.macros.protein}
                  onChange={(e) =>
                    updateEstimate('macros', { ...estimate.macros!, protein: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  aria-label="Carbs"
                  value={estimate.macros.carbs}
                  onChange={(e) =>
                    updateEstimate('macros', { ...estimate.macros!, carbs: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  aria-label="Fat"
                  value={estimate.macros.fat}
                  onChange={(e) => updateEstimate('macros', { ...estimate.macros!, fat: Number(e.target.value) })}
                />
              </div>
              <p className="muted">protein / carbs / fat</p>
            </div>
          )}

          {estimate.notes && <p className="muted">{estimate.notes}</p>}

          <div className="btn-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStatus('idle')
                setEstimate(null)
              }}
              disabled={status === 'saving'}
            >
              Back
            </button>
            <button type="button" className="btn" onClick={handleConfirm} disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Confirm & log'}
            </button>
          </div>
        </div>
      )}

      {status === 'saved' && <p className="muted" style={{ marginTop: 12 }}>Logged.</p>}
    </div>
  )
}
