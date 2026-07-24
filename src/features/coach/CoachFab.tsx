import { useState } from 'react'
import CoachSheet from './CoachSheet'

/** Always-available floating chat button for the AI training partner. */
export default function CoachFab() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="coach-fab" onClick={() => setOpen(true)} aria-label="Open training partner chat">
        💬
      </button>
      {open && <CoachSheet onClose={() => setOpen(false)} />}
    </>
  )
}
