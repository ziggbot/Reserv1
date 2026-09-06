import { useAppStore } from '../../state/store'
import { tr, dateLocale } from '../../i18n'

function sourceLabel(source: string): string {
  switch (source) {
    case 'user':
      return tr('You', 'Du')
    case 'coach':
      return tr('Coach', 'Coach')
    case 'intake':
      return tr('Intake', 'Intag')
    default:
      return source
  }
}

export default function PlanHistory() {
  const planHistory = useAppStore((s) => s.planHistory)
  const restoreRevision = useAppStore((s) => s.restoreRevision)

  if (planHistory.length === 0) {
    return (
      <p className="muted small">
        {tr(
          'No plan changes yet. When you (or the coach) adjust your plan, each version is saved here so you can revert.',
          'Inga planändringar än. När du (eller coachen) justerar din plan sparas varje version här så att du kan gå tillbaka.',
        )}
      </p>
    )
  }

  return (
    <div>
      <h3>{tr('Plan history', 'Planhistorik')}</h3>
      <p className="muted small">
        {tr('Each entry is the plan as it was before that change. Restore any version.', 'Varje post är planen som den såg ut före ändringen. Återställ vilken version du vill.')}
      </p>
      {planHistory.map((r) => (
        <div className="check-row" key={r.id}>
          <span>
            <strong>{r.description}</strong>
            <span className="muted small">
              {' '}
              · {sourceLabel(r.source)} · {new Date(r.ts).toLocaleString(dateLocale())}
            </span>
          </span>
          <button className="ghost small-btn" style={{ marginLeft: 'auto' }} onClick={() => restoreRevision(r.id)}>
            ↩ {tr('Restore', 'Återställ')}
          </button>
        </div>
      ))}
    </div>
  )
}
