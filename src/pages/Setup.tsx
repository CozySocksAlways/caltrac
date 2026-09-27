import { useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import type { Settings } from '../lib/types'

export default function Setup() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveSettings(settings)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSave}>
      <p className="muted" style={{ marginBottom: 16 }}>
        These values are stored only on this device (localStorage). The GitHub token needs
        read/write access to the data repo below.
      </p>

      <div className="field">
        <label htmlFor="llmBaseUrl">LLM base URL</label>
        <input
          id="llmBaseUrl"
          type="url"
          placeholder="https://api.openai.com/v1"
          value={settings.llmBaseUrl}
          onChange={(e) => update('llmBaseUrl', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="llmApiKey">LLM API key</label>
        <input
          id="llmApiKey"
          type="password"
          value={settings.llmApiKey}
          onChange={(e) => update('llmApiKey', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="llmModel">LLM model</label>
        <input
          id="llmModel"
          type="text"
          placeholder="gpt-4o-mini"
          value={settings.llmModel}
          onChange={(e) => update('llmModel', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="dataRepoOwner">Data repo owner</label>
        <input
          id="dataRepoOwner"
          type="text"
          placeholder="your-github-username"
          value={settings.dataRepoOwner}
          onChange={(e) => update('dataRepoOwner', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="dataRepoName">Data repo name</label>
        <input
          id="dataRepoName"
          type="text"
          placeholder="caltrac-data"
          value={settings.dataRepoName}
          onChange={(e) => update('dataRepoName', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="githubToken">GitHub token</label>
        <input
          id="githubToken"
          type="password"
          value={settings.githubToken}
          onChange={(e) => update('githubToken', e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn">
        Save
      </button>
      {saved && <p className="muted" style={{ marginTop: 8 }}>Saved.</p>}
    </form>
  )
}
