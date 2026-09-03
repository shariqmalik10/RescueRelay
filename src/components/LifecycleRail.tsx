import type { DemoState } from '../domain/types'

interface LifecycleRailProps {
  state: DemoState
}

const stages = [
  { short: 'Record', label: 'Offer recorded', current: 'Record offer', owner: 'Donor or agent' },
  { short: 'Check', label: 'Compatibility checked', current: 'Check compatibility', owner: 'Deterministic code' },
  { short: 'Prepare', label: 'Reservation prepared', current: 'Prepare reservation', owner: 'Donor or agent' },
  { short: 'Send', label: 'Reservation sent', current: 'Send reservation', owner: 'Human donor' },
  { short: 'Respond', label: 'Response prepared', current: 'Prepare response', owner: 'Recipient or agent' },
  { short: 'Confirm', label: 'Response confirmed', current: 'Confirm response', owner: 'Human recipient' },
]

function completedStages(state: DemoState) {
  let completed = 0
  if (state.offer) completed = 1
  if (state.matchEvaluatedAt || state.reservation) completed = 2
  if (state.reservation) completed = 3
  if (state.reservation && state.reservation.status !== 'prepared') completed = 4
  if (
    state.reservation?.responseDraft ||
    state.reservation?.status === 'accepted' ||
    state.reservation?.status === 'declined'
  ) completed = 5
  if (state.reservation?.status === 'accepted' || state.reservation?.status === 'declined') completed = 6
  return completed
}

export function LifecycleRail({ state }: LifecycleRailProps) {
  const completed = completedStages(state)
  const currentIndex = Math.min(completed, stages.length - 1)
  const current = completed === stages.length ? 'Handoff complete' : stages[currentIndex].current

  return (
    <section className="lifecycle" aria-labelledby="lifecycle-title">
      <div className="lifecycle-heading">
        <div>
          <span>{completed === stages.length ? '6 of 6 stages' : `Step ${completed + 1} of 6`}</span>
          <h2 id="lifecycle-title">{current}</h2>
        </div>
        <p>{completed === stages.length ? 'Both organizations have responded' : `${completed} complete`}</p>
      </div>

      <ol className="lifecycle-list">
        {stages.map((stage, index) => {
          const isComplete = index < completed
          const isCurrent = index === completed && completed < stages.length
          const stateLabel = isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming'
          return (
            <li
              key={stage.short}
              className={`is-${stateLabel}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="stage-marker" aria-hidden="true">{isComplete ? '✓' : index + 1}</span>
              <span className="stage-label" aria-hidden="true">{stage.short}</span>
              <span className="sr-only">{stage.label}, {stateLabel}. {stage.owner}.</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
