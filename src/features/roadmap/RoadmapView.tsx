import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { buildRoadmap } from '../../lib/roadmap'
import EvidencePanel from '../shared/EvidencePanel'

export default function RoadmapView() {
  const profile = useAppStore((s) => s.profile)
  const planStartDate = useAppStore((s) => s.planStartDate)
  if (!profile) return null

  const roadmap = buildRoadmap(profile)
  const week = weeksSince(planStartDate, todayIso()) + 1

  return (
    <main>
      <div className="card">
        <h1>Body Transformation Roadmap</h1>
        <p>{roadmap.summary}</p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{week}</div>
            <div className="label">current week</div>
          </div>
          <div className="stat">
            <div className="value">{roadmap.etaWeeks ?? '—'}</div>
            <div className="label">weeks to goal</div>
          </div>
          <div className="stat">
            <div className="value">
              {roadmap.weeklyRateKg > 0 ? '+' : ''}
              {roadmap.weeklyRateKg}
            </div>
            <div className="label">kg / week pace</div>
          </div>
        </div>
        <div className="banner info">
          This is the <strong>fastest realistic path</strong> — the rates come from studies on preserving
          muscle, not from marketing. Anything faster trades muscle, adherence and rebound risk for a
          number on a calendar.
        </div>
      </div>

      <div className="card">
        <h2>Phases</h2>
        {roadmap.phases.map((p) => (
          <div className="phase" key={p.name}>
            <div className="weeks">{p.weeks}</div>
            <h3>{p.name}</h3>
            <p>{p.focus}</p>
            <ul>
              <li>
                <strong>Training:</strong> {p.trainingEmphasis}
              </li>
              <li>
                <strong>Nutrition:</strong> {p.nutritionEmphasis}
              </li>
              <li>
                <strong>Checkpoints:</strong> {p.checkpoints.join(' · ')}
              </li>
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Weekly tracking protocol</h2>
        <ul>
          {roadmap.trackingProtocol.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="muted small">
          Log weigh-ins and workouts on the Today tab — the Fat Loss tab turns them into adjustment
          decisions automatically.
        </p>
      </div>

      <EvidencePanel />
    </main>
  )
}
