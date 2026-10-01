/**
 * DE PRIVACYVERKLARING NAAR EEN DOCUMENT
 *
 * De tekst staat in `src/health/privacy.ts`, want daar hoort hij: hij moet
 * kloppen met wat de app doet, en het scherm dat hem toont leest uit datzelfde
 * bestand. Maar een privacyverklaring moet ook te lezen zijn zonder de app te
 * starten, en hij hoort in versiebeheer te staan zodat na te gaan is wat er
 * wanneer beloofd werd.
 *
 * Dus schrijft dit bestand hem naar `health/PRIVACY.md`, en houdt
 * `src/health/privacy.proef.ts` vast dat die twee gelijk zijn.
 *
 * WAAROM DIT BESTAND DE TYPESCRIPT INLEEST EN NIET ONTLEEDT
 *
 * De eerste versie las `privacy.ts` als tekst en viste de zinnen er met een
 * reguliere expressie uit. Dat werkte niet, en het werkte op de vervelende
 * manier: er kwam een document uit dat er op het eerste gezicht goed uitzag,
 * met elke geknipte regel als eigen alinea en het contactadres eruit gevallen.
 * Een privacyverklaring waarin het adres ontbreekt waar je je recht moet halen,
 * is precies het soort stille fout waar de rest van dit project tegen gebouwd
 * is.
 *
 * `esbuild` staat er al, als afhankelijkheid van vite. Die maakt er in een paar
 * milliseconden gewone JavaScript van en dan is de tekst gewoon de tekst.
 */
import { writeFileSync } from 'node:fs'
import { build } from 'esbuild'

const { outputFiles } = await build({
  entryPoints: ['src/health/privacy.ts'],
  bundle: true, format: 'esm', write: false, platform: 'node',
})
const { CONTACT, NAGEKEKEN, PRIVACY } = await import(
  'data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'))

const uit = [
  '# Privacyverklaring BennaHealth',
  '',
  `Nagelopen tegen de code op ${NAGEKEKEN}. Vragen gaan naar ${CONTACT}.`,
  '',
  'Deze tekst wordt geschreven uit `src/health/privacy.ts` met',
  '`node gereedschap/privacy-schrijven.mjs`. Pas hem daar aan en niet hier,',
  'anders valt `src/health/privacy.proef.ts` om.',
  '',
  ...PRIVACY.flatMap((s) => [`## ${s.kop}`, '', ...s.alineas.flatMap((a) => [a, ''])]),
].join('\n')

writeFileSync('health/PRIVACY.md', uit)
console.log(`privacy-schrijven: ${PRIVACY.length} stukken naar health/PRIVACY.md`)
