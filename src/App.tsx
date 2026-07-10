import { useState } from 'react'
import { useAppStore } from './state/store'
import IntakeWizard from './features/intake/IntakeWizard'
import Dashboard from './features/dashboard/Dashboard'
import Blueprint from './features/blueprint/Blueprint'
import RoadmapView from './features/roadmap/RoadmapView'
import NutritionView from './features/nutrition/NutritionView'
import FatLossView from './features/fatloss/FatLossView'
import HabitsView from './features/habits/HabitsView'
import SettingsView from './features/settings/SettingsView'

export type Tab =
  | 'dashboard'
  | 'blueprint'
  | 'roadmap'
  | 'nutrition'
  | 'fatloss'
  | 'habits'
  | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Today', icon: '📆' },
  { id: 'blueprint', label: 'Blueprint', icon: '🏋️' },
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { id: 'nutrition', label: 'Nutrition', icon: '🍽️' },
  { id: 'fatloss', label: 'Fat Loss', icon: '🔥' },
  { id: 'habits', label: 'Habits', icon: '✅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const profile = useAppStore((s) => s.profile)
  const [tab, setTab] = useState<Tab>('dashboard')

  if (!profile) {
    return (
      <>
        <Header />
        <IntakeWizard />
        <Disclaimer />
      </>
    )
  }

  return (
    <>
      <Header />
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'blueprint' && <Blueprint />}
      {tab === 'roadmap' && <RoadmapView />}
      {tab === 'nutrition' && <NutritionView />}
      {tab === 'fatloss' && <FatLossView />}
      {tab === 'habits' && <HabitsView />}
      {tab === 'settings' && <SettingsView />}
      <Disclaimer />
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
    </>
  )
}

function Header() {
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
