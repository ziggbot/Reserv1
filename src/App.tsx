import { Fragment, useState } from 'react'
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
import { stopSync } from './state/cloudSync'
import { tr, useLocale } from './i18n'
import ProgramView from './features/program/ProgramView'

export type Tab = 'train' | 'progress' | 'more' | 'program' | 'blueprint' | 'nutrition' | 'longevity' | 'habits' | 'settings'

/** The three things in the bottom bar. Training sits in the middle. */
function nav(): { id: Tab; label: string; icon: string }[] {
  return [
    { id: 'progress', label: tr('Progress', 'Utveckling'), icon: '📈' },
    { id: 'train', label: tr('Train', 'Träna'), icon: '🏋️' },
    { id: 'more', label: tr('More', 'Mer'), icon: '☰' },
  ]
}

/** Everything that is not training lives one tap away, behind More. */
function secondary(): { id: Tab; label: string; icon: string; desc: string }[] {
  return [
    {
      id: 'program',
      label: tr('Training program', 'Träningsprogram'),
      icon: '🏋️',
      desc: tr('Your program, sessions, exercises and training days', 'Ditt program, pass, övningar och träningsdagar'),
    },
    {
      id: 'blueprint',
      label: tr('Plan & roadmap', 'Plan & vägkarta'),
      icon: '📋',
      desc: tr('Your marching orders and the realistic path to your goal', 'Dina marschorder och den realistiska vägen till ditt mål'),
    },
    {
      id: 'nutrition',
      label: tr('Nutrition', 'Kost'),
      icon: '🍽️',
      desc: tr('Calories, protein, meal ideas, supplements', 'Kalorier, protein, måltidsidéer, kosttillskott'),
    },
    { id: 'habits', label: tr('Habits', 'Vanor'), icon: '✅', desc: tr('Anchored habits and streaks', 'Förankrade vanor och streaks') },
    {
      id: 'longevity',
      label: tr('Longevity', 'Långt liv'),
      icon: '🧬',
      desc: tr('What the research says about living longer', 'Vad forskningen säger om att leva längre'),
    },
    {
      id: 'settings',
      label: tr('Settings', 'Inställningar'),
      icon: '⚙️',
      desc: tr('Language, cloud sync, coach, data & privacy', 'Språk, molnsynk, coach, data & integritet'),
    },
  ]
}

export default function App() {
  const profile = useAppStore((s) => s.profile)
  const activeWorkout = useAppStore((s) => s.activeWorkout)
  const [tab, setTab] = useState<Tab>('train')
  const [unlocked, setUnlocked] = useState(() => getSession() !== null)
  const locale = useLocale()

  if (!unlocked) {
    return (
      <Fragment key={locale}>
        <AccountGate onReady={() => setUnlocked(true)} />
      </Fragment>
    )
  }

  const lock = () => {
    stopSync()
    clearSession()
    setUnlocked(false)
    setTab('train')
  }

  if (!profile) {
    return (
      <Fragment key={locale}>
        <Header onLock={lock} />
        <IntakeWizard />
        <Disclaimer />
      </Fragment>
    )
  }

  const workoutTakeover = activeWorkout !== null && tab === 'train'
  const navTab: Tab = tab === 'train' || tab === 'progress' ? tab : 'more'

  return (
    <Fragment key={locale}>
      <Header onLock={lock} />
      {activeWorkout && tab !== 'train' && (
        <div className="banner warn" role="status">
          🏋️ {tr('Workout in progress', 'Pass pågår')} —{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setTab('train')
            }}
          >
            {tr('back to it', 'tillbaka till passet')}
          </a>
        </div>
      )}
      {tab !== 'train' && tab !== 'progress' && tab !== 'more' && (
        <button className="back-link" onClick={() => setTab('more')}>
          ← {tr('More', 'Mer')}
        </button>
      )}
      {tab === 'train' && <TrainHome onNavigate={setTab} />}
      {tab === 'progress' && <ProgressView />}
      {tab === 'more' && <MorePage onNavigate={setTab} />}
      {tab === 'blueprint' && <Blueprint onNavigate={setTab} />}
      {tab === 'nutrition' && <NutritionView />}
      {tab === 'longevity' && <LongevityView />}
      {tab === 'habits' && <HabitsView />}
      {tab === 'program' && <ProgramView />}
      {tab === 'settings' && <SettingsView onLock={lock} />}
      <Disclaimer />
      {!workoutTakeover && <CoachFab />}
      {!workoutTakeover && (
        <nav className="tabbar" aria-label={tr('Main navigation', 'Huvudnavigering')}>
          {nav().map((t) => (
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
    </Fragment>
  )
}

function MorePage({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <main>
      <div className="home-greeting">
        <h1>{tr('Everything else', 'Allt annat')}</h1>
        <div className="date">{tr('The plan behind the training. Peek when you need it.', 'Planen bakom träningen. Kika när du behöver.')}</div>
      </div>
      <ul className="more-list">
        {secondary().map((s) => (
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
        <button className="lock-btn" onClick={onLock} title={tr('Lock & switch profile', 'Lås & byt profil')}>
          <span aria-hidden>🔒</span> {session.displayName}
        </button>
      )}
    </header>
  )
}

function Disclaimer() {
  return (
    <p className="footer-disclaimer">
      {tr(
        'FitBlueprint provides general fitness and nutrition education based on published research. It is not medical advice and does not replace a physician, registered dietitian or physiotherapist — especially if you have a medical condition, an injury, or are pregnant. Stop and seek care for chest pain, dizziness or acute pain. All data stays on this device.',
        'FitBlueprint ger allmän utbildning om träning och kost baserad på publicerad forskning. Det är inte medicinsk rådgivning och ersätter inte läkare, legitimerad dietist eller fysioterapeut – särskilt inte om du har en sjukdom, en skada eller är gravid. Avbryt och sök vård vid bröstsmärta, yrsel eller akut smärta. All data stannar på den här enheten.',
      )}
    </p>
  )
}
