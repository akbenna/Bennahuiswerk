/**
 * De ingang. Meer dan dit hoort er niet in te staan.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { themaToepassen } from './thema'
import './stijl.css'
import './medical-intelligence.css'

/* Vóór het renderen, niet in een effect: anders staat het scherm er een tel in
   de kleur van het toestel voordat de keuze van de gebruiker aankomt. */
themaToepassen()

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
