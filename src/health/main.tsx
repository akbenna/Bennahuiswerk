/**
 * De ingang. Meer dan dit hoort er niet in te staan.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './stijl.css'
import './desktop.css'
import './medical-intelligence.css'

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}

const wortel = document.getElementById('app')
if (!wortel) throw new Error('Geen element met id "app" gevonden.')

createRoot(wortel).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
