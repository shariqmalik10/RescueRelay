import { useRef, useState } from 'react'
import type { Role } from '../domain/types'

export interface DemoIdentity {
  email: string
  role: Role
}

interface DemoLoginProps {
  onContinue: (identity: DemoIdentity) => void
}

const roleCopy: Record<Role, { title: string; description: string }> = {
  donor: {
    title: 'I have food to share',
    description: 'Record a surplus batch and find a compatible recipient.',
  },
  recipient: {
    title: 'I receive food',
    description: 'Review handoffs prepared for a recipient organization.',
  },
}

export function DemoLogin({ onContinue }: DemoLoginProps) {
  const [email, setEmail] = useState('coordinator@example.org')
  const [role, setRole] = useState<Role>('donor')
  const [error, setError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

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
        <span className="pilot-pill"><span aria-hidden="true" /> Live NYC nonprofit data</span>
      </header>

      <main className="welcome-main">
        <section className="welcome-story" aria-labelledby="welcome-title">
          <p className="eyebrow">Food rescue, without the phone-tree delay</p>
          <h1 id="welcome-title">Move good food to people who can use it.</h1>
          <p className="welcome-lede">
            RescueRelay combines donor-declared food details with live IRS-derived nonprofit records and published intake guidance, then keeps people in control of the handoff.
          </p>
          <div className="promise-row" aria-label="How RescueRelay works">
            <div><span aria-hidden="true">01</span><strong>Describe the surplus</strong><small>Structured facts, not a long message thread.</small></div>
            <div><span aria-hidden="true">02</span><strong>Check real organizations</strong><small>Current nonprofit records and sourced rules.</small></div>
            <div><span aria-hidden="true">03</span><strong>Approve the handoff</strong><small>Final actions stay visible and human.</small></div>
          </div>
        </section>

        <section className="sign-in-card" id="demo-sign-in" aria-labelledby="sign-in-title">
          <div className="sign-in-heading">
            <p className="eyebrow">Try the live flow</p>
            <h2 id="sign-in-title">Enter the demo</h2>
            <p>No account is created and no email is sent.</p>
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
              Open {role === 'donor' ? 'donor' : 'recipient'} workspace <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>Public-benefit prototype · New York City pilot</p>
        <p>Live records from ProPublica Nonprofit Explorer · Final handoff simulated</p>
      </footer>
    </div>
  )
}
