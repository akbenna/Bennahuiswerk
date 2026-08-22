import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

/**
 * De proeven draaien op dezelfde bouwinstellingen als de app, zodat een test
 * niet per ongeluk iets anders compileert dan wat er straks in de browser komt.
 * Alleen daarom staat dit apart en niet in vite.config.ts: die is voor de bouw
 * en moet zuiver Vite blijven.
 */
export default mergeConfig(viteConfig, defineConfig({
  test: {
    /* jsdom en niet node: de hooks raken localStorage en de hertekening van
       React. Wat in een echte browser kan mislukken hoort ook in de proef te
       kunnen mislukken. */
    environment: 'jsdom',
    include: ['src/**/*.proef.ts', 'src/**/*.proef.tsx'],
  },
}))
