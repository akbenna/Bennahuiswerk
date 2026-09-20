/**
 * MERKGEGEVENS UIT OPEN FOOD FACTS
 *
 * Haalt producten op van Open Food Facts en schrijft er SQL van, klaar om in de
 * SQL-editor te plakken. Hij praat zelf niet met de database: geen sleutel, geen
 * verbinding, niets om te lekken. Wat eruit komt is tekst die je zelf leest
 * voordat je hem uitvoert.
 *
 * WAAROM DIT GEEN RECHTSTREEKSE KOPPELING IS
 *
 * Open Food Facts is door gebruikers ingevuld. Er staan prachtige rijen in en er
 * staat rommel in: een pak melk van 1.900 kcal per 100 g, een product zonder
 * naam, een gewicht in "1 pièce". Rechtstreeks inladen zou die rommel in een app
 * zetten die zichzelf erop laat voorstaan dat elk getal zijn herkomst kent.
 *
 * Dus filtert dit script, en het filtert streng. Wat er niet doorheen komt staat
 * onderaan in de telling, zodat je ziet hoeveel je weggooit en waarom.
 *
 * GEBRUIK
 *
 *   node gereedschap/merkgegevens.mjs --proef
 *       Draait de omzetting op een vast voorbeeldbestand en toetst de uitkomst.
 *       Geen netwerk nodig. Dit is de proef; hij hoort groen te zijn.
 *
 *   node gereedschap/merkgegevens.mjs --merk lidl --max 300 > merk-lidl.sql
 *       Haalt op en schrijft SQL naar de uitvoer.
 *
 *   node gereedschap/merkgegevens.mjs --bestand gedownload.json > merk.sql
 *       Zet een eerder opgehaald antwoord om, zonder netwerk.
 *
 * DE LICENTIE
 *
 * ODbL: gebruiken mag, bronvermelding is verplicht, en een afgeleide database
 * valt onder dezelfde voorwaarden. Die bronvermelding staat in `merk_bronnen` en
 * de poort daar laat niets zien zolang hij ontbreekt. Zie
 * `health/database/toe-te-passen/B-merkproducten.sql`.
 */

const API = 'https://world.openfoodfacts.org/api/v2/search'
const VELDEN = 'code,product_name,product_name_nl,brands,quantity,product_quantity,serving_size,nutriments,categories_tags'

/* Een pak boter is 735 kcal per 100 g; olie zit rond 900. Daarboven bestaat niet
   en is het een invoerfout, meestal kilojoules in het kcal-veld. */
const KCAL_MAX = 950

/**
 * Een naam die geen naam is maar een foto van een etiket.
 *
 * Open Food Facts vult zich deels met tekstherkenning op een kiekje, en dan komt
 * de houdbaarheidsdatum mee die ernaast gedrukt staat. Vijf van de honderd Chef
 * Select-producten heetten zo: "23-12-25 406 56 03:29 chef select serveertip KIP
 * P" en "IJSBERGOLA gewassen 200ge 10/08/2025".
 *
 * Wat ze gemeen hebben is niet dat er cijfers in staan ("0% Griekse yoghurt" en
 * "7-Up" hebben die ook) maar dat er een klok, een datum of een streepjescode in
 * staat. Geen van die drie hoort ooit in een productnaam, en juist daarom mag de
 * regel hierop scherp zijn en niet op cijferdichtheid. Die laatste had ik eerst,
 * en die gooide "0% Griekse yoghurt 500 g" weg.
 */
const AFDRUK = /\d{1,2}:\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{6,}/

/**
 * Hoe ver de energie van zijn eigen macro's mag afwijken.
 *
 * Eiwit en koolhydraten leveren 4 kcal per gram, vet 9. Dat is geen schatting
 * maar de afspraak waarmee het getal op het etiket gemaakt wordt, dus een etiket
 * hoort binnen een procent of tien uit te komen. Twintig procent wettelijke
 * speelruimte en afronding erbij, en veertig procent is nog steeds ruim.
 *
 * Daarboven is het geen etiket meer maar een invoerfout, iemand die de energie
 * van de verpakking overnam en de macro's per 100 g, of andersom. In deze honderd
 * producten was er precies één: "Kipfilet Kanapka", 147 kcal terwijl 9,3 g eiwit,
 * 10,1 g vet en 25,4 g koolhydraten op 230 uitkomen. Al het andere lag tussen
 * 0,69 en 1,08.
 *
 * De ondergrens is losser dan de bovengrens, en dat is geen slordigheid: bij
 * bladgroente van vijftien kcal telt vezel mee dat hier buiten de som valt, en
 * telt afronding op 0,6 g dubbel zo hard.
 *
 * EN DAAROM GELDT DE BODEM ALLEEN NAAR BENEDEN
 *
 * Die twee redenen (vezel buiten de som, afronding op kleine getallen) drukken
 * de som omláág. Ze verklaren dus een lage verhouding en niet een hoge. Eerst
 * stond de bodem op allebei de grenzen, en toen glipte "Choco Pudding" erdoor:
 * 45,7 kcal terwijl 10 g eiwit, 1,5 g vet en 6,7 g koolhydraten op 80 uitkomen.
 * De kilojoules in dezelfde rij zeggen 339, dus 81, het kcal-veld was verkeerd
 * uit de kJ gerekend, en dat is precies wat deze zeef hoort te vangen.
 *
 * Boven de bodem geldt de bovengrens dus ook: een som die bijna twee keer de
 * opgegeven energie is, is bij vijfenveertig kcal even onmogelijk als bij
 * driehonderd.
 */
const MACRO_ONDER = 0.5
const MACRO_BOVEN = 1.4
const MACRO_VANAF_KCAL = 50

/**
 * Hoe ver de energie van zijn eigen kilojoules mag afwijken.
 *
 * Op het etiket staan kcal en kJ allebei, en het een is het ander gedeeld door
 * 4,184. Ze kunnen dus niet los van elkaar fout zijn: staan ze ver uit elkaar,
 * dan heeft iemand er één van de twee verkeerd overgenomen. Dat is een tweede
 * getuige naast de macro's, en hij vangt iets anders.
 *
 * Dat is te meten. Over 415 producten met allebei de velden is de mediaan
 * afwijking 0,43 %, en boven de 7 % zitten er nog twaalf. Tussen 14,9 % en
 * 23,6 % ligt níets. Twintig procent staat dus midden in een leeg gat en is
 * niet op één product afgesteld, daar zit hij met opzet.
 *
 * Onder de grens blijft rommel staan die er hoort te blijven: "Italiaanse
 * Roerbakgroenten" wijkt 12,5 % af, maar dat is 22 kcal tegen 19,2, en op zulke
 * kleine getallen is afronding alleen al genoeg.
 *
 * Wat hij erbij vangt dat de macro's laten lopen is "CHILLI MINI KABANOSSI":
 * 304 kcal, terwijl de macro's op 379 uitkomen en de kilojoules 1572 zeggen,
 * dus 376. Twee getuigen wijzen dezelfde kant op, maar de macro-verhouding is
 * 1,25 en blijft daarmee onder de 1,4.
 */
const KJ_PER_KCAL = 4.184
const KJ_AFWIJKING = 0.2

/**
 * Hoeveel gram er in honderd gram past.
 *
 * DE DERDE GETUIGE, EN WAAROM DE EERSTE TWEE HEM NIET VERVANGEN
 *
 * Die twee vergelijken de energie met iets anders: met de macro's, en met de
 * kilojoules. Ze vangen dus elke fout waarbij één getal uit de pas loopt. Waar
 * ze blind voor zijn is een rij waarin álle getallen mét elkaar kloppen en
 * samen toch niet kunnen bestaan.
 *
 * Zo'n rij zat in het eerste wat ik van Upfront ophaalde. "Eiwit Granola",
 * streepjescode 8720986893725: 819,4 kcal, 39,1 g vet, 80,58 g koolhydraten,
 * 42,5 g eiwit, 12,58 g vezel. De macro's komen uit op 844 kcal, verhouding
 * 1,03, ruim binnen de grens. De kilojoules zeggen 870, zes procent ernaast,
 * ook goed. Beide getuigen knikken.
 *
 * Maar tel de grammen: 174,8 gram in honderd gram product. Dat is geen
 * onnauwkeurigheid, dat is een onmogelijkheid, en zonder deze zeef was het als
 * geloofwaardige granola de database in gegaan, met twee keurige vinkjes erbij.
 *
 * WAAR DE GRENS LIGT
 *
 * Honderd gram is de natuurkundige bovengrens: vet, koolhydraten, eiwit en
 * vezel zijn in de Europese etiketteringsregels vier gescheiden posten (vezel
 * telt níét mee in koolhydraten), en daar komen water, zout en as nog naast. De
 * som kan dus nooit boven de honderd.
 *
 * Er staat 105 en niet 100, en dat is afronding en geen coulance. Een etiket dat
 * vier posten elk op hele grammen afrondt kan er vier keer een halve gram naast
 * zitten. Twee gram speling plus wat marge is genoeg; alles daarboven is geen
 * afronding meer.
 */
const MASSA_MAX_G = 105

/** Wat er nodig is voordat een rij de moeite waard is. */
function bruikbaar(p) {
  const naam = (p.product_name_nl || p.product_name || '').trim()
  if (!naam) return 'geen naam'
  if (naam.length > 200) return 'naam onwaarschijnlijk lang'
  if (AFDRUK.test(naam)) return 'naam is een etiketafdruk'
  const n = p.nutriments || {}
  const kcal = getal(n['energy-kcal_100g'])
  if (kcal == null) return 'geen energie per 100 g'
  if (kcal < 0 || kcal > KCAL_MAX) return 'energie buiten bereik'
  if (!p.code) return 'geen streepjescode'
  if (kcal > 0) {
    const uit = 4 * (getal(n.proteins_100g) ?? 0) + 9 * (getal(n.fat_100g) ?? 0)
      + 4 * (getal(n.carbohydrates_100g) ?? 0)
    const deel = uit / kcal
    /* Te hoog kan altijd: daar is geen onschuldige verklaring voor. Te laag
       alleen boven de bodem: daaronder verklaart vezel en afronding het. */
    if (deel > MACRO_BOVEN) return 'energie klopt niet met de macro\'s'
    if (deel < MACRO_ONDER && kcal >= MACRO_VANAF_KCAL) {
      return 'energie klopt niet met de macro\'s'
    }
    const kj = kilojoules(n)
    if (kj != null && Math.abs(kj / KJ_PER_KCAL - kcal) / kcal > KJ_AFWIJKING) {
      return 'energie klopt niet met de kilojoules'
    }
  }
  /* Buiten het `kcal > 0`-blok: dit is een massa en geen energie, dus het geldt
     ook voor een product dat nul kilocalorieën opgeeft. */
  const massa = (getal(n.fat_100g) ?? 0) + (getal(n.carbohydrates_100g) ?? 0)
    + (getal(n.proteins_100g) ?? 0) + (getal(n.fiber_100g) ?? 0)
  if (massa > MASSA_MAX_G) return 'de macro\'s wegen samen meer dan 100 g'
  return null
}

/**
 * De kilojoules per 100 g, uit welk veld ze ook komen.
 *
 * Meestal staat er `energy-kj_100g`. Staat die er niet, dan draagt `energy_100g`
 * hem soms, en dan zegt `energy_unit` in welke eenheid. Zonder die eenheid weten
 * we niets: `energy_100g` kán ook kcal zijn, en die dan door 4,184 delen maakt
 * van elk product een fout.
 */
function kilojoules(n) {
  const direct = getal(n['energy-kj_100g'])
  if (direct != null && direct > 0) return direct
  if (n.energy_unit !== 'kJ') return null
  const los = getal(n.energy_100g)
  return los != null && los > 0 ? los : null
}

/** Het eerste merk uit `brands`, in de schrijfwijze die de oogst het vaakst gebruikt. */
function merknaam(p, spelling) {
  const merk = (p.brands || '').split(',')[0]?.trim()
  if (!merk) return null
  return spelling?.get(merk.toLowerCase()) ?? merk
}

function getal(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * "30 g", "1 portie (25 g)", "2 stuks" → gram en naam.
 *
 * Alleen gram telt. "1 pièce" zegt niets over gewicht, en er een getal van maken
 * zou verzinnen zijn. Dan liever niets: het portievenster valt terug op de
 * huishoudmaten van de groep, en die zijn tenminste doordacht.
 */
export function porties(tekst) {
  if (!tekst) return { gram: null, naam: null }
  const s = String(tekst).trim()
  /* "gram" voluit hoort er ook bij, en dat stond er eerst niet in: `g\b`
     mislukt op "10 gram", want na de g komt een letter. Vier van de eerste
     twintig Lidl-producten verloren daardoor hun portiegewicht, Open Food
     Facts schrijft het vaker voluit dan afgekort.

     De langste vorm staat vooraan uit gewoonte, niet uit noodzaak: een
     mutatieproef met `g|gr|gram` bleef groen, want de alternatie zoekt terug
     zodra `\b` niet uitkomt. Ik dacht van wel en had het mis. */
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:gram|gr|g)\b/i)
  if (!m) return { gram: null, naam: s.slice(0, 60) || null }
  const gram = Number(m[1].replace(',', '.'))
  if (!Number.isFinite(gram) || gram <= 0 || gram > 5000) return { gram: null, naam: s.slice(0, 60) }
  return { gram, naam: s.slice(0, 60) }
}

/**
 * Enkele aanhalingstekens verdubbelen. Dit is de enige ontsnapping die SQL wil.
 *
 * En het type erbij op een lege waarde. Dat is geen overdaad: staat een kolom in
 * álle rijen van een `values`-lijst op null, dan raadt Postgres er `text` van, en
 * dan weigert hij de invoer met "column is of type numeric but expression is of
 * type text". Dat gebeurde hier echt, en het viel pas op toen de gegenereerde SQL
 * werkelijk werd uitgevoerd, niet toen hij er goed uitzag.
 */
export function q(v) {
  if (v === null || v === undefined || v === '') return 'null::text'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

function num(v) {
  const n = getal(v)
  return n == null ? 'null::numeric' : String(Math.round(n * 100) / 100)
}

/**
 * Welke schrijfwijze een merk krijgt als de oogst het niet met zichzelf eens is.
 *
 * Open Food Facts neemt het merk over zoals de invuller het typte, en dus stond
 * er acht keer "Dulano" en één keer "DULANO". Dat zijn in de database twee
 * merken: wie op het ene filtert mist het andere.
 *
 * De regel kiest de schrijfwijze die het vaakst voorkomt, en verzint dus nooit
 * iets, hij kan alleen een spelling opleveren die in de bron staat. Bij gelijk
 * spel wint de eerste, want dan is er geen grond om te kiezen. "Chef Select"
 * blijft "Chef Select": er is niets om tegen af te wegen.
 */
export function merkSpelling(producten) {
  const tellen = new Map()
  for (const p of producten) {
    const merk = (p.brands || '').split(',')[0]?.trim()
    if (!merk) continue
    const sleutel = merk.toLowerCase()
    if (!tellen.has(sleutel)) tellen.set(sleutel, new Map())
    const vormen = tellen.get(sleutel)
    vormen.set(merk, (vormen.get(merk) ?? 0) + 1)
  }
  const uit = new Map()
  for (const [sleutel, vormen] of tellen) {
    let beste = null, hoogste = -1
    for (const [vorm, aantal] of vormen) {
      if (aantal > hoogste) { beste = vorm; hoogste = aantal }
    }
    uit.set(sleutel, beste)
  }
  return uit
}

/** Eén product → één waardenrij, of null als het niet door de zeef komt. */
export function rij(p, spelling) {
  if (bruikbaar(p)) return null
  const n = p.nutriments || {}
  const naam = (p.product_name_nl || p.product_name || '').trim()
  const portie = porties(p.serving_size)
  const verpakking = getal(p.product_quantity)
  return '  (' + [
    q(String(p.code)),
    q(naam),
    q(merknaam(p, spelling)),
    q((p.categories_tags || [])[0]?.replace(/^[a-z]{2}:/, '') || null),
    num(n['energy-kcal_100g']),
    num(n.proteins_100g),
    num(n.fat_100g),
    num(n.carbohydrates_100g),
    num(n.fiber_100g),
    num(n.sugars_100g),
    verpakking != null && verpakking > 0 ? num(verpakking) : 'null::numeric',
    portie.gram != null ? num(portie.gram) : 'null::numeric',
    q(portie.naam),
  ].join(', ') + ')'
}

/* De kolommen die een herimport mag bijwerken. Eén lijst, twee keer gebruikt:
   in de `set` en in de `where` eronder. Twee lijsten die uiteen kunnen lopen zou
   betekenen dat een veld stilletjes buiten de vergelijking valt en dus nooit een
   bijwerking uitlokt. `synoniemen` staat er met opzet niet bij: die kolom vult
   een mens, en wat een mens invulde overschrijft een import niet. */
const KOLOMMEN = [
  'naam', 'merk', 'groep', 'energie_kcal_per_100g', 'eiwit_g', 'vet_g',
  'koolhydraten_g', 'vezels_g', 'suikers_g', 'verpakking_gram',
  'portie_gram', 'portie_naam',
]

/**
 * De hele SQL. Eén insert met `on conflict do update`, zodat opnieuw draaien
 * bijwerkt en niet verdubbelt, dezelfde afspraak als in de SQL-bestanden zelf.
 *
 * De `where` onder de `set` is wat die afspraak waarmaakt: zonder hem zet een
 * tweede run de tijdstempel van elke rij opnieuw, en dan is "twee keer draaien
 * verandert niets" een bewering in plaats van een eigenschap. Mét hem raakt een
 * herimport alleen de rijen waarvan bij de bron werkelijk iets veranderd is.
 */
export function naarSql(producten) {
  const rijen = []
  const weg = {}
  /* DEZELFDE STREEPJESCODE TWEE KEER LAAT DE HELE OPDRACHT OMVALLEN
 
     Niet "de tweede wint" en niet "de tweede wordt genegeerd": Postgres weigert
     de hele insert met "ON CONFLICT DO UPDATE command cannot affect row a
     second time". Eén dubbele rij en er komt dus niets binnen.
 
     Dat is geen theorie. Open Food Facts bladert over gegevens die ondertussen
     veranderen, dus hetzelfde product kan op twee bladzijden staan; en één
     product kan onder twee merken vallen, wat precies gebeurt bij de
     huismerken van dezelfde winkel. `haal()` gooit alle bladzijden op één hoop
     en `--bestand` mag meerdere bestanden aan, dus beide wegen komen hier uit.
 
     De eerste wint. Dat is geen keuze tussen twee goede waarden maar tussen
     twee keer hetzelfde product; wie ze werkelijk wil vergelijken heeft de
     bronbestanden nog. */
  const gezien = new Set()
  const spelling = merkSpelling(producten)
  for (const p of producten) {
    const reden = bruikbaar(p)
    if (reden) { weg[reden] = (weg[reden] ?? 0) + 1; continue }
    const code = String(p.code)
    if (gezien.has(code)) { weg['dezelfde streepjescode al gezien'] = (weg['dezelfde streepjescode al gezien'] ?? 0) + 1; continue }
    gezien.add(code)
    rijen.push(rij(p, spelling))
  }
  const telling = Object.entries(weg).sort((a, b) => b[1] - a[1])
    .map(([r, n]) => `--   ${String(n).padStart(5)}  ${r}`).join('\n')

  const kop = [
    '-- Gegenereerd met gereedschap/merkgegevens.mjs. Niet met de hand bijwerken.',
    `-- ${producten.length} producten bekeken, ${rijen.length} bruikbaar.`,
    weg && telling ? '-- Weggelaten:\n' + telling : '-- Niets weggelaten.',
    '--',
    '-- Kijk deze rijen na vóór je ze uitvoert. Open Food Facts is door gebruikers',
    '-- ingevuld; de zeef vangt het grove, niet het subtiele.',
    '',
  ].join('\n')

  if (!rijen.length) return kop + '-- Geen bruikbare rijen. Er valt niets in te voeren.\n'

  return kop + [
    'insert into merk_producten as p',
    '  (bron, barcode, naam, merk, groep, energie_kcal_per_100g, eiwit_g, vet_g,',
    '   koolhydraten_g, vezels_g, suikers_g, verpakking_gram, portie_gram, portie_naam)',
    "select 'openfoodfacts', v.* from (values",
    rijen.join(',\n'),
    ') as v(barcode, naam, merk, groep, kcal, eiwit, vet, kh, vezel, suiker, verpakking, portie, portienaam)',
    'on conflict (bron, barcode) do update set',
    '  naam = excluded.naam, merk = excluded.merk, groep = excluded.groep,',
    '  energie_kcal_per_100g = excluded.energie_kcal_per_100g,',
    '  eiwit_g = excluded.eiwit_g, vet_g = excluded.vet_g,',
    '  koolhydraten_g = excluded.koolhydraten_g, vezels_g = excluded.vezels_g,',
    '  suikers_g = excluded.suikers_g, verpakking_gram = excluded.verpakking_gram,',
    '  portie_gram = excluded.portie_gram, portie_naam = excluded.portie_naam,',
    '  geimporteerd_op = now()',
    'where (' + KOLOMMEN.map((k) => 'p.' + k).join(', ') + ')',
    '   is distinct from',
    '      (' + KOLOMMEN.map((k) => 'excluded.' + k).join(', ') + ');',
    '',
    '-- Nakijken:',
    "select count(*) as producten, count(verpakking_gram) as met_gewicht from merk_producten where bron = 'openfoodfacts';",
    '',
  ].join('\n')
}

/**
 * Hoe lang wachten na een weigering. Vijf seconden, dan vijftien, dan
 * vijfenveertig.
 *
 * Oplopend en niet vast: een server die "te druk" zegt heeft niets aan een
 * cliënt die na elke weigering even hard terugkomt. Dat maakt het drukker, niet
 * rustiger.
 */
export function wachttijd(poging) {
  return 5000 * 3 ** (poging - 1)
}

const wacht = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Eén bladzijde ophalen, met geduld.
 *
 * Open Food Facts geeft 503 als hun zoek-API het te druk heeft en 429 als jij te
 * snel vraagt. Allebei betekenen "straks nog eens", niet "het bestaat niet".
 * Vandaar vier pogingen; daarna houdt het op en zegt het script wat er was.
 */
async function haalBladzijde(url, pogingen = 4) {
  for (let poging = 1; ; poging++) {
    const a = await fetch(url, {
      headers: { 'User-Agent': 'BennaHealth/1.0 (gezinsapp, niet-commercieel)' },
    })
    if (a.ok) return a.json()
    if ((a.status === 503 || a.status === 429) && poging < pogingen) {
      const ms = wachttijd(poging)
      console.error(`  Open Food Facts gaf ${a.status}; ${ms / 1000} s wachten en dan poging ${poging + 1}`)
      await wacht(ms)
      continue
    }
    throw new Error(
      `Open Food Facts gaf ${a.status} na ${poging} poging(en). `
      + (a.status === 503 || a.status === 429
         ? 'Hun zoek-API heeft het druk. Probeer het later nog eens, of haal minder op met --max.'
         : 'Kijk of het merk goed geschreven is: albert-heijn en niet "Albert Heijn".'))
  }
}

/* Tussen twee bladzijden. Open Food Facts vraagt om hoogstens tien
   zoekopdrachten per minuut; zes seconden blijft daar netjes onder. Dat maakt
   driehonderd producten een klus van een halve minuut in plaats van drie
   seconden, en dat is de prijs van een server die van iedereen is. */
const PAUZE_MS = 6000

async function haal(merk, max) {
  const uit = []
  for (let bladzijde = 1; uit.length < max; bladzijde++) {
    if (bladzijde > 1) await wacht(PAUZE_MS)
    const url = `${API}?countries_tags_en=netherlands&brands_tags=${encodeURIComponent(merk)}`
      + `&fields=${VELDEN}&page_size=100&page=${bladzijde}`
    console.error(`  bladzijde ${bladzijde} ophalen…`)
    const d = await haalBladzijde(url)
    if (!d.products?.length) break
    uit.push(...d.products)
    if (d.products.length < 100) break
  }
  return uit.slice(0, max)
}

/* ------------------------------------------------------------------ proef -- */

const VOORBEELD = [
  { code: '20123456', product_name_nl: 'Roomboter', brands: 'Lidl', product_quantity: 250,
    serving_size: '10 g', categories_tags: ['en:butters'],
    nutriments: { 'energy-kcal_100g': 735, proteins_100g: 0.7, fat_100g: 82, carbohydrates_100g: 0.6 } },
  { code: '20999111', product_name: 'Halfvolle melk', brands: 'AH,Albert Heijn',
    product_quantity: 1000, serving_size: '250 ml',
    nutriments: { 'energy-kcal_100g': 46, proteins_100g: 3.5, fat_100g: 1.5, carbohydrates_100g: 4.7 } },
  { code: '20777222', product_name_nl: "Pindakaas 100% pinda's", brands: 'Lidl',
    product_quantity: 350, serving_size: '1 portie (15 g)',
    nutriments: { 'energy-kcal_100g': 621, proteins_100g: 26, fat_100g: 51, carbohydrates_100g: 11, fiber_100g: 8 } },
  /* DE DERDE GETUIGE: een rij waarin alles mét elkaar klopt en niets kán.
     Dit is "Eiwit Granola" van Upfront, streepjescode 8720986893725, letterlijk
     zoals Open Food Facts hem geeft. De macro's komen uit op 844 kcal tegen de
     opgegeven 819,4 (verhouding 1,03), de kilojoules op 870 (zes procent af):
     beide bestaande zeven laten hem door. De grammen tellen op tot 174,8 per
     honderd. */
  { code: '8720986893725', product_name_nl: 'Eiwit Granola', brands: 'Upfront',
    product_quantity: 300, serving_size: '10.0g',
    nutriments: { 'energy-kcal_100g': 819.4, 'energy-kj_100g': 3639.7, proteins_100g: 42.5,
                  fat_100g: 39.1, carbohydrates_100g: 80.58, fiber_100g: 12.58 } },
  /* En de tegenhanger, want een zeef die alleen maar wegneemt bewijst niets.
     Clear Whey van hetzelfde merk: 80 g eiwit per 100 g is extreem en volkomen
     echt, het is nagenoeg zuiver poeder. Samen 82,3 g, dus hij blijft. */
  { code: '8720986891554', product_name_nl: 'Clear Whey Tropical', brands: 'Upfront',
    serving_size: '25 g',
    nutriments: { 'energy-kcal_100g': 338, 'energy-kj_100g': 1414, proteins_100g: 80,
                  fat_100g: 1.8, carbohydrates_100g: 0.5, fiber_100g: 0 } },
  /* Rommel die eruit hoort te vallen. */
  { code: '1', product_name: '', nutriments: { 'energy-kcal_100g': 100 } },
  { code: '2', product_name: 'Kilojoules in het verkeerde veld', nutriments: { 'energy-kcal_100g': 1900 } },
  { code: '3', product_name: 'Zonder voedingswaarde', nutriments: {} },
  { product_name: 'Zonder streepjescode', nutriments: { 'energy-kcal_100g': 200 } },
  { code: '4', product_name: "Sinaasappelsap 'vers'", brands: 'Lidl', serving_size: '1 pièce',
    nutriments: { 'energy-kcal_100g': 45, carbohydrates_100g: 10 } },
  /* Tekstherkenning op een kiekje van de verpakking: de houdbaarheidsdatum en de
     klok staan er letterlijk in. Vijf van de eerste honderd Chef Select-producten
     heetten zo, en dit zijn drie van die vijf, woord voor woord.

     Ze staan hier apart en niet als één rij die alles tegelijk heeft, want die ene
     rij bewijst niets: hij sneuvelt ook als er nog maar één van de drie
     herkenningen over is. Zo sneuvelt elke herkenning aan zijn eigen geval. */
  { code: '5', product_name: '406 80 14:36 chef select serveertip ZALM SALADE VE', brands: 'Lidl',
    nutriments: { 'energy-kcal_100g': 200, proteins_100g: 10, fat_100g: 10, carbohydrates_100g: 15 } },
  { code: '5b', product_name: 'IJSBERGOLA gewassen 200ge 10/08/2025', brands: 'Lidl',
    nutriments: { 'energy-kcal_100g': 200, proteins_100g: 10, fat_100g: 10, carbohydrates_100g: 15 } },
  { code: '5c', product_name: 'chaf You 44280651 Beter Leven ED KIP GRILLWORST 2', brands: 'Lidl',
    nutriments: { 'energy-kcal_100g': 200, proteins_100g: 10, fat_100g: 10, carbohydrates_100g: 15 } },
  /* De energie van de verpakking naast de macro's per 100 g: 147 kcal terwijl
     4×9,3 + 9×10,1 + 4×25,4 op 230 uitkomt. */
  { code: '6', product_name: 'Kipfilet kanapka', brands: 'Lidl',
    nutriments: { 'energy-kcal_100g': 147, proteins_100g: 9.3, fat_100g: 10.1, carbohydrates_100g: 25.4 } },
  /* En eentje die er juist wél doorheen hoort: cijfers in een naam zijn gewoon,
     een klok en een streepjescode niet. Een zeef op cijferdichtheid gooide deze
     weg, en dat is precies waarom die er niet staat. */
  { code: '7', product_name_nl: '0% Griekse yoghurt 500 g', brands: 'Lidl', product_quantity: 500,
    nutriments: { 'energy-kcal_100g': 57, proteins_100g: 10, fat_100g: 0, carbohydrates_100g: 4 } },
  /* En bladgroente, waar de macro-som niet opgaat zonder dat er iets mis is: de
     vezel zit niet in de koolhydraten en op 0,5 g telt afronding dubbel. Zes van
     vijftien kcal is 0,40: ruim onder de ondergrens, en toch een goede rij.
     Daarvoor staat de bodem van vijftig kcal er. */
  { code: '8', product_name_nl: 'Witte champignons gesneden', brands: 'Lidl', product_quantity: 250,
    nutriments: { 'energy-kcal_100g': 15, proteins_100g: 0.5, fat_100g: 0, carbohydrates_100g: 1, fiber_100g: 2 } },
  /* Weinig energie én een som die er bijna twee keer boven ligt. Dit is "Choco
     Pudding" van Milbona, letterlijk: 45,7 kcal terwijl 10 g eiwit, 1,5 g vet en
     6,7 g koolhydraten op 80 uitkomen. De kilojoules in dezelfde rij zeggen 81,
     dus het kcal-veld is verkeerd uit de kJ gerekend.
     Stond de bodem van vijftig kcal op allebei de grenzen, dan glipte hij erdoor
, en dat deed hij ook, tot deze rij hier kwam te staan. */
  { code: '9', product_name_nl: 'Choco Pudding', brands: 'Milbona', product_quantity: 500,
    nutriments: { 'energy-kcal_100g': 45.7, proteins_100g: 10, fat_100g: 1.5,
                  carbohydrates_100g: 6.7 } },
  /* Dezelfde roomboter nog een keer, met een andere naam. Zo komt het binnen:
     Open Food Facts bladert over gegevens die ondertussen veranderen, en één
     product kan onder twee huismerken van dezelfde winkel vallen. Twee rijen
     met dezelfde streepjescode laten de héle insert omvallen, niet de rij, de
     opdracht. */
  { code: '20123456', product_name_nl: 'Roomboter ongezouten', brands: 'Milbona',
    product_quantity: 250, serving_size: '10 g',
    nutriments: { 'energy-kcal_100g': 737, proteins_100g: 0.6, fat_100g: 82, carbohydrates_100g: 0.6 } },
  /* De kilojoules spreken het kcal-veld tegen, en de macro's merken het niet.
     Dit is "CHILLI MINI KABANOSSI" van Dulano, letterlijk: 304 kcal, terwijl de
     macro's op 379 uitkomen (verhouding 1,25, dus onder de 1,4) en de kilojoules
     1572 zeggen, dus 376. Zonder de kJ-toets komt deze rij erdoor. */
  { code: '10', product_name_nl: 'Chilli mini kabanossi', brands: 'Dulano', product_quantity: 250,
    nutriments: { 'energy-kcal_100g': 304, 'energy-kj_100g': 1572,
                  proteins_100g: 24, fat_100g: 31, carbohydrates_100g: 1, fiber_100g: 0 } },
  /* En eentje waar de kilojoules het kcal-veld juist bevestigen. Die hoort er
     gewoon door: anders zou de toets simpelweg alles met een kJ-veld weigeren en
     zou de proef hierboven niets bewijzen. */
  { code: '11', product_name_nl: 'Bockworst gerookt', brands: 'Dulano', product_quantity: 550,
    nutriments: { 'energy-kcal_100g': 221, 'energy-kj_100g': 916,
                  proteins_100g: 12, fat_100g: 19, carbohydrates_100g: 0.5 } },
  /* Zonder `energy-kj_100g`, maar met `energy_100g` én de eenheid erbij. Dan zijn
     de kilojoules alsnog bekend, en spreken ze tegen: 2050 kJ is 490 kcal, niet
     390. Merk op dat de macro's hier niets zeggen, die komen op 481 uit, wat bij
     390 een verhouding van 1,23 is. */
  { code: '12', product_name_nl: 'Fuet extra knoflook', brands: 'Dulano',
    nutriments: { 'energy-kcal_100g': 390, energy_100g: 2050, energy_unit: 'kJ',
                  proteins_100g: 28.4, fat_100g: 39.1, carbohydrates_100g: 3.8, fiber_100g: 4.4 } },
  /* DEZELFDE VELDNAAM, ANDERE EENHEID
     `energy_100g` draagt niet altijd kilojoules. Staat er geen eenheid bij, of
     staat er kcal, dan weten we níets en mag er niet gedeeld worden, anders
     wordt 445 gedeeld door 4,184 en valt elk goed product om. Deze rij hoort er
     dus gewoon door. */
  { code: '13', product_name_nl: 'Green canyon oats & honey', brands: 'Crownfield', product_quantity: 252,
    nutriments: { 'energy-kcal_100g': 445, energy_100g: 445, energy_unit: 'kcal',
                  proteins_100g: 9.1, fat_100g: 16, carbohydrates_100g: 63 } },
  /* EN DE ANDERE KANT VAN DE GRENS
     Deze rij hoort er júist door, en pint de grens vast aan de onderkant. Dit is
     "Italiaanse Roerbakgroenten", letterlijk: 22 kcal terwijl 80,5 kJ op 19,2
     uitkomt, twaalf en een half procent ernaast. Op zulke kleine getallen doet
     afronding dat in haar eentje: een halve kcal is hier al twee procent.
     Zonder deze rij zou een grens van vijf procent er net zo groen uitzien, en
     dan zou de proef niet over een grens gaan maar over de kabanossi alleen. */
  { code: '15', product_name_nl: 'Italiaanse roerbakgroenten', brands: 'Lidl', product_quantity: 750,
    nutriments: { 'energy-kcal_100g': 22, 'energy-kj_100g': 80.5,
                  proteins_100g: 1.7, fat_100g: 0.4, carbohydrates_100g: 2.4, fiber_100g: 2.1 } },
  /* Hetzelfde merk, geschreeuwd. Open Food Facts neemt over wat de invuller
     typte, en dan staan er twee merken in de database waar er één hoort. */
  { code: '14', product_name_nl: 'Saucisses de Thuringe', brands: 'DULANO', product_quantity: 500,
    nutriments: { 'energy-kcal_100g': 265, proteins_100g: 14, fat_100g: 22.6, carbohydrates_100g: 1 } },
]

function proef() {
  const eis = (goed, wat) => { if (!goed) { console.error('MIS: ' + wat); process.exitCode = 1 } else console.log('ok  ' + wat) }

  eis(porties('30 g').gram === 30, 'een portie in gram wordt gelezen')
  eis(porties('10 gram').gram === 10, '"gram" voluit ook, anders valt een kwart weg')
  eis(porties('35g').gram === 35, 'zonder spatie ook')
  eis(porties('500 mg').gram === null, 'milligram is geen gram')
  eis(porties('1 portie (15 g)').gram === 15, 'gram tussen haakjes ook')
  eis(porties('250 ml').gram === null, 'milliliter is geen gram en wordt niet verzonnen')
  eis(porties('1 pièce').gram === null, 'een stuk zonder gewicht levert niets op')
  eis(porties(null).gram === null && porties('').naam === null, 'niets in, niets uit')

  /* Het wachten loopt op. Een vaste wachttijd zou een drukke server even hard
     blijven bestoken; dat maakt het drukker en niet rustiger. */
  eis(wachttijd(1) === 5000 && wachttijd(2) === 15000 && wachttijd(3) === 45000,
      'na een weigering wordt er steeds langer gewacht')
  eis(wachttijd(2) > wachttijd(1) && wachttijd(3) > wachttijd(2),
      'en nooit korter dan de vorige keer')

  eis(q("Sinaasappelsap 'vers'") === "'Sinaasappelsap ''vers'''", 'aanhalingstekens worden verdubbeld')
  eis(q(null) === 'null::text' && q('') === 'null::text', 'leeg wordt een null mét type')

  const sql = naarSql(VOORBEELD)
  /* Zestien producten, zes bruikbaar. Die verhouding staat er met opzet in: valt
     de zeef ooit weg, dan komen er zestien doorheen en gaat deze proef om. */
  eis(/24 producten bekeken, 11 bruikbaar/.test(sql), 'elf van de vierentwintig komen erdoor')
  for (const [reden, n] of [['geen naam', 1], ['energie buiten bereik', 1],
                            ['geen energie per 100 g', 1], ['geen streepjescode', 1],
                            ['naam is een etiketafdruk', 3],
                            ["energie klopt niet met de macro's", 2],
                            ['dezelfde streepjescode al gezien', 1],
                            ["de macro's wegen samen meer dan 100 g", 1]]) {
    eis(new RegExp(`${n}  ${reden}`).test(sql), `weggelaten wordt geteld: ${n}× ${reden}`)
  }
  /* En de drie die alleen op hun naam sneuvelen, sneuvelen ook echt: een telling
     die klopt terwijl de rij er toch in staat is geen zeef maar een boekhouding. */
  eis(!sql.includes('serveertip') && !sql.includes('IJSBERGOLA') && !sql.includes('44280651'),
      'alle drie de etiketafdrukken staan er niet in, klok, datum én code')
  /* De bodem van vijftig kcal: zonder hem valt deze goede rij op 0,40 af. */
  eis(sql.includes('Witte champignons gesneden'),
      'bladgroente overleeft de macro-zeef, want daar telt vezel mee dat buiten de som valt')
  eis(!sql.includes('Kipfilet') && !sql.includes("'6'"), 'de rij die zichzelf tegenspreekt staat er niet in')
  eis(sql.includes('0% Griekse yoghurt 500 g'),
      'een naam met cijfers erin blijft, het gaat om klokken en codes, niet om cijfers')
  eis(sql.includes("'20123456'") && !sql.includes("'1900'"), 'de goede rijen staan erin, de rommel niet')
  eis(sql.includes('on conflict (bron, barcode) do update'), 'opnieuw draaien werkt bij in plaats van te verdubbelen')
  /* TWEE KEER DRAAIEN VERANDERT NIETS, EN DAT IS DEZE REGEL

     De `set` zet `geimporteerd_op = now()`. Zonder de `where` eronder raakt een
     tweede run dus elke rij, ook als er bij de bron niets veranderd is, en dan
     is de afspraak uit CLAUDE.md gebroken door de tijdstempel alleen.

     Er wordt hier niet alleen op het bestaan van die `where` getoetst maar op
     zijn volledigheid: elke kolom die de `set` bijwerkt hoort ook in de
     vergelijking te staan. Een kolom die wel bijgewerkt wordt maar niet
     meevergeleken zou stilletjes nooit meer bijwerken. */
  const setblok = sql.slice(sql.indexOf('do update set'), sql.indexOf('where ('))
  const whereblok = sql.slice(sql.indexOf('where ('), sql.indexOf('-- Nakijken:'))
  eis(/\nwhere \(p\./.test(sql) && whereblok.includes('is distinct from'),
      'een herimport die niets verandert laat de rijen met rust')
  for (const kolom of ['naam', 'merk', 'groep', 'energie_kcal_per_100g', 'eiwit_g',
                       'vet_g', 'koolhydraten_g', 'vezels_g', 'suikers_g',
                       'verpakking_gram', 'portie_gram', 'portie_naam']) {
    eis(setblok.includes(kolom + ' = excluded.' + kolom), `de set werkt ${kolom} bij`)
    eis(whereblok.includes('p.' + kolom) && whereblok.includes('excluded.' + kolom),
        `${kolom} telt mee in de vergelijking die de bijwerking tegenhoudt`)
  }
  /* `synoniemen` vult een mens. Een import die hem aanraakt (in de set of in de
     vergelijking) zou handwerk overschrijven of eraan gaan tornen. */
  eis(!sql.includes('synoniemen'), 'de import raakt de synoniemen niet aan')
  eis(!sql.includes("''vers''',") || sql.includes("''vers'''"), 'de ontsnapping komt ook in de uitvoer terecht')

  /* De melk heeft serving_size in milliliter: hij hoort erin te staan, maar
     zonder portiegewicht. Een verzonnen 250 g zou een fout van kwart liter zijn. */
  const melk = sql.split('\n').find((r) => r.includes("'20999111'"))
  eis(!!melk && /, null::numeric, '250 ml'\)/.test(melk),
      'de melk komt erin zonder verzonnen portiegewicht')
  /* Een kale `null` zonder type is precies de fout die Postgres pas bij het
     uitvoeren afkeurt. Hij hoort nergens meer in de uitvoer te staan. */
  eis(!/,\s*null\s*[,)]/.test(sql), 'er staat nergens een null zonder type')

  /* DE DUBBELE STREEPJESCODE, EN WAAROM DIT ZO STRENG STAAT
     Postgres weigert bij twee gelijke codes in één insert de hele opdracht met
     "ON CONFLICT DO UPDATE command cannot affect row a second time". Eén dubbele
     rij en er komt dus niets binnen, niet één rij minder, alles. Hier wordt
     geteld hoe vaak `'20123456'` in de waardenlijst staat: precies één keer. */
  /* De bodem geldt alleen naar beneden. Een lichte rij waarvan de som er ver
     bóven ligt hoort er net zo goed uit als een zware. */
  eis(!sql.includes('Choco Pudding'),
      'een lichte rij die zichzelf tegenspreekt valt ook af, ondanks de bodem')

  /* DE DERDE GETUIGE, IN TWEE RICHTINGEN
     De granola valt af hoewel zijn energie met zowel de macro's als de
     kilojoules klopt, daar is deze zeef voor. En het eiwitpoeder blijft, want
     tachtig gram eiwit per honderd gram is geen fout maar een poeder. Zonder
     dat tweede geval zou "gooi alles met veel eiwit weg" deze proef halen, en
     dan was er van de hele eiwitlijst niets overgebleven. */
  eis(!sql.includes('Eiwit Granola'),
      'honderdvijfenzeventig gram in honderd gram valt af, ook met twee kloppende getuigen')
  eis(sql.includes('Clear Whey Tropical'),
      'tachtig gram eiwit per honderd gram blijft, dat is een poeder, geen fout')

  const keer = (sql.match(/'20123456'/g) ?? []).length
  eis(keer === 1, `de dubbele streepjescode staat er één keer in, niet ${keer}`)
  /* En het is de eerste die blijft: de tweede heette anders. */
  eis(sql.includes("'Roomboter'") && !sql.includes('Roomboter ongezouten'),
      'bij een dubbele code wint de eerste')

  const leeg = naarSql([])
  eis(leeg.includes('Er valt niets in te voeren'), 'een lege oogst zegt dat, in plaats van kale SQL')

  /* DE KILOJOULES ALS TWEEDE GETUIGE
     De macro's en de kilojoules zeggen allebei iets over hetzelfde getal, maar
     ze vangen niet hetzelfde. Deze vier proeven staan er om dat vast te leggen:
     wat hij wél pakt, wat hij níet pakt, en waar hij zijn kilojoules vandaan
     haalt. */
  eis(/2  energie klopt niet met de kilojoules/.test(sql),
      'twee rijen vallen af op hun eigen kilojoules')
  eis(!sql.includes('Chilli mini kabanossi'),
      'de kabanossi valt af op de kJ, terwijl de macro\'s hem doorlaten')
  eis(sql.includes('Bockworst gerookt'),
      'en een rij waar de kJ het kcal-veld bevestigt blijft gewoon staan')
  eis(!sql.includes('Fuet extra knoflook'),
      'de kJ worden ook uit energy_100g gelezen als de eenheid erbij staat')
  eis(sql.includes('Green canyon oats & honey'),
      'maar energy_100g zonder kJ als eenheid telt niet als kilojoules')
  eis(sql.includes('Italiaanse roerbakgroenten'),
      'en een klein getal dat twaalf procent afwijkt blijft staan, dat is afronding')

  /* EEN MERK IS EEN MERK, HOE HET OOK GETYPT IS */
  eis(!/'DULANO'/.test(sql), 'het geschreeuwde merk staat er niet in')
  eis((sql.match(/'Dulano'/g) || []).length === 2,
      'beide Dulano-rijen dragen dezelfde schrijfwijze')
  eis(merkSpelling([{ brands: 'Aa' }, { brands: 'Aa' }, { brands: 'AA' }]).get('aa') === 'Aa',
      'de schrijfwijze die het vaakst voorkomt wint')
  eis(merkSpelling([{ brands: 'BB' }, { brands: 'Bb' }]).get('bb') === 'BB',
      'bij gelijk spel wint de eerste, want er is niets te kiezen')
  eis(merkSpelling([{ brands: 'Chef Select, Vemondo' }]).get('chef select') === 'Chef Select',
      'een merk zonder tegenhanger blijft precies zoals het er staat')
}

/* ------------------------------------------------------------------ start -- */

const arg = (naam, standaard) => {
  const i = process.argv.indexOf(naam)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : standaard
}

if (process.argv.includes('--proef')) {
  proef()
} else if (process.argv.includes('--bestand')) {
  /* Meer dan één bestand tegelijk, want zo komt het binnen: een merk heeft
     meerdere bladzijden en een winkel meerdere huismerken. Alles achter
     `--bestand` tot het volgende streepje telt mee, en het wordt één SQL,
     dubbele streepjescodes vallen er in `naarSql` vanzelf uit, en dat moet
     ook, want anders weigert Postgres de hele insert. */
  const { readFileSync } = await import('node:fs')
  const i = process.argv.indexOf('--bestand')
  const paden = process.argv.slice(i + 1).filter((a) => !a.startsWith('--'))
  if (!paden.length) {
    console.error('Geef minstens één bestand op: --bestand a.json b.json')
    process.exit(1)
  }
  const alles = []
  for (const pad of paden) {
    const d = JSON.parse(readFileSync(pad, 'utf8'))
    const uit = d.products ?? d
    if (!Array.isArray(uit)) {
      console.error(`${pad} bevat geen lijst producten.`)
      process.exit(1)
    }
    console.error(`  ${pad}: ${uit.length} producten`)
    alles.push(...uit)
  }
  process.stdout.write(naarSql(alles))
} else {
  const merk = arg('--merk')
  if (!merk) {
    console.error('Geef een merk op: --merk lidl. Of --proef om de omzetting te toetsen.')
    process.exit(1)
  }
  process.stdout.write(naarSql(await haal(merk, Number(arg('--max', '300')))))
}
