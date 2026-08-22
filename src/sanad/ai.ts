/**
 * DOORVRAGEN EN MEELEZEN
 *
 * Twee plekken waar het model meedoet: een vervolgvraag bij de week, en een
 * blik over de schouder bij wat je zelf hebt uitgewerkt.
 *
 * WAAR DE SLEUTEL STAAT — en waarom dat hier mag
 *
 * De sleutel is die van de gebruiker zelf, staat in de opslag van dít toestel
 * en gaat niet mee naar de centrale kopie: op de laptop vul je hem opnieuw in.
 * Het gesprek loopt daarmee rechtstreeks van de browser naar Anthropic, en dat
 * is precies waarvoor `dangerouslyAllowBrowser` bestaat. Voor een dienst met
 * gebruikers zou dat fout zijn — daar hoort de sleutel op een server, zoals bij
 * BennaHealth, waar de edge function hem draagt. Hier is het één persoon met
 * zijn eigen rekening, en de afweging is bewust: geen tussenserver die de
 * vragen zou kunnen meelezen, in ruil voor een sleutel die in een browser
 * staat. Wie de app deelt, moet die keuze omdraaien.
 *
 * HET MODEL
 *
 * Adaptief denken staat aan. De vragen gaan over meningsverschil tussen
 * scholen, over ketens en over wat wél en niet in een tekst staat; dat is
 * precies het werk waar doordenken vóór antwoorden verschil maakt, en waar een
 * verzonnen titel of jaartal het meeste schade doet. Omdat de denkstappen uit
 * hetzelfde budget komen als het antwoord, staat `max_tokens` ruim: het
 * antwoord zelf blijft er tweehonderd woorden onder.
 *
 * WAAROM DE SDK PAS LAAT BINNENKOMT
 *
 * De bibliotheek van Anthropic is groter dan de hele leerstof bij elkaar, en de
 * meeste avonden wordt er niets aan gevraagd: je leest een brontekst, je doet je
 * kaarten, en je sluit af. Daarom komt zij binnen op het moment dat er werkelijk
 * een vraag gesteld wordt, en niet bij het openen van de app.
 */

/** De sleutel hoort bij dit toestel, niet bij het account. */
export const SLEUTEL_KEY = 'sanad.sleutel'

const MODEL = 'claude-opus-5'
const MAX_TOKENS = 4000

export const leesSleutel = (): string => {
  try {
    return localStorage.getItem(SLEUTEL_KEY) ?? ''
  } catch {
    return ''
  }
}

export const bewaarSleutel = (v: string): void => { localStorage.setItem(SLEUTEL_KEY, v) }
export const wisSleutel = (): void => {
  try { localStorage.removeItem(SLEUTEL_KEY) } catch { /* een browser die weigert */ }
}

/** Zo begint elke sleutel van Anthropic. */
export const lijktOpSleutel = (v: string): boolean => /^sk-ant-/.test(v)

export const SYS = `Je bent een zorgvuldige studiebegeleider in islamitische wetenschappen voor een Nederlandse huisarts van 51, Marokkaanse herkomst, academisch geschoold, Malikitisch opgevoed, met redelijke leesvaardigheid in het Arabisch.

Antwoord in helder Nederlands, in doorlopend proza zonder opsommingstekens, beknopt (150-300 woorden), analytisch en zonder vleierij.

Regels:
- Neem de Malikitische school als uitgangspunt; benoem expliciet wanneer je een andere school weergeeft.
- Noem waar mogelijk werk en auteur waarop een positie berust. Arabische termen mogen, met vertaling.
- Markeer uitdrukkelijk wanneer iets hedendaagse ijtihad is en geen klassieke schoolmening, en wanneer de school intern verdeeld is.
- Geef geen fatwa en geen oordeel over een persoonlijk geval; leg de redenering uit en verwijs naar een geleerde.
- Zeg het als je iets niet zeker weet. Verzin geen titels, jaartallen of citaten.`

/** Wat er misging, in gewone taal. De code erachter hoeft niemand te zien. */
export class AiFout extends Error {}

export const GEEN_SLEUTEL =
  'Hiervoor is een eigen API-sleutel nodig. Zet hem eenmalig onder Instellingen; ' +
  'daarna werken doorvragen en meelezen op dit toestel.'

/**
 * Stelt de vraag en geeft het antwoord stukje bij beetje door aan `opTekst`.
 * Geeft de volledige tekst terug als hij binnen is.
 */
export async function vraag(
  sys: string,
  tekst: string,
  opTekst: (zover: string) => void,
  afbreken?: AbortSignal,
): Promise<string> {
  const sleutel = leesSleutel()
  if (!sleutel) throw new AiFout(GEEN_SLEUTEL)

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: sleutel, dangerouslyAllowBrowser: true })
  let zover = ''
  try {
    const stroom = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      system: sys,
      messages: [{ role: 'user', content: tekst }],
    }, afbreken ? { signal: afbreken } : {})
    stroom.on('text', (stuk) => { zover += stuk; opTekst(zover) })
    const uit = await stroom.finalMessage()
    return uit.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim()
  } catch (e) {
    if (e instanceof Anthropic.APIUserAbortError) return zover
    if (e instanceof Anthropic.AuthenticationError) {
      throw new AiFout('De sleutel werd niet aanvaard. Kijk hem na onder Instellingen.')
    }
    if (e instanceof Anthropic.RateLimitError) {
      throw new AiFout('Te veel verzoeken achter elkaar. Probeer het over een minuut opnieuw.')
    }
    if (e instanceof Anthropic.APIConnectionError) {
      throw new AiFout('Geen verbinding met de dienst.')
    }
    throw new AiFout(e instanceof Error ? e.message : 'Er ging iets mis.')
  }
}
