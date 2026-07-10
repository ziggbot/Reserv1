import { EVIDENCE } from '../../lib/evidence'

export default function EvidencePanel() {
  return (
    <details className="evidence card">
      <summary>📚 The research behind these numbers</summary>
      <ul>
        {EVIDENCE.map((e) => (
          <li key={e.claim}>
            <strong>{e.claim}.</strong> <span className="muted small">{e.source}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
