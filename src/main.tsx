import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // When a newer service worker takes over an already-open app, reload once so
  // the new build is what you see. First installs (no previous controller) are
  // left alone — the page already came from the network.
  const hadController = navigator.serviceWorker.controller !== null
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true
      window.location.reload()
    }
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => reg.update()).catch(() => {})
  })
}
