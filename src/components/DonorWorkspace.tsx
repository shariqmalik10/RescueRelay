import { useEffect, useRef, useState } from 'react'
import { findEligiblePartners, PARTNERS, REASON_EXPLANATIONS } from '../domain/eligibility'
import type { DemoState, OfferInput, Partner } from '../domain/types'
import type { RescueActions } from '../lib/actions'
import { AppError, DEFAULT_OFFER } from '../lib/demoStore'
import type { LiveCharityData, LiveCharityProfile } from '../lib/liveCharityData'
import { LiveDataStatus } from './LiveDataStatus'

type FieldName = 'quantity' | 'pickupEnd' | 'handling' | 'allergens'

interface DonorWorkspaceProps {
  state: DemoState
  actions: RescueActions
  liveData: LiveCharityData
}

const moneyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function validateDraft(form: OfferInput) {
  const errors: Partial<Record<FieldName, string>> = {}
  if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 500) errors.quantity = 'Enter a whole number from 1 to 500.'
  if (form.pickupStart >= form.pickupEnd) errors.pickupEnd = 'Choose an end time later than the start time.'
  if (!form.handlingDeclarationAccepted) errors.handling = 'Acknowledge that these are donor-declared facts.'
  if (form.allergenInformationPresent && form.allergens.length === 0) errors.allergens = 'Add the declared allergen information.'
  return errors
}

function workflowKey(state: DemoState) {
  if (!state.offer) return 'offer'
  if (!state.matchEvaluatedAt && !state.reservation) return 'match'
  if (!state.reservation) return 'partner'
  return state.reservation.status
}

function LiveProfile({ partner, profile }: { partner: Partner; profile?: LiveCharityProfile }) {
  return (
    <div className="live-profile">
      <span className={`live-profile-mark ${profile ? 'is-live' : ''}`} aria-hidden="true">{profile ? '✓' : '·'}</span>
      <div>
        <span className="profile-label">{profile ? 'Live registry record' : 'Published profile'}</span>
        <strong>{profile ? `${profile.address}, ${profile.city}, ${profile.state}` : `${partner.address}, ${partner.city}, ${partner.state}`}</strong>
        <small>{profile ? `${profile.taxStatus} · EIN ${profile.ein} · NTEE ${profile.nteeCode}` : `EIN ${partner.ein}`}</small>
      </div>
      {profile ? <span className="filing-stat"><small>Latest filing</small><strong>{profile.latestFilingYear ?? '—'}</strong>{typeof profile.latestRevenue === 'number' ? <small>{moneyFormatter.format(profile.latestRevenue)} revenue</small> : null}</span> : null}
    </div>
  )
}

export function DonorWorkspace({ state, actions, liveData }: DonorWorkspaceProps) {
  const [form, setForm] = useState<OfferInput>(state.offer ?? DEFAULT_OFFER)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const previousWorkflow = useRef(workflowKey(state))
  const resultRef = useRef<HTMLDivElement>(null)
  const showMatches = Boolean(state.offer && (state.matchEvaluatedAt || state.reservation))
  const results = state.offer ? findEligiblePartners(state.offer) : null
  const selectedPartner = state.reservation ? PARTNERS.find((partner) => partner.id === state.reservation?.partnerId) : undefined

  useEffect(() => {
    const next = workflowKey(state)
    if (next === previousWorkflow.current) return
    previousWorkflow.current = next
    const messages: Record<string, string> = {
      match: 'Offer recorded. Live recipient records are ready to compare.',
      partner: 'Compatibility check complete. One recipient is a preliminary fit.',
      prepared: 'Handoff prepared. Review it before the simulated send.',
      sent: 'Simulated handoff sent. Open the recipient workspace to continue.',
      accepted: 'The recipient accepted the simulated handoff.',
      declined: 'The recipient declined the simulated handoff.',
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

  const submitOffer = () => {
    const errors = validateDraft(form)
    setFieldErrors(errors)
    const firstInvalid = (['quantity', 'pickupEnd', 'allergens', 'handling'] as FieldName[]).find((field) => errors[field])
    if (firstInvalid) {
      const id = firstInvalid === 'pickupEnd' ? 'pickup-end' : firstInvalid === 'quantity' ? 'quantity' : `${firstInvalid}-declaration`
      setAnnouncement('Check the highlighted offer details and try again.')
      window.requestAnimationFrame(() => document.getElementById(id)?.focus())
      return
    }
    void guard('Recording the surplus offer…', () => actions.createOffer(form))
  }

  const clearError = (field: FieldName) => setFieldErrors((current) => ({ ...current, [field]: undefined }))

  return (
    <section className="workspace" aria-label="Donor handoff flow" aria-busy={working}>
      <p className="sr-status" role="status" aria-live="polite">{announcement}</p>

      {!state.offer ? (
        <div className="workspace-grid">
          <section className="flow-card" aria-labelledby="offer-title">
            <header className="card-heading">
              <span className="step-number">1</span>
              <div><p className="eyebrow">Surplus details</p><h2 id="offer-title">What is ready for pickup?</h2><p>Start with the facts a recipient needs to make a safe decision.</p></div>
            </header>

            {Object.values(fieldErrors).some(Boolean) ? (
              <div className="error-summary" role="alert"><strong>Check the offer details</strong><p>{Object.values(fieldErrors).filter(Boolean).join(' ')}</p></div>
            ) : null}

            <form className="offer-form" noValidate onSubmit={(event) => { event.preventDefault(); submitOffer() }}>
              <div className="field field-wide">
                <label htmlFor="meal-category">Food type</label>
                <select id="meal-category" value={form.mealCategory} onChange={(event) => setForm({ ...form, mealCategory: event.target.value })}>
                  <option value="vegetarian-prepared-meals">Vegetarian prepared meals</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="quantity">Quantity</label>
                <div className="input-with-unit"><input id="quantity" name="quantity" type="number" min="1" max="500" value={form.quantity} aria-invalid={Boolean(fieldErrors.quantity)} aria-describedby={fieldErrors.quantity ? 'quantity-error' : undefined} onChange={(event) => { setForm({ ...form, quantity: Number(event.target.value) }); clearError('quantity') }} /><span>meals</span></div>
                {fieldErrors.quantity ? <span className="field-error" id="quantity-error">{fieldErrors.quantity}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="storage">Storage</label>
                <select id="storage" value={form.storageMode} onChange={(event) => setForm({ ...form, storageMode: event.target.value as OfferInput['storageMode'] })}>
                  <option value="chilled">Chilled</option><option value="hot">Hot</option><option value="ambient">Room temperature</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="pickup-start">Pickup starts</label>
                <input id="pickup-start" name="pickup-start" type="time" value={form.pickupStart} onChange={(event) => setForm({ ...form, pickupStart: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="pickup-end">Pickup ends</label>
                <input id="pickup-end" name="pickup-end" type="time" value={form.pickupEnd} aria-invalid={Boolean(fieldErrors.pickupEnd)} aria-describedby={fieldErrors.pickupEnd ? 'pickup-error' : undefined} onChange={(event) => { setForm({ ...form, pickupEnd: event.target.value }); clearError('pickupEnd') }} />
                {fieldErrors.pickupEnd ? <span className="field-error" id="pickup-error">{fieldErrors.pickupEnd}</span> : null}
              </div>

              <fieldset className="declarations field-wide">
                <legend>Food handling</legend>
                <div className="declaration-grid">
                  <label><input type="checkbox" checked={form.sealed} onChange={(event) => setForm({ ...form, sealed: event.target.checked })} /><span><strong>Individually sealed</strong><small>Packaging is closed and intact.</small></span></label>
                  <label id="allergens-declaration"><input type="checkbox" checked={form.allergenInformationPresent} aria-describedby={fieldErrors.allergens ? 'allergen-error' : undefined} onChange={(event) => { setForm({ ...form, allergenInformationPresent: event.target.checked }); clearError('allergens') }} /><span><strong>Allergen labels attached</strong><small>Dairy is declared on every meal.</small></span></label>
                  <label id="handling-declaration"><input type="checkbox" checked={form.handlingDeclarationAccepted} aria-invalid={Boolean(fieldErrors.handling)} aria-describedby={fieldErrors.handling ? 'handling-error' : undefined} onChange={(event) => { setForm({ ...form, handlingDeclarationAccepted: event.target.checked }); clearError('handling') }} /><span><strong>Details are accurate</strong><small>These are donor-declared facts.</small></span></label>
                </div>
                {fieldErrors.allergens ? <span className="field-error" id="allergen-error">{fieldErrors.allergens}</span> : null}
                {fieldErrors.handling ? <span className="field-error" id="handling-error">{fieldErrors.handling}</span> : null}
              </fieldset>

              <button className="button button-primary form-submit" disabled={working}>{working ? 'Saving offer…' : 'Save offer and continue'} <span aria-hidden="true">→</span></button>
            </form>
          </section>
          <LiveDataStatus data={liveData} />
        </div>
      ) : (
        <div className="flow-stack" ref={resultRef} tabIndex={-1}>
          <section className="offer-summary" aria-labelledby="saved-offer-title">
            <div><span className="summary-check" aria-hidden="true">✓</span><div><p className="eyebrow">Offer saved</p><h2 id="saved-offer-title">{state.offer.quantity} vegetarian meals</h2><p>Sealed · chilled · dairy labels · pickup {state.offer.pickupStart}–{state.offer.pickupEnd}</p></div></div>
            <span className="summary-time">Added {new Date(state.offer.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </section>

          {!showMatches ? (
            <section className="flow-card matching-prompt" aria-labelledby="match-title">
              <div className="match-copy"><span className="step-number">2</span><div><p className="eyebrow">Recipient check</p><h2 id="match-title">Compare with live charity records</h2><p>We’ll combine current IRS-derived organization data with published food-intake guidance and explain every result.</p></div></div>
              <div className="match-source-mini"><span className={`source-state is-${liveData.status}`}><span aria-hidden="true" />{Object.keys(liveData.profiles).length}/{PARTNERS.length} live records</span><small>Source: ProPublica Nonprofit Explorer API</small></div>
              <button className="button button-primary" disabled={working || liveData.status === 'loading'} onClick={() => void guard('Comparing recipient rules…', () => actions.findMatches())}>{working ? 'Checking recipients…' : 'Check compatible recipients'} <span aria-hidden="true">→</span></button>
            </section>
          ) : results ? (
            <section className="match-results" aria-labelledby="results-title">
              <header className="results-heading"><div><p className="eyebrow">Compatibility result</p><h2 id="results-title">One preliminary fit</h2><p>Rule-based fit is not live availability. The recipient must still confirm capacity and inspect the food.</p></div><span className="result-count">1 of 3</span></header>

              {results.eligible.map(({ partner }) => {
                const profile = liveData.profiles[partner.id]
                return (
                  <article className="match-card is-compatible" key={partner.id}>
                    <div className="match-card-top"><div><span className="status status-compatible">✓ Compatible on published rules</span><h3>{partner.name}</h3><p>Fresh, sealed prepared food · daily intake {partner.pickupStart}–{partner.pickupEnd}</p></div>{!state.reservation ? <button className="button button-primary" disabled={working} onClick={() => void guard('Preparing the handoff…', () => actions.prepareReservation(partner.id))}>{working ? 'Preparing…' : 'Choose this recipient'} <span aria-hidden="true">→</span></button> : null}</div>
                    <LiveProfile partner={partner} profile={profile} />
                    <div className="match-evidence"><div><strong>Why it fits</strong><ul><li>Food type accepted</li><li>Sealed packaging</li><li>Chilled handling</li><li>Pickup times overlap</li></ul></div><div className="source-links"><a href={partner.policyUrl} target="_blank" rel="noreferrer">Read food guidance</a><a href={partner.registryUrl} target="_blank" rel="noreferrer">Open registry profile</a></div></div>
                  </article>
                )
              })}

              <details className="excluded-partners">
                <summary><span><strong>{results.excluded.length} organizations excluded</strong><small>See the exact rule mismatch for each profile</small></span></summary>
                <div className="excluded-list">
                  {results.excluded.map(({ partner, reasons }) => (
                    <article key={partner.id}><div><span className="status status-mismatch">Not compatible</span><h3>{partner.name}</h3><p>{reasons.map((reason) => REASON_EXPLANATIONS[reason]).join(' ')}</p><small>Published intake {partner.pickupStart}–{partner.pickupEnd}; offered pickup {state.offer?.pickupStart}–{state.offer?.pickupEnd}</small></div><div className="source-links"><a href={partner.policyUrl} target="_blank" rel="noreferrer">Read food guidance</a><a href={partner.registryUrl} target="_blank" rel="noreferrer">Open registry profile</a></div></article>
                  ))}
                </div>
              </details>
            </section>
          ) : null}

          {state.reservation && selectedPartner ? (
            <section className={`handoff-card is-${state.reservation.status}`} aria-labelledby="handoff-title">
              {state.reservation.status === 'prepared' ? (
                <>
                  <header><div><p className="eyebrow">Human checkpoint</p><h2 id="handoff-title">Review before sending</h2><p>The agent can prepare this handoff, but only you can send it.</p></div><span className="status status-prepared">Draft only</span></header>
                  <dl className="review-grid"><div><dt>Recipient</dt><dd>{selectedPartner.name}</dd></div><div><dt>Quantity</dt><dd>{state.offer.quantity} meals</dd></div><div><dt>Handling</dt><dd>Sealed · chilled · dairy labels</dd></div><div><dt>Pickup</dt><dd>{state.offer.pickupStart}–{state.offer.pickupEnd}</dd></div></dl>
                  <div className="simulation-note"><span aria-hidden="true">i</span><p><strong>Demo boundary</strong>No message will be sent to {selectedPartner.name}. This action makes the handoff visible in the recipient workspace.</p></div>
                  <button className="button button-confirm" disabled={working} onClick={() => void guard('Sending the simulated handoff…', () => actions.sendReservation())}>{working ? 'Sending…' : 'Send simulated handoff'} <span aria-hidden="true">→</span></button>
                </>
              ) : (
                <div className="handoff-receipt"><span className="receipt-mark" aria-hidden="true">{state.reservation.status === 'declined' ? '—' : '✓'}</span><div><p className="eyebrow">Shared handoff</p><h2 id="handoff-title">{state.reservation.status === 'sent' ? 'Ready for recipient review' : `Handoff ${state.reservation.status}`}</h2><p>{state.reservation.status === 'sent' ? `Switch to the recipient workspace to review the same offer as ${selectedPartner.name}.` : 'The simulated response is now visible to both roles.'}</p></div></div>
              )}
            </section>
          ) : null}
        </div>
      )}

      {error ? <p className="error-message" role="alert">{error}</p> : null}
    </section>
  )
}
