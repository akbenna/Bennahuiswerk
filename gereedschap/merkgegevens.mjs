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
   en is het een invoerfout — meestal kilojoules in het kcal-veld. */
const KCAL_MAX = 950

/**
 * Een naam die geen naam is maar een foto van een etiket.
 *
 * Open Food Facts vult zich deels met tekstherkenning op een kiekje, en dan komt
 * de houdbaarheidsdatum mee die ernaast gedrukt staat. Vijf van de honderd Chef
 * Select-producten heetten zo: "23-12-25 406 56 03:29 chef select serveertip KIP
 * P" en "IJSBERGOLA gewassen 200ge 10/08/2025".
 *
 * Wat ze gemeen hebben is niet dat er cijfers in staan — "0% Griekse yoghurt" en
 * "7-Up" hebben die ook — maar dat er een klok, een datum of een streepjescode in
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
 * Daarboven is het geen etiket meer maar een invoerfout — iemand die de energie
 * van de verpakking overnam en de macro's per 100 g, of andersom. In deze honderd
 * producten was er precies één: "Kipfilet Kanapka", 147 kcal terwijl 9,3 g eiwit,
 * 10,1 g vet en 25,4 g koolhydraten op 230 uitkomen. Al het andere lag tussen
 * 0,69 en 1,08.
 *
 * De ondergrens is losser dan de bovengrens, en dat is geen slordigheid: bij
 * bladgroente van vijftien kcal telt vezel mee dat hier buiten de som valt, en
 * telt afronding op 0,6 g dubbel zo hard. Vandaar ook de bodem: onder de vijftig
 * kcal zegt de verhouding meer over het afronden dan over het product.
 */
const MACRO_ONDER = 0.5
const MACRO_BOVEN = 1.4
const MACRO_VANAF_KCAL = 50

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
  if (kcal >= MACRO_VANAF_KCAL) {
    const uit = 4 * (getal(n.proteins_100g) ?? 0) + 9 * (getal(n.fat_100g) ?? 0)
      + 4 * (getal(n.carbohydrates_100g) ?? 0)
    const deel = uit / kcal
    if (deel < MACRO_ONDER || deel > MACRO_BOVEN) return 'energie klopt niet met de macro\'s'
  }
  return null
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
     twintig Lidl-producten verloren daardoor hun portiegewicht — Open Food
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
 * werkelijk werd uitgevoerd — niet toen hij er goed uitzag.
 */
export function q(v) {
  if (v === null || v === undefined || v === '') return 'null::text'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

function num(v) {
  const n = getal(v)
  return n == null ? 'null::numeric' : String(Math.round(n * 100) / 100)
}

/** Eén product → één waardenrij, of null als het niet door de zeef komt. */
export function rij(p) {
  if (bruikbaar(p)) return null
  const n = p.nutriments || {}
  const naam = (p.product_name_nl || p.product_name || '').trim()
  const portie = porties(p.serving_size)
  const verpakking = getal(p.product_quantity)
  return '  (' + [
    q(String(p.code)),
    q(naam),
    q((p.brands || '').split(',')[0]?.trim() || null),
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

/**
 * De hele SQL. Eén insert met `on conflict do update`, zodat opnieuw draaien
 * bijwerkt en niet verdubbelt — dezelfde afspraak als in de SQL-bestanden zelf.
 */
export function naarSql(producten) {
  const rijen = []
  const weg = {}
  for (const p of producten) {
    const reden = bruikbaar(p)
    if (reden) { weg[reden] = (weg[reden] ?? 0) + 1; continue }
    rijen.push(rij(p))
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
    'insert into merk_producten',
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
    '  geimporteerd_op = now();',
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
     vijftien kcal is 0,40 — ruim onder de ondergrens, en toch een goede rij.
     Daarvoor staat de bodem van vijftig kcal er. */
  { code: '8', product_name_nl: 'Witte champignons gesneden', brands: 'Lidl', product_quantity: 250,
    nutriments: { 'energy-kcal_100g': 15, proteins_100g: 0.5, fat_100g: 0, carbohydrates_100g: 1, fiber_100g: 2 } },
]

function proef() {
  const eis = (goed, wat) => { if (!goed) { console.error('MIS: ' + wat); process.exitCode = 1 } else console.log('ok  ' + wat) }

  eis(porties('30 g').gram === 30, 'een portie in gram wordt gelezen')
  eis(porties('10 gram').gram === 10, '"gram" voluit ook — anders valt een kwart weg')
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
  /* Veertien producten, zes bruikbaar. Die verhouding staat er met opzet in: valt
     de zeef ooit weg, dan komen er veertien doorheen en gaat deze proef om. */
  eis(/14 producten bekeken, 6 bruikbaar/.test(sql), 'zes van de veertien komen erdoor')
  for (const [reden, n] of [['geen naam', 1], ['energie buiten bereik', 1],
                            ['geen energie per 100 g', 1], ['geen streepjescode', 1],
                            ['naam is een etiketafdruk', 3],
                            ["energie klopt niet met de macro's", 1]]) {
    eis(new RegExp(`${n}  ${reden}`).test(sql), `weggelaten wordt geteld: ${n}× ${reden}`)
  }
  /* En de drie die alleen op hun naam sneuvelen, sneuvelen ook echt: een telling
     die klopt terwijl de rij er toch in staat is geen zeef maar een boekhouding. */
  eis(!sql.includes('serveertip') && !sql.includes('IJSBERGOLA') && !sql.includes('44280651'),
      'alle drie de etiketafdrukken staan er niet in — klok, datum én code')
  /* De bodem van vijftig kcal: zonder hem valt deze goede rij op 0,40 af. */
  eis(sql.includes('Witte champignons gesneden'),
      'bladgroente overleeft de macro-zeef, want daar telt vezel mee dat buiten de som valt')
  eis(!sql.includes('Kipfilet') && !sql.includes("'6'"), 'de rij die zichzelf tegenspreekt staat er niet in')
  eis(sql.includes('0% Griekse yoghurt 500 g'),
      'een naam met cijfers erin blijft — het gaat om klokken en codes, niet om cijfers')
  eis(sql.includes("'20123456'") && !sql.includes("'1900'"), 'de goede rijen staan erin, de rommel niet')
  eis(sql.includes('on conflict (bron, barcode) do update'), 'opnieuw draaien werkt bij in plaats van te verdubbelen')
  eis(!sql.includes("''vers''',") || sql.includes("''vers'''"), 'de ontsnapping komt ook in de uitvoer terecht')

  /* De melk heeft serving_size in milliliter: hij hoort erin te staan, maar
     zonder portiegewicht. Een verzonnen 250 g zou een fout van kwart liter zijn. */
  const melk = sql.split('\n').find((r) => r.includes("'20999111'"))
  eis(!!melk && /, null::numeric, '250 ml'\)/.test(melk),
      'de melk komt erin zonder verzonnen portiegewicht')
  /* Een kale `null` zonder type is precies de fout die Postgres pas bij het
     uitvoeren afkeurt. Hij hoort nergens meer in de uitvoer te staan. */
  eis(!/,\s*null\s*[,)]/.test(sql), 'er staat nergens een null zonder type')

  const leeg = naarSql([])
  eis(leeg.includes('Er valt niets in te voeren'), 'een lege oogst zegt dat, in plaats van kale SQL')
}

/* ------------------------------------------------------------------ start -- */

const arg = (naam, standaard) => {
  const i = process.argv.indexOf(naam)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : standaard
}

if (process.argv.includes('--proef')) {
  proef()
} else if (process.argv.includes('--bestand')) {
  const { readFileSync } = await import('node:fs')
  const d = JSON.parse(readFileSync(arg('--bestand'), 'utf8'))
  process.stdout.write(naarSql(d.products ?? d))
} else {
  const merk = arg('--merk')
  if (!merk) {
    console.error('Geef een merk op: --merk lidl. Of --proef om de omzetting te toetsen.')
    process.exit(1)
  }
  process.stdout.write(naarSql(await haal(merk, Number(arg('--max', '300')))))
}
