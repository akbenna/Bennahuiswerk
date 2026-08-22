/** De ingang van Geloofsstudie. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './stijl.css'

const wortel = document.getElementById('app')
if (!wortel) throw new Error('Geen element met id "app" gevonden.')
createRoot(wortel).render(<StrictMode><App /></StrictMode>)
