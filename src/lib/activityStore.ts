import type { ToolActivityRecord } from '../domain/types'

const cache = new Map<string, { raw: string | null; activity: ToolActivityRecord | null }>()
const storageKey = (sessionId: string) => `rescuerelay:${sessionId}:tool-activity`
const eventName = (sessionId: string) => `rescuerelay:${sessionId}:tool-activity-change`

export function getToolActivity(sessionId: string): ToolActivityRecord | null {
  const raw = localStorage.getItem(storageKey(sessionId))
  const cached = cache.get(sessionId)
  if (cached?.raw === raw) return cached.activity

  const activity = raw ? (JSON.parse(raw) as ToolActivityRecord) : null
  cache.set(sessionId, { raw, activity })
  return activity
}

export function recordToolActivity(sessionId: string, activity: ToolActivityRecord) {
  const raw = JSON.stringify(activity)
  localStorage.setItem(storageKey(sessionId), raw)
  cache.set(sessionId, { raw, activity })
  window.dispatchEvent(new Event(eventName(sessionId)))
}

export function clearToolActivity(sessionId: string) {
  localStorage.removeItem(storageKey(sessionId))
  cache.delete(sessionId)
  window.dispatchEvent(new Event(eventName(sessionId)))
}

export function subscribeToToolActivity(sessionId: string, listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(sessionId)) listener()
  }
  window.addEventListener(eventName(sessionId), listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(eventName(sessionId), listener)
    window.removeEventListener('storage', onStorage)
  }
}
