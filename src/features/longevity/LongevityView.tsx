import { useAppStore } from '../../state/store'
import { longevitySections, longevityNudges } from '../../lib/longevity'
import { tr, L, useLocale } from '../../i18n'
import type { EvidenceGrade } from '../../lib/types'

const GRADE_CLS: Record<EvidenceGrade, string> = { strong: 'ok', moderate: 'info', emerging: 'warn' }

function gradeLabel(grade: EvidenceGrade): string {
  switch (grade) {
    case 'strong':
      return tr('Strong evidence', 'Stark evidens')
    case 'moderate':
      return tr('Moderate evidence', 'Måttlig evidens')
    case 'emerging':
    default:
      return tr('Emerging / unproven', 'Ny / obevisad')
  }
}

export default function LongevityView() {
  useLocale()
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const nudges = longevityNudges(profile)

  return (
    <main>
      <div className="card">
        <h1>{tr('Longevity', 'Livslängd')}</h1>
        <p className="muted">
          {tr('Coaching for a long ', 'Coaching för ett långt ')}
          <em>{tr('healthspan', 'friskt liv')}</em>
          {tr(
            ', not just lifespan — the levers with the best evidence, honestly graded. Every claim links to its source. Hype is labelled as hype.',
            ', inte bara ett långt liv — spakarna med bäst evidens, ärligt graderade. Varje påstående länkar till sin källa. Hype märks som hype.',
          )}
        </p>
        <div className="banner info">
          {tr(
            'Education, not medical advice. Screening, medication and any longevity drug are decisions for you and your physician.',
            'Utbildning, inte medicinsk rådgivning. Screening, medicinering och eventuella livslängdsläkemedel är beslut för dig och din läkare.',
          )}
        </div>
      </div>

      <div className="card">
        <h2>{tr('🎯 Your longevity nudges', '🎯 Dina knuffar för ett längre liv')}</h2>
        <p className="muted small">{tr('Pulled from your own profile.', 'Hämtade från din egen profil.')}</p>
        {nudges.map((n) => (
          <div className="directive" key={n.text}>
            <span className="directive-icon" aria-hidden>
              {n.icon}
            </span>
            <p style={{ margin: 0 }}>{n.text}</p>
          </div>
        ))}
      </div>

      {longevitySections().map((section) => (
        <div className="card" key={section.id}>
          <h2>
            {section.icon} {L(section.title)}
          </h2>
          <p className="muted small">{L(section.intro)}</p>
          {section.claims.map((c) => (
            <div className="claim" key={c.statement}>
              <div className="claim-head">
                <strong>{L(c.statement)}</strong>
                <span className={`pill ${GRADE_CLS[c.grade]}`}>{gradeLabel(c.grade)}</span>
              </div>
              <p className="muted small">{L(c.detail)}</p>
              <a className="claim-source" href={c.url} target="_blank" rel="noopener noreferrer">
                {c.sourceName} ↗
              </a>
            </div>
          ))}
        </div>
      ))}

      <p className="footer-disclaimer">
        {tr(
          'Sources are peer-reviewed studies, meta-analyses and public-health bodies (PubMed/PMC, NEJM, The Lancet, JAMA, WHO, IARC, NIH, CDC, USPSTF). Evidence grades reflect the current strength of that research and can change as new studies land.',
          'Källorna är granskade studier, metaanalyser och folkhälsomyndigheter (PubMed/PMC, NEJM, The Lancet, JAMA, WHO, IARC, NIH, CDC, USPSTF). Evidensgraderna speglar forskningens nuvarande styrka och kan ändras när nya studier kommer.',
        )}
      </p>
    </main>
  )
}
