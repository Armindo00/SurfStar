const PREFIX = 'surfstar-seen'

function storageKey(userKey: string, domain: string): string {
  return `${PREFIX}:${userKey}:${domain}`
}

export function loadSeenIds(userKey: string, domain: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userKey, domain))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function markSeenIds(userKey: string, domain: string, ids: string[]): void {
  if (ids.length === 0) return
  const seen = loadSeenIds(userKey, domain)
  for (const id of ids) seen.add(id)
  try {
    localStorage.setItem(storageKey(userKey, domain), JSON.stringify([...seen]))
  } catch {
    /* ignore quota errors */
  }
}

export function countUnseen<T extends { id: string }>(items: T[], userKey: string, domain: string): number {
  if (items.length === 0) return 0
  const seen = loadSeenIds(userKey, domain)
  return items.filter((item) => !seen.has(item.id)).length
}

export function countUnseenIds(ids: string[], userKey: string, domain: string): number {
  if (ids.length === 0) return 0
  const seen = loadSeenIds(userKey, domain)
  return ids.filter((id) => !seen.has(id)).length
}
