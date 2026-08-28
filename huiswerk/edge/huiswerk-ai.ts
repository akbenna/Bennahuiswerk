/**
 * DE VRAAGBAAK — van de vraag van een kind naar de stof in de app
 *
 * Dit is een verslag van wat er in de edge function `huiswerk-ai` draait, zoals
 * `health/edge/kal-prikkel.ts` dat is voor BennaHealth. Wijzigt er iets, dan
 * hoort dit bestand mee te veranderen.
 *
 * WAAROM DIT OP DE SERVER STAAT
 *
 * De sleutel. Sanad zet hem in de browser en legt in `src/sanad/ai.ts` uit
 * waarom dat daar mag: één volwassene, zijn eigen rekening, geen tussenserver
 * die meeleest. Hier gaat het om vier kinderen die de app op elkaars telefoon
 * openen. Dan hoort de sleutel op een server, en dat is deze.
 *
 * WAT HET MODEL WEL EN NIET DOET
 *
 * Het model kiest, het verzint niet. Het krijgt de complete lijst onderwerpen
 * van dít kind mee, elk met een sleutel, en mag alleen sleutels uit die lijst
 * teruggeven. De app controleert daarna nog eens of elke sleutel echt bestaat en
 * gooit weg wat er niet in staat — dezelfde afspraak als bij BennaHealth, waar
 * het model de NEVO-regel kiest en de server met de tabelwaarde rekent.
 *
 * Dat is ook de reden dat hier geen `strict`-gereedschap of afgedwongen
 * uitvoerformaat aan te pas komt. Het antwoord wordt als JSON gevraagd en
 * gewoon geparseerd; gaat dat mis, of staat er een verzonnen onderwerp in, dan
 * valt het bij de controle in de app om en ziet het kind een gewone melding.
 * Een tweede slot op een deur die al op slot zit voegt niets toe.
 *
 * HET GAT
 *
 * Past er niets, dan hoort het model dát te zeggen in plaats van iets aan te
 * wijzen wat er toevallig op lijkt. Die gaten komen in het ouderscherm terecht;
 * ze zijn de lijst met wat er nog gemaakt moet worden, opgeschreven door de
 * kinderen zelf.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KOPPEN = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const MODEL = 'claude-opus-5'

/* Een korte klus: lees een vraag, kies hoogstens drie onderwerpen uit een lijst
   die er al ligt, en schrijf twee zinnen. Daar hoort geen diep nadenken bij, en
   een kind dat vastzit wacht niet graag. Wel `medium` en niet `low`, omdat het
   oordeel "hier staat niets voor" zorgvuldiger is dan het lijkt. */
const EFFORT = 'medium'

interface Onderwerp {
  s: string
  vak: string
  onderwerp: string
  jaar: 'nu' | 'next'
  n: number
  beheerst: number
}

interface Verzoek {
  vraag?: string
  kind?: { naam?: string; niveau?: string; volgend?: string }
  catalogus?: Onderwerp[]
}

const SYS = `Je helpt een schoolkind in Nederland de weg vinden in zijn eigen oefenapp. Het kind typt waar het op vastloopt; jij wijst de plek in de app aan waar het dat kan oefenen.

Je krijgt de complete lijst onderwerpen van dit kind. Elk onderwerp heeft een sleutel.

Regels:
- Kies hoogstens drie sleutels, en alleen sleutels die letterlijk in de lijst staan. Verzin er nooit een.
- Zet het onderwerp dat het dichtst bij de vraag ligt vooraan.
- Staat er niets in de lijst dat echt bij de vraag past, geef dan een lege lijst en beschrijf in "gat" in één zin wat er zou moeten komen. Wijs liever niets aan dan iets wat er alleen op lijkt.
- Onderwerpen met jaar "next" zijn stof van volgend jaar. Kies die alleen als het kind daar duidelijk naar vraagt, of als er dit jaar niets over gaat.

Het veld "antwoord" is voor het kind zelf:
- Twee of drie korte zinnen, in gewone taal, tutoyeren.
- Geef één concreet houvast bij de vraag — een ezelsbruggetje, de eerste stap, waar de fout meestal zit. Niet het hele antwoord voorkauwen; het kind gaat het zelf oefenen.
- Geen opsommingstekens, geen kopjes, geen emoji.
- Wijs je niets aan, zeg dan eerlijk dat dit nog niet in de app staat en wat het kind intussen kan doen.

Antwoord met uitsluitend JSON, zonder tekst eromheen:
{"antwoord": "...", "routes": ["sleutel", ...], "gat": null of "..."}`

serve(async (verzoek: Request) => {
  if (verzoek.method === 'OPTIONS') return new Response('ok', { headers: KOPPEN })

  try {
    const { vraag, kind, catalogus } = (await verzoek.json()) as Verzoek

    const tekst = String(vraag ?? '').trim()
    if (!tekst) return fout('Er staat geen vraag in.', 400)
    if (tekst.length > 500) return fout('Hou de vraag wat korter.', 400)
    if (!Array.isArray(catalogus) || !catalogus.length) return fout('Geen onderwerpen meegestuurd.', 400)

    const sleutel = Deno.env.get('ANTHROPIC_API_KEY')
    if (!sleutel) return fout('De vraagbaak is nog niet ingesteld.', 500)

    const lijst = catalogus
      .map((o) => `${o.s} · ${o.vak} › ${o.onderwerp} (${o.jaar === 'next' ? 'volgend jaar' : 'dit jaar'}, ${o.n} opgaven, ${o.beheerst} beheerst)`)
      .join('\n')

    const antwoord = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': sleutel,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: EFFORT },
        system: SYS,
        messages: [{
          role: 'user',
          content: `Het kind heet ${kind?.naam ?? 'onbekend'} en zit in ${kind?.niveau ?? 'onbekend'}`
            + ` (volgend jaar ${kind?.volgend ?? 'onbekend'}).\n\n`
            + `De vraag:\n${tekst}\n\n`
            + `De onderwerpen die deze app voor dit kind heeft:\n${lijst}`,
        }],
      }),
    })

    if (!antwoord.ok) {
      console.error('anthropic', antwoord.status, await antwoord.text())
      return fout('De vraagbaak doet het even niet.', 502)
    }

    const data = await antwoord.json()
    const blok = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
    const rauw = String(blok?.text ?? '')

    /* Het model hoort kaal JSON te sturen. Zet het er toch een ```-hek omheen,
       dan is dat geen reden om het kind een fout te tonen. */
    const schoon = rauw.replace(/^\s*```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    let uit: { antwoord?: unknown; routes?: unknown; gat?: unknown }
    try {
      uit = JSON.parse(schoon)
    } catch {
      console.error('geen json', rauw.slice(0, 400))
      return fout('De vraagbaak gaf een antwoord dat ik niet kon lezen.', 502)
    }

    return new Response(JSON.stringify({
      antwoord: String(uit.antwoord ?? '').trim(),
      routes: Array.isArray(uit.routes) ? uit.routes.map(String) : [],
      gat: uit.gat ? String(uit.gat) : null,
      model: data.model ?? MODEL,
    }), { headers: KOPPEN })
  } catch (e) {
    console.error('huiswerk-ai', e)
    return fout('Er ging iets mis bij de vraagbaak.', 500)
  }
})

function fout(bericht: string, status: number): Response {
  return new Response(JSON.stringify({ error: bericht }), { status, headers: KOPPEN })
}
