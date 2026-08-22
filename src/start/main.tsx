/** De ingang van de startpagina. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './stijl.css'

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}

const wortel = document.getElementById('scherm')
if (!wortel) throw new Error('Geen element met id "scherm" gevonden.')
createRoot(wortel).render(<StrictMode><App /></StrictMode>)
