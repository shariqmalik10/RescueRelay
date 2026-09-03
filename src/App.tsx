import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { DemoLogin, type DemoIdentity } from './components/DemoLogin'
import { DonorWorkspace } from './components/DonorWorkspace'
import { LifecycleRail } from './components/LifecycleRail'
import { LiveDataStatus } from './components/LiveDataStatus'
import { RecipientWorkspace } from './components/RecipientWorkspace'
import { PARTNERS } from './domain/eligibility'
import type { DemoState, Role } from './domain/types'
import type { RescueActions } from './lib/actions'
import { useConvexBackend } from './lib/convexBackend'
import { createDemoActions, getDemoSnapshot, subscribeToDemo } from './lib/demoStore'
import { useLiveCharityData } from './lib/liveCharityData'
import { ensureSessionId } from './lib/session'
import { checkingWebMcpReport, registerRoleTools, type WebMcpReport } from './lib/webmcp'

type BackendMode = 'local' | 'convex'

interface AppProps { backend?: BackendMode }

interface AppViewProps {
  sessionId: string
  state: DemoState
  actions: RescueActions
  backend: BackendMode
  loading?: boolean
}

const IDENTITY_KEY = 'rescuerelay:demo-identity:v1'

function readIdentity(): DemoIdentity | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(IDENTITY_KEY) ?? 'null') as DemoIdentity | null
    return parsed?.email && (parsed.role === 'donor' || parsed.role === 'recipient') ? parsed : null
  } catch {
    return null
  }
}

function LocalSessionApp() {
  const sessionId = useMemo(ensureSessionId, [])
  const subscribe = useCallback((listener: () => void) => subscribeToDemo(sessionId, listener), [sessionId])
  const getSnapshot = useCallback(() => getDemoSnapshot(sessionId), [sessionId])
  const state = useSyncExternalStore(subscribe, getSnapshot)
  const actions = useMemo(() => createDemoActions(sessionId), [sessionId])
  return <AppView sessionId={sessionId} state={state} actions={actions} backend="local" />
}

function ConvexSessionApp() {
  const sessionId = useMemo(ensureSessionId, [])
  const { state, actions, loading } = useConvexBackend(sessionId)
  return <AppView sessionId={sessionId} state={state} actions={actions} backend="convex" loading={loading} />
}

export default function App({ backend = 'local' }: AppProps) {
  return backend === 'convex' ? <ConvexSessionApp /> : <LocalSessionApp />
}

function activeStage(state: DemoState) {
  if (!state.offer) return 'Describe the surplus'
  if (!state.matchEvaluatedAt && !state.reservation) return 'Check recipient compatibility'
  if (!state.reservation) return 'Choose a recipient'
  if (state.reservation.status === 'prepared') return 'Review the handoff'
  if (state.reservation.status === 'sent') return 'Handoff ready for recipient'
  return state.reservation.status === 'accepted' ? 'Handoff accepted' : 'Handoff declined'
}

function recipientStage(state: DemoState) {
  if (state.reservation?.status === 'accepted') return 'Handoff accepted'
  if (state.reservation?.status === 'declined') return 'Handoff declined'
  if (state.reservation?.status === 'sent' && state.reservation.responseDraft) return 'Confirm the response'
  if (state.reservation?.status === 'sent') return 'A handoff is ready to review'
  return 'Recipient handoffs'
}

function AppView({ sessionId, state, actions, backend, loading = false }: AppViewProps) {
  const [identity, setIdentity] = useState<DemoIdentity | null>(readIdentity)
  const [role, setRole] = useState<Role>(() => readIdentity()?.role ?? 'donor')
  const [webMcpReport, setWebMcpReport] = useState<WebMcpReport>(() => checkingWebMcpReport(role))
  const [resetError, setResetError] = useState('')
  const resetDialogRef = useRef<HTMLDialogElement>(null)
  const liveData = useLiveCharityData()
  const selectedPartner = state.reservation
    ? PARTNERS.find((partner) => partner.id === state.reservation?.partnerId)
    : undefined
  const workflowStageKey = `${Boolean(state.offer)}:${Boolean(state.matchEvaluatedAt)}:${state.reservation?.status ?? 'none'}:${Boolean(state.reservation?.responseDraft)}`

  useEffect(() => {
    const controller = new AbortController()
    setWebMcpReport(checkingWebMcpReport(role))
    void registerRoleTools(role, actions, controller.signal).then((report) => {
      if (!controller.signal.aborted) setWebMcpReport(report)
    })
    return () => controller.abort()
  }, [actions, role])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [identity, role, workflowStageKey])

  const continueDemo = (nextIdentity: DemoIdentity) => {
    sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(nextIdentity))
    setIdentity(nextIdentity)
    setRole(nextIdentity.role)
  }

  const switchRole = (nextRole: Role) => {
    setRole(nextRole)
    if (identity) {
      const updated = { ...identity, role: nextRole }
      sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(updated))
      setIdentity(updated)
    }
    window.requestAnimationFrame(() => document.getElementById('main-content')?.focus())
  }

  const signOut = () => {
    sessionStorage.removeItem(IDENTITY_KEY)
    setIdentity(null)
  }

  const reset = async () => {
    try {
      setResetError('')
      await actions.reset()
      resetDialogRef.current?.close()
    } catch {
      setResetError('Unable to reset this session. Check the connection and try again.')
    }
  }

  const profileCount = Object.keys(liveData.profiles).length
  if (!identity) {
    return (
      <DemoLogin
        onContinue={continueDemo}
        liveRegistry={{ status: liveData.status, count: profileCount, total: PARTNERS.length }}
      />
    )
  }

  const registrationComplete = webMcpReport.status === 'supported'
    && webMcpReport.registeredTools.length === webMcpReport.expectedTools.length

  return (
    <div className="product-shell">
      <a className="skip-link" href="#main-content">Skip to workspace</a>
      <header className="product-header">
        <a className="brand" href={`?session=${sessionId}`} aria-label="RescueRelay home">
          <span className="brand-symbol" aria-hidden="true">R</span>
          <span>RescueRelay</span>
        </a>

        <nav className="portal-nav" aria-label="Workspaces">
          <button type="button" aria-current={role === 'donor' ? 'page' : undefined} onClick={() => switchRole('donor')}>Donor</button>
          <button type="button" aria-current={role === 'recipient' ? 'page' : undefined} onClick={() => switchRole('recipient')}>Recipient</button>
        </nav>

        <div className="account-menu">
          <span className="account-avatar" aria-hidden="true">{identity.email.slice(0, 1).toUpperCase()}</span>
          <span className="account-copy"><strong>{role === 'donor' ? 'Cedar Events' : selectedPartner?.name ?? 'Recipient team'}</strong><small>{identity.email}</small></span>
          <button className="text-button" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <main id="main-content" className="product-main" tabIndex={-1}>
        <section className="portal-intro" aria-labelledby="portal-title">
          <div>
            <p className="eyebrow">{role === 'donor' ? 'Donor workspace · Cedar Events' : `Recipient workspace · ${selectedPartner?.name ?? 'New York City pilot'}`}</p>
            <h1 id="portal-title">{role === 'donor' ? activeStage(state) : recipientStage(state)}</h1>
            <p>{role === 'donor'
              ? 'Create one clear offer, compare it with real nonprofit records and sourced intake rules, then approve the simulated handoff.'
              : 'Only donor-approved handoffs appear here. Review the declared food details before recording a simulated response.'}</p>
          </div>
          <LiveDataStatus data={liveData} compact />
        </section>

        <LifecycleRail state={state} />

        {loading ? (
          <section className="loading-card" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <div><h2>Connecting to the shared session</h2><p>Loading the offer and handoff state.</p></div>
          </section>
        ) : role === 'donor' ? (
          <DonorWorkspace state={state} actions={actions} liveData={liveData} />
        ) : (
          <RecipientWorkspace state={state} actions={actions} liveData={liveData} onSwitchToDonor={() => switchRole('donor')} />
        )}

        <details className="verification-panel">
          <summary>
            <span><strong>Live data and agent verification</strong><small>Inspect the proof behind this demo</small></span>
            <span className="verification-summary"><span className={liveData.status === 'live' ? 'is-pass' : 'is-pending'}>{profileCount}/{PARTNERS.length} live</span><span className={registrationComplete ? 'is-pass' : 'is-pending'}>{webMcpReport.registeredTools.length}/{webMcpReport.expectedTools.length} tools</span></span>
          </summary>
          <div className="verification-grid">
            <section>
              <h2>Data flow</h2>
              <ul className="proof-list">
                <li className={liveData.status === 'live' ? 'is-pass' : 'is-pending'}><span aria-hidden="true">{liveData.status === 'live' ? '✓' : '·'}</span><div><strong>ProPublica API response</strong><small>{profileCount} IRS-derived organization records received in this browser session.</small></div></li>
                <li className="is-pass"><span aria-hidden="true">✓</span><div><strong>Published intake rules</strong><small>Each compatibility result links to the organization’s source guidance.</small></div></li>
                <li className="is-pending"><span aria-hidden="true">○</span><div><strong>Human commitment simulated</strong><small>No charity is contacted and no availability is claimed.</small></div></li>
              </ul>
            </section>
            <section>
              <h2>WebMCP access</h2>
              <ul className="proof-list">
                <li className={registrationComplete ? 'is-pass' : 'is-pending'}><span aria-hidden="true">{registrationComplete ? '✓' : '·'}</span><div><strong>{webMcpReport.registeredTools.length}/{webMcpReport.expectedTools.length} {role} tools registered</strong><small>{webMcpReport.status === 'unsupported' ? 'This browser does not expose WebMCP; all manual controls still work.' : 'Role tools share the same application actions as this interface.'}</small></div></li>
                <li className={webMcpReport.humanOnlyActionsExcluded ? 'is-pass' : 'is-pending'}><span aria-hidden="true">✓</span><div><strong>Final actions excluded</strong><small>Agents can prepare; people send and respond.</small></div></li>
                <li className={state.latestActivity ? 'is-pass' : 'is-pending'}><span aria-hidden="true">{state.latestActivity ? '✓' : '·'}</span><div><strong>{state.latestActivity ? state.latestActivity.resultSummary : 'No agent call in this session'}</strong><small>{state.latestActivity ? `${state.latestActivity.toolName} · ${new Date(state.latestActivity.timestamp).toLocaleTimeString()}` : 'Invoke a registered tool to record proof here.'}</small></div></li>
              </ul>
            </section>
          </div>
        </details>
      </main>

      <footer className="product-footer">
        <p><strong>Coordination support only.</strong> Donor facts are not a food-safety certification.</p>
        <div><span>{backend === 'convex' ? 'Realtime session' : 'Browser session'}</span><button type="button" onClick={() => resetDialogRef.current?.showModal()}>Reset demo</button></div>
      </footer>

      <dialog className="reset-dialog" ref={resetDialogRef} aria-labelledby="reset-title" aria-describedby="reset-description">
        <form method="dialog">
          <p className="eyebrow">Current session only</p>
          <h2 id="reset-title">Reset this handoff?</h2>
          <p id="reset-description">This clears the offer, match, reservation, and agent activity for this demo session.</p>
          <div className="dialog-actions">
            <button className="button button-secondary" value="cancel">Keep handoff</button>
            <button className="button button-danger" type="button" onClick={() => void reset()}>Reset handoff</button>
          </div>
          {resetError ? <p className="error-message" role="alert">{resetError}</p> : null}
        </form>
      </dialog>
    </div>
  )
}
