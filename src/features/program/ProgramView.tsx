import { useState } from 'react'
import { useAppStore } from '../../state/store'
import TrainingProgramCard from '../settings/TrainingProgramCard'
import { tr, useLocale } from '../../i18n'

/** More → Training program: the program itself plus the user's own exercise list. */
export default function ProgramView() {
  useLocale()
  const [editing, setEditing] = useState(false)
  return (
    <main>
      <div className="home-greeting">
        <h1>{tr('Training program', 'Träningsprogram')}</h1>
        <div className="date">
          {tr(
            'Which sessions you run, how many days a week, and the exercises in them.',
            'Vilka pass du kör, hur många dagar i veckan, och övningarna i dem.',
          )}
        </div>
      </div>
      <TrainingProgramCard onEditingChange={setEditing} />
      {!editing && <CustomExercisesCard />}
    </main>
  )
}

function CustomExercisesCard() {
  const customExercises = useAppStore((s) => s.customExercises)
  const addCustomExercise = useAppStore((s) => s.addCustomExercise)
  const removeCustomExercise = useAppStore((s) => s.removeCustomExercise)
  const [text, setText] = useState('')

  const add = () => {
    if (addCustomExercise(text)) setText('')
  }

  return (
    <div className="card">
      <h2>{tr('✎ My exercises', '✎ Mina övningar')}</h2>
      <p className="muted small">
        {tr(
          'Exercises you have added yourself. They appear in the program editor under “My exercises” and keep their own weight history in the logger.',
          'Övningar du lagt till själv. De finns i programeditorn under ”Mina övningar” och får egen vikthistorik i loggern.',
        )}
      </p>
      {customExercises.length === 0 ? (
        <p className="muted small">{tr('None yet.', 'Inga ännu.')}</p>
      ) : (
        <ul className="custom-list">
          {customExercises.map((n) => (
            <li key={n}>
              <span>{n}</span>
              <button className="ghost icon-btn" aria-label={`${tr('Remove', 'Ta bort')} ${n}`} onClick={() => removeCustomExercise(n)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="new-exercise">
        <input
          type="text"
          value={text}
          placeholder={tr('New exercise name', 'Namn på ny övning')}
          aria-label={tr('New exercise name', 'Namn på ny övning')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <button className="primary small-btn" disabled={!text.trim()} onClick={add}>
          {tr('Add', 'Lägg till')}
        </button>
      </div>
      <p className="muted small">
        {tr(
          'Removing one here does not touch sessions that already use it.',
          'Att ta bort en här påverkar inte pass som redan använder den.',
        )}
      </p>
    </div>
  )
}
