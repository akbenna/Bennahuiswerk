/** De ingang van Islam leren. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './stijl.css'
/* De tabbalk wordt een zijbalk zodra het scherm breed genoeg is. Alleen stijl,
   en alleen boven 1000px; zie het bestand zelf. */
import '@/gedeeld/schil.css'

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}

const wortel = document.getElementById('app')
if (!wortel) throw new Error('Geen element met id "app" gevonden.')
createRoot(wortel).render(<StrictMode><App /></StrictMode>)
