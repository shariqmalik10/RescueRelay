import { useEffect, useRef, useState } from 'react'
import { PARTNERS } from '../domain/eligibility'
import type { DemoState, ResponseDraft } from '../domain/types'
import type { RescueActions } from '../lib/actions'
import { AppError } from '../lib/demoStore'
import type { LiveCharityData } from '../lib/liveCharityData'

interface RecipientWorkspaceProps {
  state: DemoState
  actions: RescueActions
  liveData: LiveCharityData
  onSwitchToDonor: () => void
}

function flowKey(state: DemoState) {
  if (!state.reservation || state.reservation.status === 'prepared') return 'waiting'
  if (state.reservation.status === 'sent' && !state.reservation.responseDraft) return 'review'
  if (state.reservation.status === 'sent') return 'confirm'
  return state.reservation.status
}

export function RecipientWorkspace({ state, actions, liveData, onSwitchToDonor }: RecipientWorkspaceProps) {
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const previousFlow = useRef(flowKey(state))
  const resultRef = useRef<HTMLDivElement>(null)
  const reservation = state.reservation
  const offer = state.offer
  const fallbackPartner = PARTNERS[0]!
  const partner = (reservation ? PARTNERS.find((item) => item.id === reservation.partnerId) : fallbackPartner) ?? fallbackPartner
  const liveProfile = partner ? liveData.profiles[partner.id] : undefined
  const visible = Boolean(reservation && reservation.status !== 'prepared' && offer && partner)

  useEffect(() => {
    const next = flowKey(state)
    if (next === previousFlow.current) return
    previousFlow.current = next
    const messages: Record<string, string> = {
      review: 'A simulated handoff is ready to review.',
      confirm: 'Response prepared. Confirm it to complete the demo.',
      accepted: 'The simulated handoff was accepted.',
      declined: 'The simulated handoff was declined.',
      waiting: 'Waiting for the donor to send a handoff.',
    }
    setAnnouncement(messages[next] ?? '')
    window.requestAnimationFrame(() => resultRef.current?.focus())
  }, [state])

  const guard = async (pending: string, operation: () => unknown | Promise<unknown>) => {
    if (working) return
    try {
      setWorking(true)
      setError('')
      setAnnouncement(pending)
      await operation()
    } catch (caught) {
      const message = caught instanceof AppError ? `${caught.message} ${caught.recovery}` : 'Unable to complete this action. Check the connection and try again.'
      setError(message)
      setAnnouncement(message)
    } finally {
      setWorking(false)
    }
  }

  const prepare = (response: ResponseDraft) => {
    if (reservation) void guard(`Preparing ${response === 'accept' ? 'acceptance' : 'decline'}…`, () => actions.prepareResponse(reservation.id, response))
  }

  if (!visible || !reservation || !offer || !partner) {
    const progress = !state.offer
      ? ['No offer yet', 'The donor needs to record a surplus batch before matching can begin.']
      : !state.matchEvaluatedAt
        ? ['Offer saved', 'The donor still needs to compare the offer with recipient rules.']
        : !state.reservation
          ? ['Recipients checked', 'The donor still needs to choose a compatible recipient.']
          : ['Handoff prepared', 'The handoff remains private until the donor sends it.']

    return (
      <section className="workspace recipient-waiting" aria-labelledby="waiting-title">
        <p className="sr-status" role="status" aria-live="polite">{announcement}</p>
        <div className="waiting-card">
          <div className="waiting-visual" aria-hidden="true"><span>↙</span></div>
          <div>
            <p className="eyebrow">Recipient inbox</p>
            <h2 id="waiting-title">No handoff to review yet</h2>
            <p>Only a handoff deliberately sent by the donor appears here. Prepared drafts stay private.</p>
            <div className="waiting-state"><span aria-hidden="true">○</span><div><strong>{progress[0]}</strong><small>{progress[1]}</small></div></div>
            <button className="button button-secondary" type="button" onClick={onSwitchToDonor}>Open donor workspace</button>
          </div>
        </div>
        <aside className="recipient-org-card">
          <p className="eyebrow">Demo recipient</p>
          <h2>{partner.name}</h2>
          {liveProfile ? <><span className="source-state is-live"><span aria-hidden="true" />Live registry record</span><p>{liveProfile.address}, {liveProfile.city}, {liveProfile.state} {liveProfile.postalCode}</p><dl><div><dt>Tax status</dt><dd>{liveProfile.taxStatus}</dd></div><div><dt>EIN</dt><dd>{liveProfile.ein}</dd></div><div><dt>Latest filing</dt><dd>{liveProfile.latestFilingYear ?? 'Not listed'}</dd></div></dl></> : <p>{liveData.status === 'loading' ? 'Loading the live nonprofit profile…' : 'The live record is temporarily unavailable.'}</p>}
          <a href={partner.registryUrl} target="_blank" rel="noreferrer">Open the public registry record</a>
        </aside>
      </section>
    )
  }

  const responseLabel = reservation.responseDraft === 'accept' ? 'acceptance' : 'decline'

  return (
    <section className="workspace" aria-label="Recipient handoff flow" aria-busy={working} ref={resultRef} tabIndex={-1}>
      <p className="sr-status" role="status" aria-live="polite">{announcement}</p>

      <section className="recipient-brief" aria-labelledby="brief-title">
        <header>
          <div><p className="eyebrow">From Cedar Events</p><h2 id="brief-title">{offer.quantity} meals for {partner.name}</h2><p>Review the donor-declared food and pickup details before responding.</p></div>
          <span className={`status status-${reservation.status}`}>{reservation.status === 'sent' ? 'Awaiting response' : reservation.status === 'accepted' ? 'Accepted' : 'Declined'}</span>
        </header>
        <div className="recipient-summary">
          <div className="quantity-block"><strong>{offer.quantity}</strong><span>sealed meals</span></div>
          <dl><div><dt>Food type</dt><dd>Vegetarian prepared meals</dd></div><div><dt>Storage</dt><dd>Chilled</dd></div><div><dt>Allergens</dt><dd>Dairy labels attached</dd></div><div><dt>Pickup</dt><dd>{offer.pickupStart}–{offer.pickupEnd}</dd></div></dl>
        </div>
        <div className="recipient-source"><span className={liveProfile ? 'is-live' : ''} aria-hidden="true">{liveProfile ? '✓' : '·'}</span><div><strong>{liveProfile ? 'Recipient identity checked against live registry data' : 'Using the published recipient profile'}</strong><small>{liveProfile ? `${liveProfile.legalName} · EIN ${liveProfile.ein}` : `EIN ${partner.ein}`}</small></div><a href={partner.registryUrl} target="_blank" rel="noreferrer">View source</a></div>
        <p className="handling-note"><span aria-hidden="true">i</span>Food details are donor-declared. The recipient remains responsible for inspection and real-world acceptance.</p>
      </section>

      {reservation.status === 'sent' && !reservation.responseDraft ? (
        <section className="decision-card" aria-labelledby="decision-title">
          <header><div><p className="eyebrow">Recipient decision</p><h2 id="decision-title">Prepare a response</h2><p>Nothing is final until the next review step.</p></div><span className="status status-prepared">Human review</span></header>
          <div className="decision-options">
            <button type="button" disabled={working} onClick={() => prepare('accept')}><span className="decision-icon accept" aria-hidden="true">✓</span><span><strong>{working ? 'Preparing…' : 'Prepare acceptance'}</strong><small>Pickup details work for this team</small></span><span aria-hidden="true">→</span></button>
            <button type="button" disabled={working} onClick={() => prepare('decline')}><span className="decision-icon decline" aria-hidden="true">—</span><span><strong>{working ? 'Preparing…' : 'Prepare decline'}</strong><small>Close this handoff without accepting</small></span><span aria-hidden="true">→</span></button>
          </div>
        </section>
      ) : null}

      {reservation.status === 'sent' && reservation.responseDraft ? (
        <section className="handoff-card is-prepared" aria-labelledby="confirm-title">
          <header><div><p className="eyebrow">Human checkpoint</p><h2 id="confirm-title">Confirm {responseLabel}</h2><p>Review the response before recording it in both workspaces.</p></div><span className="status status-prepared">Draft only</span></header>
          <dl className="review-grid"><div><dt>Response</dt><dd>{reservation.responseDraft === 'accept' ? 'Accept handoff' : 'Decline handoff'}</dd></div><div><dt>Donor</dt><dd>{offer.donorName}</dd></div><div><dt>Quantity</dt><dd>{offer.quantity} meals</dd></div><div><dt>Pickup</dt><dd>{offer.pickupStart}–{offer.pickupEnd}</dd></div></dl>
          <div className="simulation-note"><span aria-hidden="true">i</span><p><strong>Demo boundary</strong>This records a simulated response only. No organization is contacted.</p></div>
          <button className="button button-confirm" disabled={working} onClick={() => void guard('Recording the simulated response…', () => actions.confirmResponse())}>{working ? 'Recording…' : `Confirm simulated ${responseLabel}`} <span aria-hidden="true">→</span></button>
        </section>
      ) : null}

      {reservation.status === 'accepted' || reservation.status === 'declined' ? (
        <section className={`completion-card is-${reservation.status}`} aria-labelledby="complete-title"><span className="completion-mark" aria-hidden="true">{reservation.status === 'accepted' ? '✓' : '—'}</span><div><p className="eyebrow">Demo complete</p><h2 id="complete-title">Handoff {reservation.status}</h2><p>The response now appears in both donor and recipient workspaces.</p><dl><div><dt>Reference</dt><dd>{reservation.id}</dd></div><div><dt>Recorded</dt><dd>{new Date(reservation.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</dd></div></dl></div></section>
      ) : null}

      {error ? <p className="error-message" role="alert">{error}</p> : null}
    </section>
  )
}
