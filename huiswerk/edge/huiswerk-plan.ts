/**
 * DE PLANLEZER: van een foto van het rooster naar toetsen op het planbord
 *
 * Dit is een verslag van wat er in de edge function `huiswerk-plan` draait,
 * net als `huiswerk-ai.ts` dat is voor de vraagbaak. Wijzigt er iets, dan hoort
 * dit bestand mee te veranderen.
 *
 * WAAROM
 *
 * Een kind dat vastloopt op plannen typt geen vier toetsen met paragrafen over
 * in een formulier. Het maakt wel een schermafdruk van de schoolapp, van de
 * studiewijzer of van de toetslijst, want dat doet het toch al. Het model leest
 * die afdruk en zet om wat erop staat; het kind kijkt het na en tikt op "zet op
 * het bord". Die laatste stap blijft van het kind: wat het model leest is een
 * voorstel, geen planning.
 *
 * WAT HET MODEL WEL EN NIET DOET
 *
 * Het leest af, het verzint niet. Het krijgt de vakken van dít kind mee, elk
 * met een sleutel, en mag alleen die sleutels gebruiken. Een datum die niet op
 * de afbeelding staat hoort het niet te raden; dan zegt het dat in "twijfel".
 * De app controleert daarna alles opnieuw (`src/huiswerk/planlezer.ts`): een
 * onbekend vak, een datum in het verleden of een toets zonder stof valt eruit,
 * met de reden erbij. Dezelfde afspraak als bij de vraagbaak en bij BennaHealth.
 *
 * Anders dan de vraagbaak vraagt deze function het antwoord in een vast schema
 * (`output_config.format`). Daar is een reden voor: hier staat een lijst
 * objecten met datums en arrays, en een half kapot antwoord betekent dat een
 * kind een foto opnieuw moet maken. Het schema kost niets en voorkomt dat.
 *
 * WAAR HIJ DRAAIT
 *
 * Op `huiuvnjrvvoybbzwfrfp`, met `verify_jwt` uit en `ANTHROPIC_API_KEY` in de
 * secrets, dezelfde sleutel als de vraagbaak. De stappen voor uitrollen staan in
 * `huiswerk/edge/UITROLLEN.md` en gelden hier ook; alleen de naam verschilt.
 *
 * WAT ER NIET BEWAARD WORDT
 *
 * De afbeeldingen gaan naar het model en nergens anders heen. Deze function
 * schrijft niets weg, en logt bij een fout alleen de status, nooit de inhoud.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KOPPEN = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const MODEL = 'claude-opus-5-5'

/* Een rooster aflezen is geen diep denkwerk, maar de datums goed krijgen wel:
   "wo 7" moet 7 oktober worden en niet 7 november, en een week met vijf
   toetsen moet er vijf opleveren en niet vier. `medium` is daarvoor genoeg en
   houdt de wachttijd binnen wat een kind uitzit. */
const EFFORT = 'medium'

const MAX_BEELDEN = 3
/* Ruim onder de grens van de API voor één afbeelding. De app verkleint vooraf
   tot een paar honderd kilobyte; wat hier groter binnenkomt is geen
   schermafdruk meer. */
const MAX_BEELD_BYTES = 4_000_000
const SOORTEN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface Beeld { type?: string; data?: string }
interface Vak { sleutel?: string; naam?: string }
interface Onderwerp { s?: string; vak?: string; onderwerp?: string; n?: number }

interface Verzoek {
  beelden?: Beeld[]
  tekst?: string
  vandaag?: string
  kind?: { naam?: string; niveau?: string }
  vakken?: Vak[]
  /** De onderwerpen die de app voor dit kind heeft, met sleutel. */
  catalogus?: Onderwerp[]
}

const SCHEMA = {
  type: 'object',
  properties: {
    toetsen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vak: { type: 'string' },
          datum: { type: 'string' },
          titel: { type: 'string' },
          onderdelen: { type: 'array', items: { type: 'string' } },
          opdracht: { type: 'boolean' },
          minutenPerOnderdeel: { type: 'integer' },
          twijfel: { type: 'string' },
          oefenen: { type: 'array', items: { type: 'string' } },
          gat: { type: 'string' },
        },
        required: ['vak', 'datum', 'titel', 'onderdelen', 'opdracht', 'minutenPerOnderdeel', 'twijfel', 'oefenen', 'gat'],
        additionalProperties: false,
      },
    },
    opmerking: { type: 'string' },
  },
  required: ['toetsen', 'opmerking'],
  additionalProperties: false,
}

const SYS = `Je leest schermafdrukken en tekst van een Nederlandse scholier in de bovenbouw: een rooster uit de schoolapp, een toetsoverzicht, een studiewijzer of een PTA. Je haalt er de toetsen en de opdrachten met een deadline uit, zodat een planbord er een planning van kan maken.

Per toets of opdracht geef je:
- vak: een sleutel uit de meegegeven lijst vakken, letterlijk. Afkortingen uit roosters zijn gebruikelijk: wisA of wiA is wiskunde A, nat of na is natuurkunde, schk of sk is scheikunde, biol of bi is biologie, netl of ne is Nederlands, entl of en is Engels, fatl of fa is Frans, o&o is O&O. Past een toets bij geen enkel vak uit de lijst, laat hem dan weg en noem hem in "opmerking".
- datum: de dag van de toets of de deadline als JJJJ-MM-DD. Leid het jaar en de maand af uit wat er op de afbeelding staat en uit de datum van vandaag. Staat er alleen een weekdag en een dagnummer, kies dan de eerstvolgende dag die daarbij past. Staat er geen datum, raad dan niet: laat de toets weg en noem hem in "opmerking".
- titel: kort, zoals het op de afbeelding staat ("H3 Krachten", "SO hoofdstuk 2", "Verslag fase 2"). Staat er niets, gebruik dan "Toets" of "Opdracht".
- onderdelen: de stof in stukken die elk in één zit te doen zijn, in de volgorde van de stof: paragrafen ("§3.1 Krachten tekenen"), hoofdstukken, woordenlijsten, grammaticaonderdelen. Staat de stof niet op de afbeelding, geef dan drie algemene stappen die bij het vak passen, en zeg in "twijfel" dat de stof niet te zien was.
- opdracht: true voor iets wat ingeleverd wordt (verslag, werkstuk, presentatie, O&O-opdracht), false voor een toets.
- minutenPerOnderdeel: een eerlijke schatting voor een leerling in deze klas, meestal 20 tot 60.
- twijfel: een lege tekst als alles duidelijk te lezen was; anders in één zin wat onzeker is.
- oefenen: hoogstens vier sleutels uit de meegegeven lijst onderwerpen van de app, letterlijk, die echt bij deze stof horen, de best passende eerst. Verzin nooit een sleutel. Past er niets, geef dan een lege lijst. Liever niets dan iets wat er alleen op lijkt.
- gat: staat de stof van deze toets (of een duidelijk deel ervan) niet in de onderwerpen van de app, beschrijf dan in één zin wat er zou moeten komen ("Rekenen met de gaswet pV = nRT, 5 vwo"). Leeg als de app het dekt, en leeg bij een opdracht.

Alleen wat vandaag of later valt. Een oranje stip of een gekleurd blokje in een rooster betekent in de meeste schoolapps een toets; een blauwe stip is huiswerk en geen toets. Neem een toets die op twee afbeeldingen staat maar één keer op.

In "opmerking" schrijf je in één of twee zinnen voor de leerling wat je niet kon gebruiken en waarom. Leeg als er niets te melden is.`

serve(async (verzoek: Request) => {
  if (verzoek.method === 'OPTIONS') return new Response('ok', { headers: KOPPEN })

  try {
    const { beelden, tekst, vandaag, kind, vakken, catalogus } = (await verzoek.json()) as Verzoek

    const lijst = Array.isArray(beelden) ? beelden : []
    const los = String(tekst ?? '').trim()
    if (!lijst.length && !los) return fout('Stuur een schermafdruk of plak een lijst.', 400)
    if (lijst.length > MAX_BEELDEN) return fout(`Hoogstens ${MAX_BEELDEN} afbeeldingen tegelijk.`, 400)
    if (los.length > 6000) return fout('De tekst is te lang; plak alleen de toetsen.', 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(vandaag ?? ''))) return fout('De datum van vandaag ontbreekt.', 400)
    if (!Array.isArray(vakken) || !vakken.length) return fout('Geen vakken meegestuurd.', 400)
    for (const b of lijst) {
      if (!SOORTEN.has(String(b.type))) return fout('Alleen foto’s en schermafdrukken (jpg, png, webp).', 400)
      if (!b.data || b.data.length > MAX_BEELD_BYTES) return fout('Een afbeelding is te groot.', 400)
    }

    const sleutel = Deno.env.get('ANTHROPIC_API_KEY')
    if (!sleutel) return fout('De planlezer is nog niet ingesteld.', 500)

    const vakregels = vakken
      .map((v) => `${String(v.sleutel ?? '')} · ${String(v.naam ?? '')}`)
      .join('\n')
    const onderwerpen = (Array.isArray(catalogus) ? catalogus : [])
      .slice(0, 600)
      .map((o) => `${String(o.s ?? '')} · ${String(o.vak ?? '')} › ${String(o.onderwerp ?? '')} (${Number(o.n) || 0} opgaven)`)
      .join('\n')

    const inhoud = [
      ...lijst.map((b) => ({
        type: 'image',
        source: { type: 'base64', media_type: String(b.type), data: String(b.data) },
      })),
      {
        type: 'text',
        text: `Vandaag is het ${vandaag}. De leerling heet ${kind?.naam ?? 'onbekend'}`
          + ` en zit in ${kind?.niveau ?? 'onbekend'}.\n\n`
          + `De vakken van deze leerling (sleutel · naam):\n${vakregels}\n\n`
          + `De onderwerpen die de oefenapp voor deze leerling heeft (sleutel · vak › onderwerp):\n`
          + `${onderwerpen || '(geen)'}\n\n`
          + (los ? `Wat de leerling erbij typte of plakte:\n${los}\n\n` : '')
          + (lijst.length
            ? `Lees de ${lijst.length === 1 ? 'afbeelding' : `${lijst.length} afbeeldingen`} hierboven.`
            : 'Er is geen afbeelding; gebruik alleen de tekst.'),
      },
    ]

    const antwoord = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': sleutel,
        'anthropic-version': '2023-06-01',
        /* Weigert het model een verzoek, dan probeert de API het zelf op een
           ander model in plaats van een kind met lege handen te laten staan. */
        'anthropic-beta': 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        fallbacks: 'default',
        output_config: { effort: EFFORT, format: { type: 'json_schema', schema: SCHEMA } },
        system: SYS,
        messages: [{ role: 'user', content: inhoud }],
      }),
    })

    if (!antwoord.ok) {
      /* Alleen de status en de foutsoort: de inhoud bevat de afbeeldingen. */
      const tekstFout = await antwoord.text()
      console.error('anthropic', antwoord.status, tekstFout.slice(0, 300))
      return fout('De planlezer doet het even niet.', 502)
    }

    const data = await antwoord.json()
    if (data.stop_reason === 'refusal') {
      return fout('Deze afbeelding kon ik niet lezen. Probeer een andere schermafdruk.', 422)
    }
    if (data.stop_reason === 'max_tokens') {
      return fout('Dat waren te veel toetsen in één keer. Probeer een kleiner stuk.', 422)
    }
    const blok = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
    let uit: { toetsen?: unknown; opmerking?: unknown }
    try {
      uit = JSON.parse(String(blok?.text ?? ''))
    } catch {
      console.error('geen json', data.stop_reason)
      return fout('De planlezer gaf een antwoord dat ik niet kon lezen.', 502)
    }

    return new Response(JSON.stringify({
      toetsen: Array.isArray(uit.toetsen) ? uit.toetsen : [],
      opmerking: String(uit.opmerking ?? '').trim(),
      model: data.model ?? MODEL,
    }), { headers: KOPPEN })
  } catch (e) {
    console.error('huiswerk-plan', e instanceof Error ? e.message : 'onbekend')
    return fout('Er ging iets mis bij de planlezer.', 500)
  }
})

function fout(bericht: string, status: number): Response {
  return new Response(JSON.stringify({ error: bericht }), { status, headers: KOPPEN })
}
