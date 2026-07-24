import { useState } from 'react'
import { useAppStore } from './state/store'
import IntakeWizard from './features/intake/IntakeWizard'
import Blueprint from './features/blueprint/Blueprint'
import ActionView from './features/action/ActionView'
import NutritionView from './features/nutrition/NutritionView'
import LongevityView from './features/longevity/LongevityView'
import ProgressView from './features/progress/ProgressView'
import HabitsView from './features/habits/HabitsView'
import SettingsView from './features/settings/SettingsView'
import AccountGate from './features/auth/AccountGate'
import CoachFab from './features/coach/CoachFab'
import { clearSession, getSession } from './state/session'

export type Tab = 'blueprint' | 'action' | 'progress' | 'nutrition' | 'longevity' | 'habits' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'blueprint', label: 'Blueprint & Roadmap', icon: '📋' },
  { id: 'action', label: 'Action', icon: '🏋️' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'nutrition', label: 'Nutrition', icon: '🍽️' },
  { id: 'longevity', label: 'Longevity', icon: '🧬' },
  { id: 'habits', label: 'Habits', icon: '✅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const profile = useAppStore((s) => s.profile)
  const activeWorkout = useAppStore((s) => s.activeWorkout)
  const [tab, setTab] = useState<Tab>('blueprint')
  const [unlocked, setUnlocked] = useState(() => getSession() !== null)

  if (!unlocked) {
    return <AccountGate onReady={() => setUnlocked(true)} />
  }

  const lock = () => {
    clearSession()
    setUnlocked(false)
    setTab('blueprint')
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

  const workoutTakeover = activeWorkout !== null && tab === 'action'

  return (
    <>
      <Header onLock={lock} />
      {activeWorkout && tab !== 'action' && (
        <div className="banner warn" role="status">
          🏋️ Workout in progress —{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setTab('action')
            }}
          >
            return to logging
          </a>
        </div>
      )}
      {tab === 'blueprint' && <Blueprint onNavigate={setTab} />}
      {tab === 'action' && <ActionView />}
      {tab === 'nutrition' && <NutritionView />}
      {tab === 'longevity' && <LongevityView />}
      {tab === 'progress' && <ProgressView />}
      {tab === 'habits' && <HabitsView />}
      {tab === 'settings' && <SettingsView onLock={lock} />}
      <Disclaimer />
      {!workoutTakeover && <CoachFab />}
      {!workoutTakeover && (
        <nav className="tabbar" aria-label="Main navigation">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
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

function Header({ onLock }: { onLock?: () => void }) {
  const session = getSession()
  return (
    <header className="app-header">
      <svg viewBox="0 0 512 512" width="34" height="34" aria-hidden>
        <rect width="512" height="512" rx="112" fill="#0f172a" />
        <g stroke="#34d399" strokeWidth="34" strokeLinecap="round">
          <line x1="120" y1="256" x2="392" y2="256" />
          <line x1="120" y1="180" x2="120" y2="332" />
          <line x1="392" y1="180" x2="392" y2="332" />
          <line x1="70" y1="208" x2="70" y2="304" />
          <line x1="442" y1="208" x2="442" y2="304" />
        </g>
      </svg>
      <div>
        <div className="title">FitBlueprint</div>
        <div className="subtitle">Your evidence-based personal trainer</div>
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
