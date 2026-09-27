export interface Macros {
  protein: number
  carbs: number
  fat: number
}

export interface Entry {
  id: string
  time: string // HH:MM
  description: string
  calories: number
  macros?: Macros
  source: 'text'
}

export interface Settings {
  llmBaseUrl: string
  llmApiKey: string
  llmModel: string
  githubToken: string
  dataRepoOwner: string
  dataRepoName: string
}

export interface CalorieEstimate {
  calories: number
  macros?: Macros
  notes?: string
}
