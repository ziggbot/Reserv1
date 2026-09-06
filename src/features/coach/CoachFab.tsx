import { useState } from 'react'
import CoachSheet from './CoachSheet'
import { tr } from '../../i18n'

/** Always-available floating chat button for the AI training partner. */
export default function CoachFab() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="coach-fab" onClick={() => setOpen(true)} aria-label={tr('Open training partner chat', 'Öppna chatten med träningskompisen')}>
        💬
      </button>
      {open && <CoachSheet onClose={() => setOpen(false)} />}
    </>
  )
}
