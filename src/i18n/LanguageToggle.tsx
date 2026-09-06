import { setLocale, useLocale } from './index'

/** SV / EN switch. Compact enough for the header; also used in Settings. */
export default function LanguageToggle() {
  const locale = useLocale()
  return (
    <div className="lang-toggle" role="group" aria-label="Språk / Language">
      <button className={locale === 'sv' ? 'active' : ''} onClick={() => setLocale('sv')} aria-pressed={locale === 'sv'}>
        SV
      </button>
      <button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')} aria-pressed={locale === 'en'}>
        EN
      </button>
    </div>
  )
}
