// =============================================================================
// KALIBRATIE — maaltijdherkenning uit tekst, foto en Yazio-plaksel.
//
// Waarom deze functie er is en chat-ai/photo_analysis niet volstaat: die geeft
// één getal terug ("totaal_kcal": 600) zonder interval, zonder graad, en uit
// het geheugen van het model in plaats van uit een voedingsmiddelentabel.
// Beide zijn hier fout. De fout op een uit een foto geschatte portie is
// grootteorde 35% (Fridolfsson 2025, Curr Dev Nutr), modellen onderschatten
// grote porties stelselmatig, en koppeling aan een gezaghebbende tabel geeft
// een MAE-reductie van circa 63% (Yan 2025, Commun Med). Daarom:
//
//   ronde 1  het model benoemt de onderdelen, schat een portiebereik per
//            eenheid, en geeft een eigen voedingswaarde per 100 g als vangnet
//   server   zoekt per onderdeel kandidaten in NEVO (2.328 producten)
//   ronde 2  het model kiest de beste NEVO-treffer per onderdeel
//   server   noemt het model een huishoudmaat die in de tabel staat, dan komt
//            het gewicht daarvandaan en niet van het model
//   server   vermenigvuldigt met het aantal en rekent met de NEVO-waarde; is
//            die er niet, dan met het vangnet, en dan zakt de regel naar D
//
// Die vijfde stap is later toegevoegd, en de reden is het waard om op te
// schrijven. Het beginsel van deze app is dat het model kiest en de server met
// de tabel rekent — maar dat gold alleen voor de voedingsstoffen. Het
// portiegewicht kwam nog volledig van het model, terwijl in dezelfde database
// `voeding_portiematen` staat: een eetlepel hartige saus is 15 g, band 10 tot
// 20. Zei het model "eetlepel, 40 gram", dan rekende de server met 40 en keek
// niemand in de tabel. Dat is precies de klacht "hij pakt de hele pot in plaats
// van een lepel", en het was geen ontbrekend gegeven maar een weg die eraan
// voorbijliep.
//
// Vier regels die uit testen zijn gekomen en niet uit ontwerp:
//   - een onderdeel mag nooit uit het totaal vallen. Een ontbrekende
//     tabelwaarde die stilletjes nul wordt is gevaarlijker dan een ruwe
//     schatting die zichzelf D noemt; in de eerste test verdween zo een hele
//     tajine, ruim achthonderd kilocalorieën, uit de dagtelling.
//   - het model rekent niet zelf porties uit. Bij "twee cappuccino's" gaf het
//     het gewicht van één kopje terug terwijl het schema om het totaal vroeg,
//     terwijl het bij brood wél vermenigvuldigde. Die inconsistentie los je op
//     door de vermenigvuldiging bij het model weg te halen, niet door de
//     formulering aan te scherpen.
//   - het zoeken in NEVO gebeurt niet hier maar in de database, in dezelfde
//     functie die het zoekveld van de app gebruikt. Zolang die twee los van
//     elkaar stonden, kon de gebruiker iets opzoeken dat de herkenning even
//     later niet vond. Zie kal_nevo_zoek.
//   - de zoekterm is het product en niet de omschrijving ervan. Zocht het model
//     op "cappuccino halfvolle melk", dan won "Melk halfvolle" het van "Koffie
//     cappuccino vers bereid", simpelweg omdat twee van de drie woorden raak
//     waren in plaats van één. Twee kopjes werden zo 330 kcal in plaats van
//     ongeveer honderd. Geen enkele rangschikking kan weten welk woord het
//     hoofdwoord is; de zoekterm moet dat woord dus zijn.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC = "https://api.anthropic.com/v1/messages";
const MODEL_TERUGVAL = "claude-sonnet-5";

/* De modelnaam staat in kal_config en niet hier. Namen verlopen: die van
   ProVita's chat-ai bestaat niet meer op deze sleutel, en dan valt een functie
   stil zonder dat iemand het merkt. Eén regel in de database wisselt hem. */
let modelCache: { naam: string; tot: number } | null = null;
async function modelNaam(db: ReturnType<typeof createClient>, sleutel: string) {
  if (modelCache && modelCache.tot > Date.now()) return modelCache.naam;
  const { data } = await db.from("kal_config").select("waarde").eq("sleutel", sleutel).maybeSingle();
  const naam = (data?.waarde as string) || MODEL_TERUGVAL;
  modelCache = { naam, tot: Date.now() + 300_000 };
  return naam;
}

/* Ondergrenzen voor de intervalbreedte, uit de literatuur en niet uit gevoel.
   Foto: circa 35% gemiddelde absolute fout. Tekst zonder gewogen portie: de
   spreiding van huishoudmaten. Gewogen: alleen nog de tabelonzekerheid. */
const MIN_REL_SPREIDING: Record<string, number> = {
  "foto-ai": 0.35,
  "tekst-ai": 0.25,
  gewogen: 0.08,
};

/* ---------------------------------------------------------------------------
   HUISHOUDMATEN UIT DE TABEL

   Het model mag zeggen wélke maat het was; hoeveel die weegt staat in de
   database. Dat is dezelfde taakverdeling als bij de voedingswaarde, en om
   dezelfde reden: een curated maat is nagekeken, een schatting van het model
   niet.

   Alleen bij een échte huishoudmaat. Zegt het model "gram", dan is er niets te
   vervangen; zegt het "portie" en kent de tabel dat woord niet, dan blijft de
   schatting staan. Liever de schatting van het model dan een maat die er
   toevallig op lijkt.
--------------------------------------------------------------------------- */

export interface Portiemaat {
  naam: string;
  meervoud: string | null;
  gram_schatting: number;
  gram_laag: number;
  gram_hoog: number;
}

/* Woorden die hetzelfde betekenen maar anders geschreven worden. Klein
   gehouden met opzet: alles wat hier niet in staat wordt gewoon letterlijk
   vergeleken met de naam in de tabel, en dat is de veilige kant. */
const EENHEID_ALIAS: Record<string, string> = {
  el: "eetlepel", lepel: "eetlepel", lepels: "eetlepel", eetlepels: "eetlepel",
  tl: "theelepel", theelepels: "theelepel",
  sneetje: "snede", sneetjes: "snede", snee: "snede", sneden: "snede", sneetje_brood: "snede",
  kopjes: "kopje", glazen: "glas", stuks: "stuk", stuk_je: "stuk",
  handjes: "handje", schaaltjes: "schaaltje", porties: "portie",
};

/** Eén schrijfwijze, zodat "Eetlepels" en "el" hetzelfde woord worden. */
export function normaliseerEenheid(eenheid: string): string {
  const kaal = (eenheid || "").toLowerCase().trim().replace(/[^a-zà-ÿ]/g, "");
  return EENHEID_ALIAS[kaal] ?? kaal;
}

/**
 * De maat die bij deze eenheid hoort, of null.
 *
 * Een portie die de gebruiker zelf gewogen heeft laten we met rust: die is
 * beter dan wat dan ook uit een tabel.
 *
 * De regel over gram en milliliter is eerlijk gezegd een tweede slot. De
 * aanroeper vangt "g" en "ml" al af, en zou hij dat niet doen, dan vindt de
 * lus hieronder toch geen maat die zo heet. Een mutatieproef kreeg hem dan ook
 * niet om. Hij blijft staan omdat hij de bedoeling uitspreekt en omdat hij wél
 * gaat bijten zodra iemand ooit een portiemaat "gram" noemt — maar hij is
 * bescherming, geen dragende regel, en dat is iets anders.
 */
export function kiesMaat(
  eenheid: string, gewogen: boolean, maten: readonly Portiemaat[],
): Portiemaat | null {
  if (gewogen) return null;
  const e = normaliseerEenheid(eenheid);
  if (!e || e === "g" || e === "gram" || e === "ml" || e === "milliliter") return null;
  for (const m of maten) {
    if (normaliseerEenheid(m.naam) === e) return m;
    if (m.meervoud && normaliseerEenheid(m.meervoud) === e) return m;
  }
  return null;
}

interface Onderdeel {
  naam: string;
  zoekterm: string;
  hoeveelheid: number | null;
  eenheid: string;
  gram_per_eenheid: number;
  gram_laag: number;
  gram_hoog: number;
  gewogen: boolean;
  bereidingsvet_g?: number;
  kcal_per_100?: number;
  eiwit_per_100?: number;
  vet_per_100?: number;
  koolh_per_100?: number;
  conf: "A" | "B" | "C" | "D";
  onzekerheid: string[];
  moment?: string;
}

const SCHEMA_RONDE1 = {
  type: "object",
  properties: {
    onderdelen: {
      type: "array",
      items: {
        type: "object",
        properties: {
          naam: { type: "string", description: "Nederlandse naam zoals de gebruiker hem zou herkennen" },
          zoekterm: { type: "string", description: "HET PRODUCT ZELF, in één of twee woorden, om mee in het Nederlands Voedingsstoffenbestand te zoeken. Dus 'cappuccino', 'ei gekookt', 'couscous gekookt', 'olijfolie', 'tarwebrood bruin', 'kwark magere'. NIET de omschrijving en NIET de ingrediënten: een cappuccino zoek je op als 'cappuccino' en niet als 'cappuccino halfvolle melk', want dan vindt de tabel de melk in plaats van de koffie. Voeg alleen een tweede woord toe wanneer dat in een voedingstabel een echt onderscheid is: gekookt tegenover rauw, mager tegenover vol, bruin tegenover wit. Geen merknaam en geen gerechtnaam." },
          hoeveelheid: { type: "number", description: "Het AANTAL eenheden. Twee sneetjes brood is 2. Bij eenheid g of ml is dit het aantal grammen of milliliters zelf." },
          eenheid: { type: "string", description: "g, ml, stuk, snee, kopje, glas, portie, eetlepel. De eenheid moet bij de hoeveelheid horen: twee kopjes is hoeveelheid 2 met eenheid 'kopje', niet 2 ml." },
          gram_per_eenheid: { type: "number", description: "Gewicht in gram (of ml) van ÉÉN eenheid. Bij eenheid g of ml vul je hier 1 in. Bij 'snee' het gewicht van één snee, bij 'kopje' de inhoud van één kopje. NIET het totaal — de server vermenigvuldigt zelf met hoeveelheid." },
          gram_laag: { type: "number", description: "Ondergrens van gram_per_eenheid, dus ook per één eenheid. Bij een gefotografeerde portie ruim nemen." },
          gram_hoog: { type: "number", description: "Bovengrens van gram_per_eenheid, per één eenheid. Neem deze ruimer dan de ondergrens wanneer de portie groot is: taalmodellen onderschatten grote porties stelselmatig." },
          gewogen: { type: "boolean", description: "true alleen als de gebruiker expliciet een gewogen gewicht noemt" },
          bereidingsvet_g: { type: ["number", "null"], description: "Olie of boter die in de bereiding van DIT gerecht is opgegaan en niet los zichtbaar is, voor de hele portie samen. Nooit invullen op een regel die zelf al een olie of vet is." },
          kcal_per_100: { type: "number", description: "VERPLICHT. Jouw eigen beste schatting van de energie per 100 gram van dit onderdeel, zoals het op tafel komt. Dit is het vangnet voor als het onderdeel niet in de voedingsmiddelentabel blijkt te staan. Vul het altijd in, ook wanneer je verwacht dat de tabel het wel kent." },
          eiwit_per_100: { type: "number", description: "VERPLICHT. Eiwit in gram per 100 gram, jouw eigen schatting." },
          vet_per_100: { type: "number", description: "VERPLICHT. Vet in gram per 100 gram, jouw eigen schatting." },
          koolh_per_100: { type: "number", description: "VERPLICHT. Koolhydraten in gram per 100 gram, jouw eigen schatting." },
          conf: { type: "string", enum: ["A", "B", "C", "D"] },
          onzekerheid: { type: "array", items: { type: "string" }, description: "Korte Nederlandse zinnen: wat je niet kon zien of niet zeker weet" },
          moment: { type: "string", enum: ["ontbijt", "lunch", "diner", "tussendoor", "onbekend"] },
        },
        required: ["naam", "zoekterm", "hoeveelheid", "eenheid", "gram_per_eenheid", "gram_laag", "gram_hoog", "gewogen", "kcal_per_100", "eiwit_per_100", "vet_per_100", "koolh_per_100", "conf", "onzekerheid"],
      },
    },
    opmerking: { type: "string", description: "Eén zin: wat de gebruiker zou moeten aanvullen om dit betrouwbaarder te maken. Leeg laten als er niets ontbreekt." },
    referentieobject: { type: ["string", "null"], description: "Alleen bij een foto: welk object gebruikte je om de schaal te bepalen (bord, bestek, hand, munt)? null als er geen was." },
  },
  required: ["onderdelen", "opmerking"],
};

const SCHEMA_RONDE2 = {
  type: "object",
  properties: {
    keuzes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "number", description: "Volgnummer van het onderdeel" },
          nevo_code: { type: ["string", "null"], description: "De nevo_code van de best passende kandidaat, of null als geen enkele kandidaat past" },
          reden: { type: "string" },
        },
        required: ["index", "nevo_code"],
      },
    },
  },
  required: ["keuzes"],
};

const SCHEMA_IMPORT = {
  type: "object",
  properties: {
    dagen: {
      type: "array",
      items: {
        type: "object",
        properties: {
          datum: { type: "string", description: "ISO-datum, JJJJ-MM-DD" },
          kcal: { type: ["number", "null"] },
          eiwit_g: { type: ["number", "null"] },
          vet_g: { type: ["number", "null"] },
          koolhydraat_g: { type: ["number", "null"] },
          gewicht_kg: { type: ["number", "null"] },
          stappen: { type: ["number", "null"] },
          actieve_energie_kcal: { type: ["number", "null"] },
        },
        required: ["datum"],
      },
    },
    opmerking: { type: "string" },
  },
  required: ["dagen"],
};

const REGELS_GEMEEN = `1. ONTLEED SAMENGESTELDE GERECHTEN. Een tajine, een couscous, een rfissa, een harira, een lasagne: die staan in geen enkele voedingsmiddelentabel en mogen dus nooit één regel blijven. Splits ze in het vlees, de groenten, het graan en het vet, elk met een eigen portie. Alleen wat je in een tabel zou kunnen opzoeken, is een goede regel.

2. GEEF ALTIJD EEN BEREIK. Nooit één getal. Als iemand "een bord couscous" zegt, is dat 150 tot 350 gram gekookt, geen 250. Het bereik is het antwoord, niet het gemiddelde ervan.

3. REKEN PORTIES NIET ZELF UIT. Vul hoeveelheid in met het aantal eenheden en gram_per_eenheid met het gewicht van één daarvan. Twee sneetjes brood is hoeveelheid 2, eenheid 'snee', gram_per_eenheid 35 — niet 70. Twee kopjes koffie is hoeveelheid 2, eenheid 'kopje', gram_per_eenheid 150. De server vermenigvuldigt.

4. BENOEM HET BEREIDINGSVET. In een tajine gaat 30 tot 80 ml olie die je niet ziet en die de gebruiker vrijwel nooit meldt. In couscous, in de pan gebakken msemen, in een roerbak: hetzelfde. Zet dat in bereidingsvet_g van het gerecht zelf en noem het in onzekerheid. Maak er GEEN aparte regel van: dan telt de olie twee keer. Een losse regel olie maak je alleen wanneer de gebruiker de olie apart noemt, bijvoorbeeld over een salade; zet bereidingsvet_g dan op 0. Dit is stelselmatig de grootste ontbrekende post van de dag.

5. WEES EERLIJK OVER DE GRAAD.
   A = de gebruiker noemt een gewogen gewicht of een etiketwaarde
   B = een etiketproduct maar een geschatte portie ("twee sneetjes brood")
   C = een gewoon product uit de tabel in een gebruikelijke portie
   D = een ruwe schatting, of een portie die je echt niet kunt weten
   Een tajine zonder gewogen ingrediënten is D. Niet C, niet B.

6. VUL ALTIJD DE VOEDINGSWAARDE PER 100 GRAM IN, ook wanneer je denkt dat de tabel het onderdeel kent. Dat is het vangnet: staat het er niet in, dan valt de regel anders uit het dagtotaal weg, en een stilzwijgend verdwenen maaltijd is erger dan een ruwe schatting die zichzelf D noemt.

7. DE ZOEKTERM IS HET PRODUCT, NIET DE OMSCHRIJVING. Een cappuccino met halfvolle melk heeft zoekterm 'cappuccino'. Zet je de melk erbij, dan vindt de tabel de melk en niet de koffie, en dat scheelt een factor drie. Hetzelfde geldt voor thee met suiker, yoghurt met muesli, brood met kaas: dat zijn twee regels met elk hun eigen éénwoordige zoekterm, niet één regel met een zin erin.`;

const SYS_TEKST = `Je leest wat iemand heeft gegeten en zet het om in losse onderdelen met een portiebereik.

Je werkt voor een Nederlandse arts van 51 jaar met een Marokkaanse achtergrond. Er wordt Marokkaans en Turks gekookt: tajine, harira, couscous, rfissa, msemen, baghrir, zaalouk, menemen, mercimek. Ken die gerechten en ontleed ze.

${REGELS_GEMEEN}`;

const SYS_FOTO = `Je schat uit een foto wat er op het bord ligt en hoeveel.

Je werkt voor een Nederlandse arts van 51 jaar met een Marokkaanse achtergrond; er wordt Marokkaans en Turks gekookt.

Wat je moet weten over je eigen betrouwbaarheid, want dat bepaalt hoe je antwoordt: uit validatiestudies blijkt dat taalmodellen bij het schatten van porties uit foto's een gemiddelde absolute fout van ongeveer 35 procent maken, en dat die fout systematisch de kant van ONDERschatting op gaat naarmate de portie groter is. Corrigeer daarvoor: leg je bovengrens ruimer dan je ondergrens, en trek bij een royaal gevuld bord de bovengrens flink op.

Bepaal de schaal aan een herkenbaar voorwerp — bord, bestek, glas, hand. Noem in referentieobject welk voorwerp je gebruikt hebt. Zie je niets waarmee je kunt schalen, zeg dat dan in opmerking en verbreed het bereik fors.

Vet dat in de bereiding is opgegaan zie je niet op een foto. Schat het toch. Een gefotografeerd bord is nooit graad A of B: C wanneer het één herkenbaar product in een duidelijke portie is, D bij alles wat samengesteld is.

${REGELS_GEMEEN}`;

const SYS_IMPORT = `Je leest schermafdrukken of geplakte tekst uit een voedingsapp (meestal Yazio) of uit Apple Gezondheid, en zet die om in een reeks dagen.

Neem alleen over wat er echt staat. Reken niets uit wat er niet staat, en vul geen gaten op. Staat een dag er niet, dan hoort die dag niet in je antwoord.

Percentages naar grammen: koolhydraten en eiwit 4 kcal per gram, vet 9 kcal per gram. Staan er percentages bij een dagtotaal, reken die dan om; staan er alleen percentages zonder dagtotaal, laat de grammen dan leeg.

Let op de volgorde waarin de app de macro's toont — bij Yazio is dat koolhydraten, eiwit, vet.

Nederlandse maanden en het formaat "20 augustus 2026" moeten naar 2026-08-20. Duizendtallen staan met een punt: 1.319 kcal is duizenddriehonderdnegentien.`;

async function claude(
  key: string,
  MODEL: string,
  systeem: string,
  inhoud: unknown[],
  schema: Record<string, unknown>,
  naam: string,
  maxTokens = 6000,
) {
  const r = await fetch(ANTHROPIC, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systeem,
      tools: [{ name: naam, description: "Geef het resultaat gestructureerd terug.", input_schema: schema }],
      tool_choice: { type: "tool", name: naam },
      messages: [{ role: "user", content: inhoud }],
    }),
  });
  if (!r.ok) throw new Error("Anthropic: " + (await r.text()).slice(0, 400));
  const d = await r.json();
  const blok = (d.content || []).find((c: { type: string }) => c.type === "tool_use");
  if (!blok) throw new Error("Geen gestructureerd antwoord ontvangen");
  return { data: blok.input, in: d.usage?.input_tokens ?? 0, uit: d.usage?.output_tokens ?? 0 };
}

/* Het rangschikken staat in de database, in kal_nevo_zoek — dezelfde functie die
   het zoekveld van de app gebruikt. Dat is geen netheid maar noodzaak: zolang
   die twee los van elkaar stonden, kon de gebruiker een product opzoeken dat de
   herkenning even later niet vond.

   Hier gebeurt één ding bovenop: naast de volledige zoekterm gaat ook het
   langste losse woord apart de tabel in, en beide uitkomsten worden samengevoegd.
   De reden is dat ophalen en kiezen verschillende taken zijn. Een rangschikking
   weet niet welk woord in "cappuccino halfvolle melk" het hoofdwoord is — twee
   rake woorden wegen daar nu eenmaal zwaarder dan één — maar het model weet dat
   wel, mits het de koffie én de melk allebei voorgelegd krijgt. Dus: ruim ophalen,
   scherp laten kiezen. */
async function zoekNevo(db: ReturnType<typeof createClient>, term: string) {
  const haal = async (q: string) => {
    if (!q) return [] as Array<Record<string, unknown>>;
    const { data, error } = await db.rpc("kal_nevo_zoek", { p_q: q, p_limiet: 6 });
    if (error) return [] as Array<Record<string, unknown>>;
    return (data ?? []) as Array<Record<string, unknown>>;
  };

  const schoon = term.toLowerCase().replace(/[^a-zà-ÿ0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const langste = schoon.split(" ").filter((w) => w.length >= 2)
    .sort((a, b) => b.length - a.length)[0];

  const [volledig, hoofdwoord] = await Promise.all([
    haal(schoon),
    langste && langste !== schoon ? haal(langste) : Promise.resolve([] as Array<Record<string, unknown>>),
  ]);

  const uniek: Array<Record<string, unknown>> = [];
  const gezien = new Set<string>();
  for (const c of [...volledig, ...hoofdwoord]) {
    const code = String(c.nevo_code);
    if (gezien.has(code)) continue;
    gezien.add(code);
    uniek.push(c);
    if (uniek.length >= 10) break;
  }
  return uniek;
}

/**
 * De huishoudmaten voor een stel gekoppelde producten, in één vraag.
 *
 * Maten hangen aan een product of aan een productgroep — de tabel dwingt af dat
 * het precies één van de twee is. De groepsmaten zijn de nuttigste: één keer
 * vastleggen dat een eetlepel hartige saus 15 gram is, en elke saus heeft hem.
 *
 * De service-sleutel gaat langs RLS heen. Dat is hier de bedoeling en het is
 * dezelfde weg die `kal_ai_log` hierboven al neemt: deze functie draait op de
 * server, niet in een browser.
 */
async function haalMaten(
  db: ReturnType<typeof createClient>,
  bronnen: Array<Record<string, unknown> | null>,
): Promise<(bron: Record<string, unknown> | null) => Portiemaat[]> {
  const codes = [...new Set(bronnen.filter(Boolean).map((b) => String(b!.nevo_code)))];
  const groepen = [...new Set(bronnen.filter((b) => b?.groep).map((b) => String(b!.groep)))];
  if (!codes.length && !groepen.length) return () => [];

  /* Twee vragen en geen `or`-filter: PostgREST wil de waarden dan in één string
     geplakt hebben, en een groepsnaam met een komma erin ("Sauzen, hartig")
     breekt zo'n string stilletijds doormidden. */
  const [perCode, perGroep] = await Promise.all([
    codes.length
      ? db.from("voeding_portiematen")
          .select("nevo_code, nevo_groep, naam, meervoud, gram_schatting, gram_laag, gram_hoog, is_standaard, volgorde")
          .in("nevo_code", codes)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    groepen.length
      ? db.from("voeding_portiematen")
          .select("nevo_code, nevo_groep, naam, meervoud, gram_schatting, gram_laag, gram_hoog, is_standaard, volgorde")
          .in("nevo_groep", groepen)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const naarMaat = (r: Record<string, unknown>): Portiemaat => ({
    naam: String(r.naam),
    meervoud: r.meervoud == null ? null : String(r.meervoud),
    gram_schatting: Number(r.gram_schatting),
    gram_laag: Number(r.gram_laag),
    gram_hoog: Number(r.gram_hoog),
  });

  const opCode = new Map<string, Portiemaat[]>();
  for (const r of (perCode.data ?? []) as Array<Record<string, unknown>>) {
    const k = String(r.nevo_code);
    (opCode.get(k) ?? opCode.set(k, []).get(k)!).push(naarMaat(r));
  }
  const opGroep = new Map<string, Portiemaat[]>();
  for (const r of (perGroep.data ?? []) as Array<Record<string, unknown>>) {
    const k = String(r.nevo_groep);
    (opGroep.get(k) ?? opGroep.set(k, []).get(k)!).push(naarMaat(r));
  }

  /* Een maat op het product zelf gaat vóór een maat op de groep: hij is
     specifieker, en wie de moeite nam hem apart vast te leggen had daar een
     reden voor. */
  return (bron) => {
    if (!bron) return [];
    return [
      ...(opCode.get(String(bron.nevo_code)) ?? []),
      ...(bron.groep ? opGroep.get(String(bron.groep)) ?? [] : []),
    ];
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const sleutel = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, sleutel);
  const key = Deno.env.get("ANTHROPIC_API_KEY");

  let gebruiker: string | null = null;
  let soort = "tekst";
  const t0 = Date.now();

  try {
    const body = await req.json();
    soort = body.soort ?? "tekst";
    const token = body.token as string;

    // Zonder geldige sessie gebeurt er niets. Dit is precies waar chat-ai
    // kwetsbaar is: die staat open en rekent op een patient_id die de client
    // zelf verzint.
    const { data: uid, error: sessieFout } = await db.rpc("kal_sessie", { p_token: token });
    if (sessieFout || !uid) throw new Error("Niet aangemeld");
    gebruiker = uid as string;

    if (!key) throw new Error("Geen ANTHROPIC_API_KEY ingesteld in de Supabase-secrets");
    const MODEL = await modelNaam(db, soort === "import" ? "model_import" : "model_herkenning");

    // Eenvoudige begrenzing: dertig aanroepen per uur per gebruiker.
    const sinds = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db.from("kal_ai_log").select("id", { count: "exact", head: true })
      .eq("gebruiker_id", gebruiker).gte("created_at", sinds);
    if ((count ?? 0) >= 30) throw new Error("Maximum van dertig herkenningen per uur bereikt");

    let tokensIn = 0, tokensUit = 0;

    // ---------------------------------------------------------------- import --
    if (soort === "import") {
      const inhoud: unknown[] = [];
      if (body.tekst) inhoud.push({ type: "text", text: body.tekst });
      for (const f of body.fotos ?? []) {
        inhoud.push({ type: "image", source: { type: "base64", media_type: f.type ?? "image/jpeg", data: f.data } });
      }
      if (!inhoud.length) throw new Error("Geen tekst of afbeelding meegestuurd");
      inhoud.push({ type: "text", text: "Zet dit om in een reeks dagen." });
      const r = await claude(key, MODEL, SYS_IMPORT, inhoud, SCHEMA_IMPORT, "reeks", 10000);
      tokensIn = r.in; tokensUit = r.uit;
      await log(db, gebruiker, soort, MODEL, tokensIn, tokensUit, true, null);
      return json({ ...r.data, model: MODEL, ms: Date.now() - t0 });
    }

    // ------------------------------------------------------- ronde 1: zien ---
    const systeem = soort === "foto" ? SYS_FOTO : SYS_TEKST;
    const inhoud: unknown[] = [];
    if (soort === "foto") {
      for (const f of body.fotos ?? []) {
        inhoud.push({ type: "image", source: { type: "base64", media_type: f.type ?? "image/jpeg", data: f.data } });
      }
      inhoud.push({ type: "text", text: body.tekst ? `Erbij gezegd: ${body.tekst}` : "Wat ligt hier, en hoeveel?" });
    } else {
      inhoud.push({ type: "text", text: String(body.tekst ?? "") });
    }
    const r1 = await claude(key, MODEL, systeem, inhoud, SCHEMA_RONDE1, "onderdelen");
    tokensIn += r1.in; tokensUit += r1.uit;
    const onderdelen: Onderdeel[] = (r1.data as { onderdelen: Onderdeel[] }).onderdelen ?? [];
    if (!onderdelen.length) throw new Error("Ik herken hier geen voedsel in");

    // ------------------------------------------ server: kandidaten uit NEVO --
    const kandidaten: Record<number, Array<Record<string, unknown>>> = {};
    await Promise.all(onderdelen.map(async (o, i) => {
      kandidaten[i] = await zoekNevo(db, o.zoekterm || o.naam);
    }));

    // ------------------------------------------------- ronde 2: koppelen ----
    const teKiezen = onderdelen
      .map((o, i) => ({ i, o, k: kandidaten[i] }))
      .filter((x) => x.k.length > 0);

    const keuzes: Record<number, string | null> = {};
    if (teKiezen.length) {
      const lijst = teKiezen.map(({ i, o, k }) =>
        `${i}. ${o.naam} (${o.hoeveelheid ?? 1} ${o.eenheid})\n` +
        k.map((c) => `   - ${c.nevo_code}: ${c.naam_nl} — ${c.energie_kcal_per_100g} kcal, ${c.eiwit_g} g eiwit per 100 g`).join("\n")
      ).join("\n\n");
      const r2 = await claude(
        key,
        MODEL,
        `Je koppelt herkende voedingsonderdelen aan het Nederlands Voedingsstoffenbestand.

Kies per onderdeel de kandidaat die het dichtst bij de werkelijke bereiding ligt. Let op bereid versus onbereid: gekookte couscous heeft ongeveer een derde van de energiedichtheid van droge couscous, en dat verschil is groter dan alle andere fouten bij elkaar. Let ook op mager versus vet, en op met of zonder toegevoegd vet.

De kandidatenlijst is ruim opgehaald en bevat opzettelijk ook zijpaden. Bij een cappuccino kan er zowel "Koffie cappuccino" als "Melk halfvolle" in staan; kies dan de drank en niet het ingrediënt. Kies het product dat de gebruiker daadwerkelijk at of dronk.

Past geen enkele kandidaat werkelijk, kies dan null. Een verkeerde koppeling is erger dan geen koppeling — bij null rekent de app met een eigen schatting en zegt dat er ook bij.`,
        [{ type: "text", text: lijst }],
        SCHEMA_RONDE2,
        "keuzes",
        2000,
      );
      tokensIn += r2.in; tokensUit += r2.uit;
      for (const k of (r2.data as { keuzes: Array<{ index: number; nevo_code: string | null }> }).keuzes ?? []) {
        keuzes[k.index] = k.nevo_code;
      }
    }

    // --------------------------- server: huishoudmaten bij de koppelingen ----
    const gekozen = onderdelen.map((_, i) => {
      const code = keuzes[i] ?? null;
      return code ? (kandidaten[i] ?? []).find((c) => c.nevo_code === code) ?? null : null;
    });
    const matenVoor = await haalMaten(db, gekozen);

    // ------------------------------- server: voedingswaarde uit de tabel ----
    const regels = onderdelen.map((o, i) => {
      const bron = gekozen[i];
      const code = bron ? String(bron.nevo_code) : null;

      /* De vermenigvuldiging gebeurt hier en niet bij het model. Zie de kop. */
      const eh = (o.eenheid || "").toLowerCase();
      const isMaat = eh === "g" || eh === "ml";

      /* Kent de tabel deze huishoudmaat, dan wint zij van het model — voor het
         gewicht én voor de band eromheen. Die band is niet altijd smaller: een
         eetlepel is nu eenmaal 10 tot 20 gram, en dat hoort er te staan in
         plaats van het ene getal waar het model zich op vastlegde. */
      const tabelmaat = isMaat ? null : kiesMaat(o.eenheid || "", !!o.gewogen, matenVoor(bron));
      const perEenheid = tabelmaat
        ? tabelmaat.gram_schatting
        : Math.max(0, Number(o.gram_per_eenheid) || 0);
      const aantal = isMaat ? 1 : Math.max(1, Number(o.hoeveelheid) || 1);
      const punt = isMaat ? Math.max(0, Number(o.hoeveelheid) || perEenheid) : aantal * perEenheid;
      const laagPer = tabelmaat ? tabelmaat.gram_laag : (Number(o.gram_laag) || perEenheid);
      const hoogPer = tabelmaat ? tabelmaat.gram_hoog : (Number(o.gram_hoog) || perEenheid);
      let laag = Math.max(0, Math.min(laagPer * aantal, punt));
      let hoog = Math.max(hoogPer * aantal, punt);

      // Ondergrens op de intervalbreedte. Een model dat 200 tot 210 gram zegt
      // over een gefotografeerd bord beweert een nauwkeurigheid die uit geen
      // enkele validatiestudie volgt.
      const sleutelSpreiding = o.gewogen ? "gewogen" : (soort === "foto" ? "foto-ai" : "tekst-ai");
      const minRel = MIN_REL_SPREIDING[sleutelSpreiding];
      if (punt > 0 && (hoog - laag) / punt < 2 * minRel) {
        laag = Math.max(0, punt * (1 - minRel));
        hoog = punt * (1 + minRel * 1.25);   // asymmetrisch: de onderschatting van grote porties
      }

      const uitTabel = !!bron;
      const per100 = bron
        ? {
            kcal: Number(bron.energie_kcal_per_100g) || 0,
            eiwit: Number(bron.eiwit_g) || 0,
            vet: Number(bron.vet_g) || 0,
            koolh: Number(bron.koolhydraten_g) || 0,
            vezel: Number(bron.vezels_g) || 0,
          }
        : {
            kcal: Number(o.kcal_per_100) || 0,
            eiwit: Number(o.eiwit_per_100) || 0,
            vet: Number(o.vet_per_100) || 0,
            koolh: Number(o.koolh_per_100) || 0,
            vezel: 0,
          };

      /* Zet het model het bereidingsvet als eigen regel neer én vult het daar
         ook bereidingsvet_g in, dan telt de olie dubbel. Dat gebeurde in de
         eerste test: één tajine leverde 892 kcal olie in plaats van 442. */
      const isVetRegel = /olie|boter|ghee|smen|reuzel|vet|margarine/i.test(o.zoekterm + " " + o.naam);
      const vet = isVetRegel ? 0 : (Number(o.bereidingsvet_g) || 0);
      const kcalVet = vet * 8.84;          // olijfolie, 884 kcal per 100 g

      const uit = (g: number) => (g / 100) * per100.kcal + kcalVet;
      const onz = [...(o.onzekerheid ?? [])];
      if (tabelmaat) {
        onz.push(
          `portiegewicht uit de tabel: één ${tabelmaat.naam} is ${Math.round(tabelmaat.gram_schatting)} g `
          + `(${Math.round(tabelmaat.gram_laag)}–${Math.round(tabelmaat.gram_hoog)} g), niet geschat`,
        );
      }
      if (!uitTabel) onz.push("niet in het voedingsstoffenbestand gevonden; gerekend met een schatting van het model");
      if (vet > 0) onz.push(`inclusief ${Math.round(vet)} g bereidingsvet, geschat en niet gewogen`);

      // Zonder tabelwaarde is de graad hoogstens D, wat de gebruiker ook zei.
      const conf = uitTabel ? o.conf : "D";

      return {
        naam: o.naam + etiket(o, punt),
        moment: o.moment ?? "onbekend",
        hoeveelheid: o.hoeveelheid ?? punt,
        eenheid: o.eenheid,
        gram_equivalent: Math.round(punt),
        kcal_punt: Math.round(uit(punt)),
        kcal_laag: Math.round(uit(laag)),
        kcal_hoog: Math.round(uit(hoog)),
        eiwit_g: Math.round((punt / 100) * per100.eiwit * 10) / 10,
        vet_g: Math.round(((punt / 100) * per100.vet + vet) * 10) / 10,
        koolhydraat_g: Math.round((punt / 100) * per100.koolh * 10) / 10,
        vezel_g: Math.round((punt / 100) * per100.vezel * 10) / 10,
        conf,
        onzekerheidsbronnen: onz,
        bron: soort === "foto" ? "foto-ai" : "tekst-ai",
        nevo_code: code,
        nevo_naam: bron ? String(bron.naam_nl) : null,
        gram_laag: Math.round(laag),
        gram_hoog: Math.round(hoog),
        ai_model: MODEL,
      };
    });

    await log(db, gebruiker, soort, MODEL, tokensIn, tokensUit, true, null);
    return json({
      regels,
      opmerking: (r1.data as { opmerking?: string }).opmerking ?? "",
      referentieobject: (r1.data as { referentieobject?: string }).referentieobject ?? null,
      model: MODEL,
      ms: Date.now() - t0,
    });
  } catch (e) {
    const fout = e instanceof Error ? e.message : String(e);
    try { await log(db, gebruiker, soort, MODEL_TERUGVAL, 0, 0, false, fout); } catch { /* logging mag nooit de fout vervangen */ }
    return json({ error: fout }, 400);
  }
});

/* Het getal achter de naam moet het getal zijn waarmee gerekend is. Bij g en ml
   wint daarom altijd het gram-equivalent; bij tellende eenheden staat het
   aantal ervoor en het uitgerekende gewicht tussen haakjes erachter. */
function etiket(o: Onderdeel, punt: number) {
  const eh = (o.eenheid || "").toLowerCase();
  if (eh === "g" || eh === "ml") return ` · ${Math.round(punt)} ${eh}`;
  if (o.hoeveelheid) return ` · ${o.hoeveelheid} ${o.eenheid} (${Math.round(punt)} g)`;
  return ` · ${Math.round(punt)} g`;
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function log(
  db: ReturnType<typeof createClient>,
  gebruiker: string | null,
  soort: string,
  MODEL: string,
  tin: number,
  tuit: number,
  gelukt: boolean,
  fout: string | null,
) {
  // Sonnet-tarief; klopt zolang MODEL een Sonnet is.
  const kosten = (tin / 1_000_000) * 3 + (tuit / 1_000_000) * 15;
  await db.from("kal_ai_log").insert({
    gebruiker_id: gebruiker,
    soort,
    model: MODEL,
    input_tokens: tin,
    output_tokens: tuit,
    kosten_usd: Math.round(kosten * 1e6) / 1e6,
    gelukt,
    fout,
  });
}
