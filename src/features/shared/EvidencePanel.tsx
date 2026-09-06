import { evidence } from '../../lib/evidence'
import { tr, L, useLocale } from '../../i18n'

export default function EvidencePanel() {
  useLocale()
  return (
    <details className="evidence card">
      <summary>{tr('📚 The research behind these numbers', '📚 Forskningen bakom siffrorna')}</summary>
      <ul>
        {evidence().map((e) => (
          <li key={e.claim}>
            <strong>{L(e.claim)}.</strong> <span className="muted small">{e.source}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
