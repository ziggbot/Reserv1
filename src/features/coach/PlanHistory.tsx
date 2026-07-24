import { useAppStore } from '../../state/store'

const SOURCE_LABEL: Record<string, string> = { user: 'You', coach: 'Coach', intake: 'Intake' }

export default function PlanHistory() {
  const planHistory = useAppStore((s) => s.planHistory)
  const restoreRevision = useAppStore((s) => s.restoreRevision)

  if (planHistory.length === 0) {
    return (
      <p className="muted small">
        No plan changes yet. When you (or the coach) adjust your plan, each version is saved here so you
        can revert.
      </p>
    )
  }

  return (
    <div>
      <h3>Plan history</h3>
      <p className="muted small">Each entry is the plan as it was before that change. Restore any version.</p>
      {planHistory.map((r) => (
        <div className="check-row" key={r.id}>
          <span>
            <strong>{r.description}</strong>
            <span className="muted small">
              {' '}
              · {SOURCE_LABEL[r.source] ?? r.source} · {new Date(r.ts).toLocaleString()}
            </span>
          </span>
          <button className="ghost small-btn" style={{ marginLeft: 'auto' }} onClick={() => restoreRevision(r.id)}>
            ↩ Restore
          </button>
        </div>
      ))}
    </div>
  )
}
