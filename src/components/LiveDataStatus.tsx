import { PARTNERS } from '../domain/eligibility'
import type { LiveCharityData } from '../lib/liveCharityData'

interface LiveDataStatusProps {
  data: LiveCharityData
  compact?: boolean
}

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })

export function LiveDataStatus({ data, compact = false }: LiveDataStatusProps) {
  const count = Object.keys(data.profiles).length
  const isLive = data.status === 'live'
  const label = data.status === 'loading'
    ? 'Syncing live records'
    : isLive
      ? `${count} live records synced`
      : data.status === 'partial'
        ? `${count} of ${PARTNERS.length} records synced`
        : 'Live source unavailable'

  if (compact) {
    return (
      <div className={`live-chip is-${data.status}`} role="status" aria-live="polite">
        <span className="live-dot" aria-hidden="true" />
        <span><strong>{label}</strong>{data.fetchedAt ? <small>{timeFormatter.format(data.fetchedAt)}</small> : null}</span>
        <button type="button" onClick={data.refresh} disabled={data.status === 'loading'} aria-label="Refresh live nonprofit records">↻</button>
      </div>
    )
  }

  return (
    <section className="source-card" aria-labelledby="source-title" aria-busy={data.status === 'loading'}>
      <header>
        <div>
          <p className="eyebrow">Live source</p>
          <h3 id="source-title">Nonprofit registry</h3>
        </div>
        <span className={`source-state is-${data.status}`}><span aria-hidden="true" />{label}</span>
      </header>

      <p className="source-intro">
        RescueRelay is requesting current organization and filing records by EIN from ProPublica’s IRS-derived API.
      </p>

      <ul className="source-list">
        {PARTNERS.map((partner) => {
          const profile = data.profiles[partner.id]
          return (
            <li key={partner.id}>
              <span className={`source-check ${profile ? 'is-ready' : ''}`} aria-hidden="true">{profile ? '✓' : '·'}</span>
              <div>
                <strong>{partner.name}</strong>
                {profile ? (
                  <small>{profile.taxStatus} · EIN {profile.ein} · latest filing {profile.latestFilingYear ?? 'not listed'}</small>
                ) : (
                  <small>{data.status === 'loading' ? 'Request in progress…' : 'Live record did not load'}</small>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {data.error ? <p className="source-error" role="alert">{data.error}</p> : null}
      <div className="source-actions">
        <button className="button button-secondary" type="button" onClick={data.refresh} disabled={data.status === 'loading'}>
          {data.status === 'loading' ? 'Refreshing…' : 'Refresh live records'}
        </button>
        <a href="https://projects.propublica.org/nonprofits/api/" target="_blank" rel="noreferrer">Read the API documentation</a>
      </div>
      <details className="plain-disclosure">
        <summary>What is live, and what is simulated?</summary>
        <p><strong>Live:</strong> registered names, addresses, tax classification, and filing data. <strong>Sourced rules:</strong> food type and pickup guidance from each organization’s published materials. <strong>Simulated:</strong> sending and accepting the final reservation. No charity is contacted.</p>
      </details>
    </section>
  )
}
