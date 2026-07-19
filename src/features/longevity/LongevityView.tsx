import { useAppStore } from '../../state/store'
import { LONGEVITY_SECTIONS, longevityNudges } from '../../lib/longevity'
import type { EvidenceGrade } from '../../lib/types'

const GRADE_LABEL: Record<EvidenceGrade, string> = {
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  emerging: 'Emerging / unproven',
}
const GRADE_CLS: Record<EvidenceGrade, string> = { strong: 'ok', moderate: 'info', emerging: 'warn' }

export default function LongevityView() {
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const nudges = longevityNudges(profile)

  return (
    <main>
      <div className="card">
        <h1>Longevity</h1>
        <p className="muted">
          Coaching for a long <em>healthspan</em>, not just lifespan — the levers with the best evidence,
          honestly graded. Every claim links to its source. Hype is labelled as hype.
        </p>
        <div className="banner info">
          Education, not medical advice. Screening, medication and any longevity drug are decisions for you
          and your physician.
        </div>
      </div>

      <div className="card">
        <h2>🎯 Your longevity nudges</h2>
        <p className="muted small">Pulled from your own profile.</p>
        {nudges.map((n) => (
          <div className="directive" key={n.text}>
            <span className="directive-icon" aria-hidden>
              {n.icon}
            </span>
            <p style={{ margin: 0 }}>{n.text}</p>
          </div>
        ))}
      </div>

      {LONGEVITY_SECTIONS.map((section) => (
        <div className="card" key={section.id}>
          <h2>
            {section.icon} {section.title}
          </h2>
          <p className="muted small">{section.intro}</p>
          {section.claims.map((c) => (
            <div className="claim" key={c.statement}>
              <div className="claim-head">
                <strong>{c.statement}</strong>
                <span className={`pill ${GRADE_CLS[c.grade]}`}>{GRADE_LABEL[c.grade]}</span>
              </div>
              <p className="muted small">{c.detail}</p>
              <a className="claim-source" href={c.url} target="_blank" rel="noopener noreferrer">
                {c.sourceName} ↗
              </a>
            </div>
          ))}
        </div>
      ))}

      <p className="footer-disclaimer">
        Sources are peer-reviewed studies, meta-analyses and public-health bodies (PubMed/PMC, NEJM, The
        Lancet, JAMA, WHO, IARC, NIH, CDC, USPSTF). Evidence grades reflect the current strength of that
        research and can change as new studies land.
      </p>
    </main>
  )
}
