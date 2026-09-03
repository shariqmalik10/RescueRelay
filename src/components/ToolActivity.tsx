import type { DemoState, Role, ToolActivityRecord } from '../domain/types'
import type { WebMcpReport } from '../lib/webmcp'

interface ToolActivityProps {
  activity: ToolActivityRecord | null
  role: Role
  report: WebMcpReport
  state: DemoState
}

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

function formatTime(timestamp: number) {
  return timeFormatter.format(timestamp)
}

function checkMark(state: 'pass' | 'pending' | 'fail') {
  if (state === 'pass') return '✓'
  if (state === 'fail') return '×'
  return '·'
}

export function ToolActivity({ activity, role, report, state }: ToolActivityProps) {
  const events = state.reservation?.events ?? []
  const registrationComplete = report.status === 'supported' && report.registeredTools.length === report.expectedTools.length
  const invocationObserved = Boolean(activity)
  const statusLabel = report.status === 'supported'
    ? 'Registration verified'
    : report.status === 'checking'
      ? 'Checking browser'
      : report.status === 'error'
        ? 'Registration failed'
        : 'Browser unsupported'
  const apiState = report.status === 'checking' ? 'pending' : report.apiDetected ? 'pass' : 'fail'
  const registrationState = report.status === 'checking' ? 'pending' : registrationComplete ? 'pass' : 'fail'
  const invocationState = invocationObserved ? 'pass' : 'pending'

  return (
    <aside className="workspace-aside" aria-label="Evidence and agent details">
      <section className="authority-summary" aria-labelledby="authority-heading">
        <span className="authority-symbol" aria-hidden="true">A→H</span>
        <div>
          <h2 id="authority-heading">Agent can prepare. People commit.</h2>
          <p>{role === 'donor' ? 'Sending remains a visible donor action.' : 'The final response remains a visible recipient action.'}</p>
        </div>
      </section>

      <section className={`webmcp-proof proof-${report.status}`} aria-labelledby="webmcp-proof-heading">
        <p className="sr-status" role="status" aria-live="polite">WebMCP check: {statusLabel}.</p>
        <header>
          <div>
            <p className="proof-kicker">WebMCP checks</p>
            <h2 id="webmcp-proof-heading">Browser capability proof</h2>
          </div>
          <span className={`proof-badge proof-badge-${report.status}`}>{statusLabel}</span>
        </header>

        <ul className="proof-checks">
          <li className={`is-${apiState}`}>
            <span aria-hidden="true">{checkMark(apiState)}</span>
            <div><strong>Browser API detected</strong><small>{report.apiDetected ? 'The page can access WebMCP.' : report.status === 'checking' ? 'Feature detection is running.' : 'Manual UI remains available.'}</small></div>
          </li>
          <li className={`is-${registrationState}`}>
            <span aria-hidden="true">{checkMark(registrationState)}</span>
            <div><strong>{report.registeredTools.length}/{report.expectedTools.length} {role} tools registered</strong><small>{registrationComplete ? 'The current role’s exact tool set is active.' : 'No registration claim is made until every tool succeeds.'}</small></div>
          </li>
          <li className={report.humanOnlyActionsExcluded ? 'is-pass' : 'is-fail'}>
            <span aria-hidden="true">{checkMark(report.humanOnlyActionsExcluded ? 'pass' : 'fail')}</span>
            <div><strong>Commit tools excluded</strong><small>Send and final response stay in visible human controls.</small></div>
          </li>
          <li className={`is-${invocationState}`}>
            <span aria-hidden="true">{checkMark(invocationState)}</span>
            <div><strong>{invocationObserved ? 'Agent invocation observed' : 'Waiting for an agent invocation'}</strong><small>{activity ? `${activity.toolName} · ${formatTime(activity.timestamp)}` : 'A real tool call will appear here and in Agent activity.'}</small></div>
          </li>
        </ul>

        {report.error && <p className="proof-error">{report.error}</p>}
        {report.checkedAt && <p className="proof-time">Checked <time dateTime={new Date(report.checkedAt).toISOString()}>{formatTime(report.checkedAt)}</time></p>}
      </section>

      <details className="evidence-disclosure">
        <summary>
          <span>Agent activity</span>
          <small>{activity ? `${activity.resultSummary} · ${formatTime(activity.timestamp)}` : 'No calls in this session'}</small>
        </summary>
        <div className="disclosure-body">
          {activity ? (
            <dl className="activity-details">
              <div><dt>Action</dt><dd>{activity.resultSummary}</dd></div>
              <div><dt>Input</dt><dd>{activity.inputSummary}</dd></div>
              <div><dt>Tool</dt><dd><code>{activity.toolName}</code></dd></div>
              <div><dt>Time</dt><dd><time dateTime={new Date(activity.timestamp).toISOString()}>{formatTime(activity.timestamp)}</time></dd></div>
            </dl>
          ) : (
            <p className="aside-empty">Manual controls remain fully available. Agent actions will be summarized here when used.</p>
          )}
        </div>
      </details>

      <details className="evidence-disclosure">
        <summary>
          <span>Registered WebMCP tools</span>
          <small>{report.registeredTools.length}/{report.expectedTools.length} registered · {statusLabel}</small>
        </summary>
        <div className="disclosure-body">
          <ul className="tool-list">
            {report.expectedTools.map((tool) => (
              <li key={tool} className={report.registeredTools.includes(tool) ? 'is-registered' : undefined}>
                <span aria-hidden="true">{report.registeredTools.includes(tool) ? '✓' : '·'}</span>
                <code>{tool}</code>
              </li>
            ))}
          </ul>
          <p className="boundary-copy">
            <strong>Human-only:</strong>{' '}
            {role === 'donor' ? 'Send the reservation' : 'Confirm acceptance or decline'}.
          </p>
        </div>
      </details>

      <details className="evidence-disclosure">
        <summary>
          <span>Handoff record</span>
          <small>{events.length ? `${events.length} recorded ${events.length === 1 ? 'event' : 'events'}` : 'No events yet'}</small>
        </summary>
        <div className="disclosure-body">
          {events.length ? (
            <ol className="event-list">
              {[...events].reverse().map((event, index) => (
                <li key={`${event.type}-${event.timestamp}-${index}`}>
                  <span className="event-dot" aria-hidden="true" />
                  <div>
                    <strong>{event.summary}</strong>
                    <small>{event.actor} · {formatTime(event.timestamp)}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="aside-empty">The record starts when a reservation is prepared.</p>
          )}
        </div>
      </details>

      <section className="safety-note" aria-labelledby="safety-heading">
        <h2 id="safety-heading">Public profile, not live availability</h2>
        <p>These charity records are sourced snapshots. Recipients still confirm capacity, food safety, and transport directly; this demo never contacts them.</p>
      </section>
    </aside>
  )
}
