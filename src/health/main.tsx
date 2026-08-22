/**
 * De ingang. Meer dan dit hoort er niet in te staan.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './stijl.css'

/* Offline bruikbaar houden: de weging gebeurt in de badkamer en juist daar valt
   het bereik weg. Blijft de app dan hangen, dan mist de reeks een dag — en het
   model rekent met de reeks, niet met losse getallen. */
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
