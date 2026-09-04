import { useState } from 'react'
import { useAppStore } from './state/store'
import IntakeWizard from './features/intake/IntakeWizard'
import Blueprint from './features/blueprint/Blueprint'
import TrainHome from './features/train/TrainHome'
import NutritionView from './features/nutrition/NutritionView'
import LongevityView from './features/longevity/LongevityView'
import ProgressView from './features/progress/ProgressView'
import HabitsView from './features/habits/HabitsView'
import SettingsView from './features/settings/SettingsView'
import AccountGate from './features/auth/AccountGate'
import CoachFab from './features/coach/CoachFab'
import { clearSession, getSession } from './state/session'

export type Tab = 'train' | 'progress' | 'more' | 'blueprint' | 'nutrition' | 'longevity' | 'habits' | 'settings'

/** The three things in the bottom bar. Training sits in the middle. */
const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'train', label: 'Train', icon: '🏋️' },
  { id: 'more', label: 'More', icon: '☰' },
]

/** Everything that is not training lives one tap away, behind More. */
const SECONDARY: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'blueprint', label: 'Plan & roadmap', icon: '📋', desc: 'Your marching orders and the realistic path to your goal' },
  { id: 'nutrition', label: 'Nutrition', icon: '🍽️', desc: 'Calories, protein, meal ideas, supplements' },
  { id: 'habits', label: 'Habits', icon: '✅', desc: 'Anchored habits and streaks' },
  { id: 'longevity', label: 'Longevity', icon: '🧬', desc: 'What the research says about living longer' },
  { id: 'settings', label: 'Settings', icon: '⚙️', desc: 'Program, training days, coach, data & privacy' },
]

export default function App() {
  const profile = useAppStore((s) => s.profile)
  const activeWorkout = useAppStore((s) => s.activeWorkout)
  const [tab, setTab] = useState<Tab>('train')
  const [unlocked, setUnlocked] = useState(() => getSession() !== null)

  if (!unlocked) {
    return <AccountGate onReady={() => setUnlocked(true)} />
  }

  const lock = () => {
    clearSession()
    setUnlocked(false)
    setTab('train')
  }

  if (!profile) {
    return (
      <>
        <Header onLock={lock} />
        <IntakeWizard />
        <Disclaimer />
      </>
    )
  }

  const workoutTakeover = activeWorkout !== null && tab === 'train'
  const navTab: Tab = tab === 'train' || tab === 'progress' ? tab : 'more'

  return (
    <>
      <Header onLock={lock} />
      {activeWorkout && tab !== 'train' && (
        <div className="banner warn" role="status">
          🏋️ Workout in progress —{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setTab('train')
            }}
          >
            back to it
          </a>
        </div>
      )}
      {tab !== 'train' && tab !== 'progress' && tab !== 'more' && (
        <button className="back-link" onClick={() => setTab('more')}>
          ← More
        </button>
      )}
      {tab === 'train' && <TrainHome onNavigate={setTab} />}
      {tab === 'progress' && <ProgressView />}
      {tab === 'more' && <MorePage onNavigate={setTab} />}
      {tab === 'blueprint' && <Blueprint onNavigate={setTab} />}
      {tab === 'nutrition' && <NutritionView />}
      {tab === 'longevity' && <LongevityView />}
      {tab === 'habits' && <HabitsView />}
      {tab === 'settings' && <SettingsView onLock={lock} />}
      <Disclaimer />
      {!workoutTakeover && <CoachFab />}
      {!workoutTakeover && (
        <nav className="tabbar" aria-label="Main navigation">
          {NAV.map((t) => (
            <button
              key={t.id}
              className={`${navTab === t.id ? 'active' : ''} ${t.id === 'train' ? 'center' : ''}`}
              onClick={() => setTab(t.id)}
              aria-current={navTab === t.id ? 'page' : undefined}
            >
              <span className="icon" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </>
  )
}

function MorePage({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <main>
      <div className="home-greeting">
        <h1>Everything else</h1>
        <div className="date">The plan behind the training. Peek when you need it.</div>
      </div>
      <ul className="more-list">
        {SECONDARY.map((s) => (
          <li key={s.id}>
            <button className="more-item" onClick={() => onNavigate(s.id)}>
              <span className="icon" aria-hidden>
                {s.icon}
              </span>
              <span>
                <span className="name">{s.label}</span>
                <div className="desc">{s.desc}</div>
              </span>
              <span className="arrow" aria-hidden>
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

function Header({ onLock }: { onLock?: () => void }) {
  const session = getSession()
  return (
    <header className="app-header">
      <svg viewBox="0 0 512 512" width="30" height="30" aria-hidden>
        <g stroke="#1c1b1a" strokeWidth="38" strokeLinecap="round" fill="none">
          <line x1="120" y1="256" x2="392" y2="256" />
          <line x1="120" y1="180" x2="120" y2="332" />
          <line x1="392" y1="180" x2="392" y2="332" />
          <line x1="70" y1="208" x2="70" y2="304" />
          <line x1="442" y1="208" x2="442" y2="304" />
        </g>
      </svg>
      <div>
        <div className="title">FitBlueprint</div>
      </div>
      {onLock && session && (
        <button className="lock-btn" onClick={onLock} title="Lock & switch profile">
          <span aria-hidden>🔒</span> {session.displayName}
        </button>
      )}
    </header>
  )
}

function Disclaimer() {
  return (
    <p className="footer-disclaimer">
      FitBlueprint provides general fitness and nutrition education based on published research. It is
      not medical advice and does not replace a physician, registered dietitian or physiotherapist —
      especially if you have a medical condition, an injury, or are pregnant. Stop and seek care for
      chest pain, dizziness or acute pain. All data stays on this device.
    </p>
  )
}
