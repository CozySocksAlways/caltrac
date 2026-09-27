import type { Entry, Settings } from './types'

type GitHubSettings = Pick<Settings, 'githubToken' | 'dataRepoOwner' | 'dataRepoName'>

function apiBase(settings: GitHubSettings): string {
  return `https://api.github.com/repos/${settings.dataRepoOwner}/${settings.dataRepoName}`
}

function headers(settings: GitHubSettings): HeadersInit {
  return {
    Authorization: `Bearer ${settings.githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export function pathForDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `data/${y}/${m}/${d}.json`
}

function b64EncodeUnicode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function b64DecodeUnicode(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface GetFileResult {
  entries: Entry[]
  sha: string | null
}

export async function getDayFile(path: string, settings: GitHubSettings): Promise<GetFileResult> {
  const res = await fetch(`${apiBase(settings)}/contents/${path}`, {
    headers: headers(settings),
  })

  if (res.status === 404) {
    return { entries: [], sha: null }
  }
  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status}): ${await res.text().catch(() => '')}`)
  }

  const data = await res.json()
  const content = b64DecodeUnicode(data.content as string)
  const entries: Entry[] = content.trim() ? JSON.parse(content) : []
  return { entries, sha: data.sha as string }
}

export async function putDayFile(
  path: string,
  entries: Entry[],
  sha: string | null,
  message: string,
  settings: GitHubSettings,
): Promise<void> {
  const content = b64EncodeUnicode(JSON.stringify(entries, null, 2) + '\n')
  const res = await fetch(`${apiBase(settings)}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(settings), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status}): ${await res.text().catch(() => '')}`)
  }
}

export async function appendEntry(date: Date, entry: Entry, settings: GitHubSettings): Promise<void> {
  const path = pathForDate(date)
  const { entries, sha } = await getDayFile(path, settings)
  entries.push(entry)
  entries.sort((a, b) => a.time.localeCompare(b.time))
  await putDayFile(path, entries, sha, `Log: ${entry.description} (${entry.calories} kcal)`, settings)
}

export async function updateEntry(date: Date, entry: Entry, settings: GitHubSettings): Promise<void> {
  const path = pathForDate(date)
  const { entries, sha } = await getDayFile(path, settings)
  const idx = entries.findIndex((e) => e.id === entry.id)
  if (idx === -1) throw new Error('Entry not found')
  entries[idx] = entry
  entries.sort((a, b) => a.time.localeCompare(b.time))
  await putDayFile(path, entries, sha, `Edit: ${entry.description}`, settings)
}

export async function deleteEntry(date: Date, entryId: string, settings: GitHubSettings): Promise<void> {
  const path = pathForDate(date)
  const { entries, sha } = await getDayFile(path, settings)
  const remaining = entries.filter((e) => e.id !== entryId)
  if (remaining.length === entries.length) throw new Error('Entry not found')
  await putDayFile(path, remaining, sha, 'Delete entry', settings)
}
