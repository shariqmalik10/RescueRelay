import { useRef, useState } from 'react'
import type { Role } from '../domain/types'

export interface DemoIdentity {
  email: string
  role: Role
}

interface DemoLoginProps {
  onContinue: (identity: DemoIdentity) => void
  liveRegistry: {
    status: 'loading' | 'live' | 'partial' | 'error'
    count: number
    total: number
  }
}

const roleCopy: Record<Role, { title: string; description: string }> = {
  donor: {
    title: 'Donor — create the offer',
    description: 'Recommended: create, match, and send the demo handoff.',
  },
  recipient: {
    title: 'Recipient — review the handoff',
    description: 'Open the other side of the same shared session.',
  },
}

const AGENT_PROMPT = 'Create a chilled offer for 36 sealed vegetarian meals with dairy labeled, available for pickup from 7:00–8:00 PM. Find an eligible recipient and prepare the handoff for my review.'

export function DemoLogin({ onContinue, liveRegistry }: DemoLoginProps) {
  const [email, setEmail] = useState('coordinator@example.org')
  const [role, setRole] = useState<Role>('donor')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const registryLabel = liveRegistry.status === 'live'
    ? `${liveRegistry.count}/${liveRegistry.total} live nonprofit records ready`
    : liveRegistry.status === 'loading'
      ? 'Connecting to the live nonprofit registry'
      : liveRegistry.status === 'partial'
        ? `${liveRegistry.count}/${liveRegistry.total} live nonprofit records ready`
        : 'Live registry temporarily unavailable'

  const submit = () => {
    const normalized = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError('Enter an email address such as name@example.org.')
      emailRef.current?.focus()
      return
    }
    onContinue({ email: normalized, role })
  }

  return (
    <div className="welcome-shell">
      <a className="skip-link" href="#demo-sign-in">Skip to demo sign in</a>
      <header className="welcome-header">
        <a className="brand" href="/" aria-label="RescueRelay home">
          <span className="brand-symbol" aria-hidden="true">R</span>
          <span>RescueRelay</span>
        </a>
        <div className="welcome-badges">
          <span className="webmcp-label">5 WebMCP tools</span>
          <span className={`pilot-pill is-${liveRegistry.status}`}><span aria-hidden="true" /> {registryLabel}</span>
        </div>
      </header>

      <main className="welcome-main">
        <section className="welcome-story" aria-labelledby="welcome-title">
          <p className="eyebrow">A human-approved WebMCP coordination demo</p>
          <h1 id="welcome-title">The agent prepares. People decide.</h1>
          <p className="welcome-lede">
            RescueRelay turns one surplus-meal description into a traceable handoff: live nonprofit records come in, eligibility is explained, and people approve both ends.
          </p>
          <dl className="authority-ledger" aria-label="What is live, agent-assisted, and human-controlled">
            <div><dt>Live data</dt><dd>IRS-derived records for three real NYC nonprofits</dd></div>
            <div><dt>Browser agent</dt><dd>Structures, checks, prepares, and explains through five tools</dd></div>
            <div><dt>People</dt><dd>Send the reservation and record the final response</dd></div>
          </dl>
        </section>

        <section className="sign-in-card" id="demo-sign-in" aria-labelledby="sign-in-title">
          <div className="sign-in-heading">
            <p className="eyebrow">Five-minute walkthrough</p>
            <h2 id="sign-in-title">Start with one role</h2>
            <p>Begin as donor, then switch to recipient from the top bar. No account or email is created.</p>
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="field">
              <label htmlFor="demo-email">Work email</label>
              <input
                id="demo-email"
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'email-error' : 'email-hint'}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError('')
                }}
              />
              <span className="field-hint" id="email-hint">Use any valid email format.</span>
              {error ? <span className="field-error" id="email-error">{error}</span> : null}
            </div>

            <fieldset className="role-choice">
              <legend>Choose a starting workspace</legend>
              {(Object.keys(roleCopy) as Role[]).map((option) => (
                <label key={option} className={role === option ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                  />
                  <span className="role-icon" aria-hidden="true">{option === 'donor' ? '↗' : '↙'}</span>
                  <span><strong>{roleCopy[option].title}</strong><small>{roleCopy[option].description}</small></span>
                  <span className="radio-mark" aria-hidden="true" />
                </label>
              ))}
            </fieldset>

            <button className="button button-primary button-wide" type="submit">
              Start in the {role === 'donor' ? 'donor' : 'recipient'} workspace <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      </main>

      <section className="agent-quickstart" aria-labelledby="agent-quickstart-title">
        <div>
          <p className="eyebrow">Prove the agent path</p>
          <h2 id="agent-quickstart-title">Give your browser agent one plain-language task.</h2>
          <p>The registered WebMCP tools update the same shared workflow as the manual controls. Every observed tool call appears in the verification panel.</p>
        </div>
        <div className="agent-prompt">
          <blockquote>{AGENT_PROMPT}</blockquote>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1800)
              })
            }}
          >
            {copied ? 'Prompt copied' : 'Copy agent prompt'}
          </button>
        </div>
      </section>

      <footer className="welcome-footer">
        <p>OpenAI WebMCP Challenge prototype · New York City pilot</p>
        <p>Live records from ProPublica Nonprofit Explorer · No charity is contacted</p>
      </footer>
    </div>
  )
}
