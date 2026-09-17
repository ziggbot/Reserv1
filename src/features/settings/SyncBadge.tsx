import { useEffect, useState } from 'react'
import { cloudStatus, subscribeCloud, syncNow, type CloudStatus } from '../../state/cloudSync'
import { tr, dateLocale } from '../../i18n'

/** Tiny cloud indicator in the header; tap to sync now. Hidden until signed in. */
export default function SyncBadge() {
  const [status, setStatus] = useState<CloudStatus>(cloudStatus())
  useEffect(() => subscribeCloud(setStatus), [])
  if (status.state === 'unconfigured' || status.state === 'signed_out') return null
  const label =
    status.state === 'syncing'
      ? tr('Syncing…', 'Synkar…')
      : status.state === 'synced'
        ? `${tr('Saved to cloud', 'Sparat i molnet')} · ${new Date(status.at).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}`
        : `${tr('Sync problem', 'Synkproblem')}: ${status.message}`
  return (
    <button className={`sync-badge ${status.state}`} title={label} aria-label={label} onClick={() => void syncNow()}>
      ☁ {status.state === 'synced' ? '✓' : status.state === 'syncing' ? '…' : '!'}
    </button>
  )
}
