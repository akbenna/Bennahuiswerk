import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** ESM kent hier niet. */
const hier = dirname(fileURLToPath(import.meta.url))

/**
 * BennaHub — negen apps, één bouw.
 *
 * Elke app houdt zijn eigen map en dus zijn eigen adres: /health/, /noer/,
 * /rasikh/. Dat is geen esthetiek maar noodzaak — die adressen staan in
 * bladwijzers, in negen service workers en in de tegels op de startpagina.
 * Vite draait daarom in meerpagina-stand: één ingang per app, geen router.
 */

/**
 * Apps die nog niet zijn omgebouwd worden onveranderd meegekopieerd. Zolang een
 * naam hier staat, draait die app nog als los HTML-bestand en raakt de bouw hem
 * niet aan. De lijst is daarmee de stand van de verbouwing: leeg is klaar.
 *
 * Dit is bewust geen tijdelijke steiger die later opgeruimd moet worden — het
 * is de enige manier om negen apps te verbouwen zonder de site ooit stuk te
 * hebben staan.
 */
const NOG_NIET_OMGEBOUWD = [
  'huiswerk', 'noer', 'arabisch', 'bunyan', 'sanad',
]

/** Omgebouwd, en dus een echte ingang in de bouw. */
const OMGEBOUWD = ['start', 'health', 'spellen', 'rasikh']



function kopieerNietOmgebouwd(): Plugin {
  return {
    name: 'bennahub-kopieer-niet-omgebouwd',
    apply: 'build',
    closeBundle() {
      for (const app of NOG_NIET_OMGEBOUWD) {
        const van = resolve(hier, app)
        if (!existsSync(van)) continue
        cpSync(van, resolve(hier, 'dist', app), { recursive: true })
        this.info(`onveranderd meegekopieerd: ${app}/`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), kopieerNietOmgebouwd()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Bronkaarten horen erbij: zonder die kaart is een foutmelding uit de
    // productiebundel niet terug te leiden naar de regel die hem veroorzaakte.
    sourcemap: true,
    rollupOptions: {
      /* 'start' is de startpagina en woont op de wortel; de rest in zijn
         eigen map, want dat is het adres waarop de app bereikbaar moet zijn. */
      input: Object.fromEntries(OMGEBOUWD.map((app) => [
        app,
        app === 'start' ? resolve(hier, 'index.html') : resolve(hier, app, 'index.html'),
      ])),
    },
  },
  resolve: {
    alias: { '@': resolve(hier, 'src') },
  },
})
