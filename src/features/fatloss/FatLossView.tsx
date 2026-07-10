import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { analyzeProgress, FAT_LOSS_PILLARS } from '../../lib/fatloss'
import { macroTargets, targetWeeklyLossKg, tdee } from '../../lib/calculations'
import EvidencePanel from '../shared/EvidencePanel'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  insufficient_data: { label: 'Collecting data', cls: 'info' },
  on_track: { label: 'On track', cls: 'ok' },
  slow: { label: 'Slower than target', cls: 'warn' },
  stalled: { label: 'Stalled', cls: 'danger' },
  too_fast: { label: 'Too fast', cls: 'warn' },
}

export default function FatLossView() {
  const { profile, weighIns, planStartDate } = useAppStore()
  if (!profile) return null

  const today = todayIso()
  const weeks = weeksSince(planStartDate, today)
  const analysis = analyzeProgress(weighIns, today, profile.weightKg, weeks)
  const status = STATUS_LABEL[analysis.status]
  const targets = macroTargets({ ...profile, goal: 'fat_loss' })
  const maintenance = tdee(profile)
  const isCutting = profile.goal === 'fat_loss'

  return (
    <main>
      <div className="card">
        <h1>Fat Loss Expert</h1>
        {!isCutting && (
          <div className="banner info">
            Your current goal is {profile.goal.replace('_', ' ')} — this page shows what your cut protocol{' '}
            <em>would</em> look like, and the pillars still apply whenever you decide to lean out.
          </div>
        )}
        <p>
          Strategy: lose <strong>~{targetWeeklyLossKg(profile.weightKg)} kg/week</strong> (0.5–1% of
          bodyweight — the muscle-sparing zone) on a moderate deficit, guarded by heavy training and high
          protein.
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{targets.calories}</div>
            <div className="label">cut kcal</div>
          </div>
          <div className="stat">
            <div className="value">{maintenance}</div>
            <div className="label">maintenance</div>
          </div>
          <div className="stat">
            <div className="value">{targets.proteinG} g</div>
            <div className="label">protein</div>
          </div>
          <div className="stat">
            <div className="value">9,000</div>
            <div className="label">step floor</div>
          </div>
        </div>
      </div>

      {isCutting && (
        <div className="card">
          <h2>
            📈 Progress check <span className={`pill ${status.cls}`}>{status.label}</span>
          </h2>
          <div className="stat-row">
            <div className="stat">
              <div className="value">{analysis.currentAvgKg ?? '—'}</div>
              <div className="label">7-day avg (kg)</div>
            </div>
            <div className="stat">
              <div className="value">{analysis.previousAvgKg ?? '—'}</div>
              <div className="label">previous week</div>
            </div>
            <div className="stat">
              <div className="value">{analysis.weeklyChangeKg ?? '—'}</div>
              <div className="label">change (kg)</div>
            </div>
            <div className="stat">
              <div className="value">{analysis.targetWeeklyChangeKg}</div>
              <div className="label">target (kg/wk)</div>
            </div>
          </div>
          <h3>Coach’s call</h3>
          <ul>
            {analysis.recommendation.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>The six pillars</h2>
        {FAT_LOSS_PILLARS.map((p) => (
          <div key={p.title} style={{ marginBottom: 10 }}>
            <h3>{p.title}</h3>
            <p className="muted">{p.detail}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>When the scale stalls — the playbook</h2>
        <ol>
          <li>
            <strong>Confirm it’s real:</strong> two consecutive flat weekly averages. One flat week is
            usually water/glycogen noise, especially after hard training or high-sodium days.
          </li>
          <li>
            <strong>Audit before you cut:</strong> track honestly for 3 days — cooking oils, bites,
            drinks and weekends hide 200–400 kcal.
          </li>
          <li>
            <strong>Move more before eating less:</strong> +1,500–2,000 steps/day restores the NEAT your
            body quietly dropped.
          </li>
          <li>
            <strong>Then adjust intake:</strong> −5–10% calories (100–200 kcal), always from carbs/fat —
            protein never drops.
          </li>
          <li>
            <strong>Every 8–12 weeks:</strong> a 1-week diet break at maintenance — better hormones,
            better training, better adherence (MATADOR study).
          </li>
        </ol>
      </div>

      <EvidencePanel />
    </main>
  )
}
