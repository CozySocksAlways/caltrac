import type { Settings } from './types'

const STORAGE_KEY = 'caltrac.settings'

const EMPTY_SETTINGS: Settings = {
  llmBaseUrl: '',
  llmApiKey: '',
  llmModel: '',
  githubToken: '',
  dataRepoOwner: '',
  dataRepoName: '',
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SETTINGS }
    return { ...EMPTY_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function isConfigured(settings: Settings): boolean {
  return Boolean(
    settings.llmBaseUrl &&
      settings.llmApiKey &&
      settings.llmModel &&
      settings.githubToken &&
      settings.dataRepoOwner &&
      settings.dataRepoName,
  )
}
