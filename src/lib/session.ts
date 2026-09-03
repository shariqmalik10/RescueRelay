const SESSION_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/

export function ensureSessionId(): string {
  const url = new URL(window.location.href)
  const existing = url.searchParams.get('session')

  if (existing && SESSION_PATTERN.test(existing)) return existing

  const created = crypto.randomUUID().replaceAll('-', '').slice(0, 16)
  url.searchParams.set('session', created)
  window.history.replaceState({}, '', url)
  return created
}
