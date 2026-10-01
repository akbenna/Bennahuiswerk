/**
 * NASLAG VOOR DE BOVENBOUW (havo/vwo 4–6)
 *
 * Wat je in 5 vwo verondersteld wordt nog te weten uit 3 en 4, en wat er
 * nieuw bij komt. Het zijn de regels die wegzakken omdat ze een jaar eerder
 * zijn uitgelegd en daarna alleen nog gebruikt: molrekenen, significantie,
 * eenheden omrekenen, de goniometrie die natuurkunde van je vraagt terwijl
 * wiskunde A hem niet behandelt.
 *
 * Elke regel is kort gehouden: wat op een formuleblad past. De uitleg hoort in
 * het boek; dit is wat er naast het schrift ligt.
 *
 * Getallen zijn de gangbare waarden uit Binas (tabel 7): g = 9,81 m/s²,
 * Vm = 24,5 dm³/mol bij 298 K en p = p0, c = 3,00·10⁸ m/s, Kw = 1,0·10⁻¹⁴
 * bij 298 K.
 */
import type { Formuleblok } from './formules'

export interface Bovenbouwvak { vak: string; kop: string; emoji: string; blokken: Formuleblok[] }

export const BOVENBOUW: Bovenbouwvak[] = [
  { vak: 'basis', kop: 'Rekenen dat je nodig hebt bij alle exacte vakken', emoji: '🧮', blokken: [
    { kop: 'Machten en wortels', items: [
      ['Vermenigvuldigen', 'aᵐ · aⁿ = aᵐ⁺ⁿ   ·   (aᵐ)ⁿ = aᵐ·ⁿ   ·   aᵐ ÷ aⁿ = aᵐ⁻ⁿ'],
      ['Negatieve macht', 'a⁻ⁿ = 1 ÷ aⁿ   ·   a⁰ = 1'],
      ['Wortel als macht', '√a = a^½   ·   ⁿ√a = a^(1/n)'],
      ['Wetenschappelijke notatie', '3,2 · 10⁵ = 320 000   ·   4,0 · 10⁻³ = 0,0040'],
    ]},
    { kop: 'Eenheden omrekenen', items: [
      ['Voorvoegsels', 'G 10⁹ · M 10⁶ · k 10³ · d 10⁻¹ · c 10⁻² · m 10⁻³ · μ 10⁻⁶ · n 10⁻⁹'],
      ['Snelheid', 'km/h → m/s: delen door 3,6   ·   m/s → km/h: keer 3,6'],
      ['Volume', '1 L = 1 dm³ = 1000 mL = 1000 cm³   ·   1 m³ = 1000 L'],
      ['Oppervlak', '1 m² = 10⁴ cm²   ·   1 cm² = 100 mm²'],
      ['Tijd', '1 uur = 3600 s   ·   1 dag = 86 400 s   ·   1 jaar ≈ 3,15 · 10⁷ s'],
    ]},
    { kop: 'Significante cijfers', items: [
      ['Tellen', 'nullen vóór het getal tellen niet (0,0040 → 2), nullen erachter wél (4,00 → 3)'],
      ['Keer en delen', 'antwoord krijgt zoveel significante cijfers als het mínst nauwkeurige gegeven'],
      ['Plus en min', 'antwoord krijgt zoveel decimalen als het gegeven met de minste decimalen'],
      ['Afronden', 'pas aan het eind, tussenresultaten laat je staan in je rekenmachine'],
    ]},
    { kop: 'Procenten en groei', items: [
      ['Groeifactor', 'erbij p%: g = 1 + p/100   ·   eraf p%: g = 1 − p/100'],
      ['Over meerdere stappen', 'g_totaal = g₁ · g₂ · …   ·   per jaar → per maand: g^(1/12)'],
      ['Procentuele verandering', '(nieuw − oud) ÷ oud × 100%'],
      ['Verhoudingstabel', 'kruislings vermenigvuldigen: a/b = c/d  ⇔  a·d = b·c'],
    ]},
    { kop: 'Goniometrie voor natuurkunde (zit niet in wiskunde A)', items: [
      ['In een rechthoekige driehoek', 'sin α = overstaande ÷ schuine   ·   cos α = aanliggende ÷ schuine   ·   tan α = overstaande ÷ aanliggende'],
      ['Ezelsbrug', 'SOS CAS TOA'],
      ['Een kracht ontbinden', 'F_x = F · cos α   ·   F_y = F · sin α   (α is de hoek met de x-as)'],
      ['Terug naar de hoek', 'α = sin⁻¹(…), cos⁻¹(…), tan⁻¹(…)   op de rekenmachine: zet hem op graden (DEG)'],
      ['Waarden die je kent', 'sin 30° = cos 60° = 0,5   ·   sin 45° = cos 45° ≈ 0,71   ·   sin 60° ≈ 0,87'],
      ['Pythagoras', 'c² = a² + b²   ·   de grootte van een samengestelde kracht uit F_x en F_y'],
    ]},
  ]},

  { vak: 'scheikunde', kop: 'Scheikunde', emoji: '⚗️', blokken: [
    { kop: 'Rekenen aan reacties (mol)', items: [
      ['Mol uit massa', 'n = m ÷ M   (M in g/mol, uit Binas 99 of het periodiek systeem)'],
      ['Molaire massa', 'tel de atoommassa’s op: H₂O = 2 · 1,008 + 16,00 = 18,02 g/mol'],
      ['Mol uit volume gas', 'n = V ÷ Vm   ·   Vm = 24,5 dm³/mol bij 298 K en p0 (Binas 7)'],
      ['Concentratie', 'c = n ÷ V   (mol/L, V in liter)   ·   ook: [X] = n ÷ V'],
      ['Massapercentage', 'massa% = (massa deel ÷ massa geheel) × 100%'],
      ['Dichtheid', 'ρ = m ÷ V   ·   m = ρ · V   (let op: g/mL of kg/m³)'],
      ['Molverhouding', 'volgt uit de coëfficiënten: 2 H₂ + O₂ → 2 H₂O  betekent  n(H₂) : n(O₂) = 2 : 1'],
      ['Stappenplan', 'massa → mol (÷M) → mol andere stof (verhouding) → massa (×M)'],
      ['Overmaat', 'reken per stof uit hoeveel mol er nodig is; de stof die op is bepaalt de opbrengst'],
      ['Rendement', 'rendement = (werkelijke opbrengst ÷ theoretische opbrengst) × 100%'],
      ['ppm', '1 ppm = 1 mg per kg = 1 mg per L water'],
    ]},
    { kop: 'Reactievergelijkingen', items: [
      ['Kloppend maken', 'alleen coëfficiënten veranderen, nooit indexen: 2 H₂O, niet H₄O₂'],
      ['Volgorde', 'eerst metalen, dan niet-metalen, H en O als laatste; controleer de lading bij ionen'],
      ['Toestand', '(s) vast · (l) vloeibaar · (g) gas · (aq) opgelost in water'],
      ['Verbranding', 'stof + O₂ → CO₂ + H₂O (volledig) · bij te weinig O₂ ook CO of C'],
    ]},
    { kop: 'Zouten en oplossingen', items: [
      ['Oplossen', 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)   ·   CaCl₂(s) → Ca²⁺(aq) + 2 Cl⁻(aq)'],
      ['Oplosbaarheid', 'Binas 45A: g = goed, m = matig, s = slecht oplosbaar'],
      ['Neerslag', 'twee oplossingen bij elkaar: welke combinatie staat op s? Die slaat neer: Ag⁺ + Cl⁻ → AgCl(s)'],
      ['Hydraat', 'CuSO₄ · 5 H₂O: kristalwater telt mee in de molaire massa'],
      ['Ladingen die je kent', 'Na⁺ K⁺ Ag⁺ NH₄⁺ · Mg²⁺ Ca²⁺ Cu²⁺ Zn²⁺ Fe²⁺ · Al³⁺ Fe³⁺ · Cl⁻ NO₃⁻ OH⁻ · SO₄²⁻ CO₃²⁻ · PO₄³⁻'],
    ]},
    { kop: 'Zuren en basen', items: [
      ['Definitie', 'zuur = H⁺-donor   ·   base = H⁺-acceptor   ·   water kan allebei'],
      ['pH', 'pH = −log [H₃O⁺]   ·   [H₃O⁺] = 10^(−pH)'],
      ['pOH', 'pOH = −log [OH⁻]   ·   pH + pOH = 14,00 bij 298 K'],
      ['Waterevenwicht', 'Kw = [H₃O⁺] · [OH⁻] = 1,0 · 10⁻¹⁴ (298 K)'],
      ['Sterk zuur', 'reageert volledig: HCl → H⁺ + Cl⁻, dus [H₃O⁺] = c(zuur)'],
      ['Zwak zuur', 'evenwicht: HZ + H₂O ⇌ H₃O⁺ + Z⁻   ·   Kz = [H₃O⁺][Z⁻] ÷ [HZ]   (Binas 49)'],
      ['Zwakke base', 'B + H₂O ⇌ BH⁺ + OH⁻   ·   Kb = [BH⁺][OH⁻] ÷ [B]   ·   Kz · Kb = Kw'],
      ['Titratie', 'bij het equivalentiepunt: n(H⁺) = n(OH⁻)   ·   c₁V₁ = c₂V₂ bij 1 : 1'],
      ['Buffer', 'zwak zuur + zijn geconjugeerde base; de pH verandert weinig bij een beetje zuur of base erbij'],
    ]},
    { kop: 'Redox', items: [
      ['Wie doet wat', 'oxidator neemt elektronen op (wordt gereduceerd) · reductor staat elektronen af (wordt geoxideerd)'],
      ['Ezelsbrug', 'OIL RIG: Oxidation Is Loss, Reduction Is Gain (van elektronen)'],
      ['Halfreacties', 'Binas 48: sterkste oxidator linksboven, sterkste reductor rechtsonder'],
      ['Totaalreactie', 'maak het aantal elektronen gelijk, tel de halfreacties op, streep weg wat aan beide kanten staat'],
      ['Verloopt het?', 'de reactie verloopt als de oxidator in Binas 48 bóven de reductor staat'],
      ['Edel en onedel', 'onedele metalen (Na, Mg, Zn, Fe) zijn sterke reductoren; edele (Ag, Au) reageren nauwelijks'],
    ]},
    { kop: 'Reactiesnelheid en evenwicht', items: [
      ['Snelheid', 's = Δ[X] ÷ Δt   (mol/L per s)   ·   steiler in de grafiek = sneller'],
      ['Sneller door', 'hogere temperatuur · hogere concentratie · fijnere verdeling · katalysator'],
      ['Botsende-deeltjesmodel', 'meer botsingen, en meer botsingen met genoeg energie (activeringsenergie)'],
      ['Katalysator', 'verlaagt de activeringsenergie, wordt zelf niet verbruikt, verschuift het evenwicht niet'],
      ['Evenwichtsconstante', 'aA + bB ⇌ cC + dD:   K = [C]ᶜ[D]ᵈ ÷ ([A]ᵃ[B]ᵇ)   (vaste stoffen en water niet meetellen)'],
      ['Verschuiving', 'stof erbij → evenwicht van die kant af · temperatuur omhoog → de endotherme kant op · druk omhoog → de kant met minder gasmoleculen'],
      ['Exotherm / endotherm', 'exotherm: energie komt vrij (ΔE < 0) · endotherm: energie erin (ΔE > 0)'],
    ]},
  ]},

  { vak: 'natuurkunde', kop: 'Natuurkunde', emoji: '⚡', blokken: [
    { kop: 'Beweging', items: [
      ['Gemiddelde snelheid', 'v = Δx ÷ Δt   ·   versnelling a = Δv ÷ Δt   (m/s²)'],
      ['Eenparig versneld', 'v(t) = v₀ + a·t   ·   x(t) = v₀·t + ½·a·t²'],
      ['Zonder tijd', 'v² = v₀² + 2·a·x   (handig als t niet gegeven is)'],
      ['Vrije val', 'a = g = 9,81 m/s²   ·   vanuit stilstand: v = g·t, h = ½·g·t²'],
      ['(v,t)-diagram', 'oppervlakte onder de lijn = afgelegde weg · helling = versnelling'],
      ['(x,t)-diagram', 'helling = snelheid (raaklijn tekenen voor het moment zelf)'],
      ['Remweg', 'remweg ∝ v²: twee keer zo snel is vier keer zo ver'],
    ]},
    { kop: 'Krachten', items: [
      ['Tweede wet van Newton', 'F_res = m · a   ·   F in newton, m in kg'],
      ['Zwaartekracht', 'F_z = m · g'],
      ['Veerkracht', 'F_v = C · u   (C veerconstante N/m, u uitrekking m)'],
      ['Normaalkracht', 'loodrecht op het oppervlak; op een vlakke vloer gelijk aan F_z'],
      ['Wrijving', 'F_w,max = f · F_n   ·   luchtweerstand: F_w ∝ v² (bij hoge snelheid)'],
      ['Evenwicht', 'F_res = 0: alle krachten tegen elkaar weg (constante snelheid of stilstand)'],
      ['Helling', 'langs de helling: F_z · sin α   ·   loodrecht erop: F_z · cos α'],
      ['Cirkelbeweging', 'v = 2π·r ÷ T   ·   F_mpz = m·v² ÷ r   (middelpuntzoekende kracht, naar het midden)'],
      ['Derde wet', 'actie = −reactie: even groot, tegengesteld, op twee verschillende voorwerpen'],
    ]},
    { kop: 'Arbeid, energie en vermogen', items: [
      ['Arbeid', 'W = F · s · cos α   (α = hoek tussen kracht en verplaatsing)'],
      ['Kinetische energie', 'E_k = ½ · m · v²'],
      ['Zwaarte-energie', 'E_z = m · g · h'],
      ['Veerenergie', 'E_v = ½ · C · u²'],
      ['Behoud van energie', 'E_begin = E_eind (+ arbeid door wrijving als warmte)'],
      ['Vermogen', 'P = W ÷ t = E ÷ t   ·   ook P = F · v bij constante snelheid'],
      ['Rendement', 'η = E_nuttig ÷ E_in × 100%   (of P_nuttig ÷ P_in)'],
      ['Elektrisch', 'E = P · t   ·   1 kWh = 3,6 · 10⁶ J'],
    ]},
    { kop: 'Elektriciteit', items: [
      ['Wet van Ohm', 'U = I · R   ·   R in ohm (Ω)'],
      ['Vermogen', 'P = U · I = I² · R = U² ÷ R'],
      ['Lading', 'Q = I · t   (coulomb)   ·   1 A = 1 C/s'],
      ['Serie', 'I overal gelijk · U verdeelt zich · R_v = R₁ + R₂ + …'],
      ['Parallel', 'U over elk gelijk · I verdeelt zich · 1/R_v = 1/R₁ + 1/R₂ + …'],
      ['Soortelijke weerstand', 'R = ρ · l ÷ A   (ρ uit Binas 8–10, A doorsnede in m²)'],
      ['Sensoren', 'NTC: R daalt bij warmte · PTC: R stijgt · LDR: R daalt bij licht'],
      ['Spanningsdeler', 'U over R₁ = U_totaal · R₁ ÷ (R₁ + R₂)'],
    ]},
    { kop: 'Trillingen, golven en licht', items: [
      ['Trillingstijd', 'T = 1 ÷ f   ·   f in hertz (Hz)'],
      ['Golfsnelheid', 'v = λ · f   ·   λ golflengte (m)'],
      ['Harmonische trilling', 'u(t) = A · sin(2π · t ÷ T)   ·   fase φ = t ÷ T'],
      ['Massa-veersysteem', 'T = 2π · √(m ÷ C)'],
      ['Slinger', 'T = 2π · √(l ÷ g)'],
      ['Resonantie', 'aandrijffrequentie = eigenfrequentie → grote amplitude'],
      ['Breking (Snellius)', 'n₁ · sin i = n₂ · sin r   ·   n = c ÷ v   ·   c = 3,00 · 10⁸ m/s'],
      ['Grenshoek', 'sin g = n₂ ÷ n₁   (van dicht naar dun; daarboven totale terugkaatsing)'],
      ['Lenzen', '1/f = 1/v + 1/b   ·   S = 1/f (dioptrie, f in m)   ·   N = b ÷ v'],
    ]},
    { kop: 'Warmte, druk en gassen', items: [
      ['Warmte', 'Q = c · m · ΔT   (c soortelijke warmte, Binas 8–11)'],
      ['Verwarmen met vermogen', 'Q = P · t   →   t = c·m·ΔT ÷ P'],
      ['Druk', 'p = F ÷ A   (Pa = N/m²)   ·   1 bar = 1,0 · 10⁵ Pa'],
      ['Druk in vloeistof', 'p = ρ · g · h   (+ luchtdruk erboven)'],
      ['Gaswet', 'p · V ÷ T = constant   ·   p·V = n·R·T   (T in kelvin: K = °C + 273)'],
    ]},
    { kop: 'Straling en radioactiviteit', items: [
      ['Halveringstijd', 'N(t) = N₀ · (½)^(t ÷ t½)   ·   ook voor activiteit A(t)'],
      ['Activiteit', 'A = −ΔN ÷ Δt   (becquerel, Bq = 1 verval per s)'],
      ['Soorten', 'α: He-kern, stopt in papier · β: elektron, stopt in aluminium · γ: foton, lood nodig'],
      ['Vervalvergelijking', 'massagetal en atoomnummer links en rechts gelijk: ²³⁸U → ²³⁴Th + ⁴He'],
      ['Dosis', 'D = E ÷ m   (gray, Gy = J/kg)   ·   equivalente dosis H = w_R · D   (sievert, Sv)'],
      ['Fotonenergie', 'E = h · f = h · c ÷ λ   (h = 6,63 · 10⁻³⁴ J·s)'],
    ]},
  ]},

  { vak: 'wiskundeA', kop: 'Wiskunde A', emoji: '📊', blokken: [
    { kop: 'Statistiek', items: [
      ['Centrummaten', 'gemiddelde = som ÷ aantal · mediaan = middelste (bij even aantal: gemiddelde van de twee) · modus = vaakst'],
      ['Spreiding', 'spreidingsbreedte = max − min · kwartielafstand = Q₃ − Q₁ · standaardafwijking σ (GR: 1-Var Stats)'],
      ['Boxplot', 'min · Q₁ · mediaan · Q₃ · max   ·   de doos bevat de middelste 50%'],
      ['Relatieve frequentie', 'aantal ÷ totaal (× 100% voor procent)   ·   cumulatief: optellen tot en met'],
      ['Klassen', 'klassenmidden gebruiken voor het gemiddelde van een frequentietabel'],
      ['Effectmaat', 'verschil van gemiddelden ÷ standaardafwijking: < 0,4 klein · 0,4–0,8 middel · > 0,8 groot'],
      ['Steekproef', 'representatief = aselect én groot genoeg; let op vertekening (wie doet niet mee?)'],
    ]},
    { kop: 'Kansrekening', items: [
      ['Kans', 'P = gunstig ÷ mogelijk   (alle uitkomsten even waarschijnlijk)'],
      ['Somregel', 'P(A of B) = P(A) + P(B) − P(A en B)   ·   bij elkaar uitsluitend: gewoon optellen'],
      ['Productregel', 'P(A en B) = P(A) · P(B)   bij onafhankelijk   ·   anders P(A) · P(B | A)'],
      ['Complement', 'P(minstens één) = 1 − P(geen)'],
      ['Met of zonder terugleggen', 'met: kans blijft gelijk · zonder: teller en noemer gaan elk met één omlaag'],
      ['Vaasmodel', 'zonder terugleggen, volgorde doet er niet toe: hypergeometrisch, (gunstige combinaties ÷ alle combinaties)'],
      ['Verwachtingswaarde', 'E(X) = Σ x · P(X = x)   ·   "gemiddelde opbrengst op de lange duur"'],
    ]},
    { kop: 'Tellen', items: [
      ['Faculteit', 'n! = n · (n−1) · … · 1   ·   aantal volgordes van n dingen'],
      ['Permutaties', 'n · (n−1) · … (k factoren)  =  n! ÷ (n−k)!   (volgorde telt, zonder terugleggen)'],
      ['Combinaties', 'nCr = n! ÷ (r! · (n−r)!)   (volgorde telt niet)   GR: nCr'],
      ['Met terugleggen', 'nᵏ mogelijkheden   (k keer kiezen uit n, herhaling mag)'],
      ['Roosters', 'aantal kortste wegen = combinaties: (stappen totaal) nCr (stappen naar rechts)'],
    ]},
    { kop: 'Binomiale en normale verdeling', items: [
      ['Binomiaal', 'n keer, kans p per keer, X = aantal successen:  P(X = k) = nCr · pᵏ · (1−p)ⁿ⁻ᵏ'],
      ['GR', 'binompdf(n, p, k) = precies k   ·   binomcdf(n, p, k) = hoogstens k'],
      ['Minstens', 'P(X ≥ k) = 1 − binomcdf(n, p, k−1)'],
      ['Verwachting en spreiding', 'E(X) = n · p   ·   σ = √(n · p · (1−p))'],
      ['Normaal', 'klokvorm, symmetrisch rond μ   ·   68% binnen 1σ · 95% binnen 2σ · 99,7% binnen 3σ'],
      ['GR', 'normalcdf(onder, boven, μ, σ) = kans   ·   invNorm(opp links, μ, σ) = grens'],
      ['z-score', 'z = (x − μ) ÷ σ   ·   hoeveel standaardafwijkingen van het gemiddelde'],
    ]},
    { kop: 'Exponentieel en logaritmen', items: [
      ['Exponentieel', 'N(t) = b · gᵗ   (b beginwaarde, g groeifactor per tijdseenheid)'],
      ['Verdubbelingstijd', 'los op gᵗ = 2  →  t = log(2) ÷ log(g)   ·   halveringstijd: gᵗ = ½'],
      ['Groeifactor omrekenen', 'per uur g → per dag g²⁴ → per minuut g^(1/60)'],
      ['Logaritme', 'ᵍlog(x) = t  ⇔  gᵗ = x   ·   op de GR: log(x) ÷ log(g)'],
      ['Rekenregels', 'log(a·b) = log a + log b · log(a÷b) = log a − log b · log(aᵖ) = p · log a'],
      ['Van tabel naar formule', 'g = (waarde later ÷ waarde eerder)^(1 ÷ aantal stappen)'],
    ]},
    { kop: 'Verandering en afgeleide', items: [
      ['Differentiequotiënt', 'Δy ÷ Δx = (f(b) − f(a)) ÷ (b − a)   ·   gemiddelde verandering, helling van het koorde'],
      ['Afgeleide', 'f′(x) = helling van de raaklijn in x   ·   op de GR: dy/dx of nDeriv'],
      ['Machtsregel', 'f(x) = a·xⁿ  →  f′(x) = n·a·xⁿ⁻¹   ·   constante → 0'],
      ['Somregel', '(f + g)′ = f′ + g′   ·   (c · f)′ = c · f′'],
      ['Kettingregel', 'f(x) = (ax + b)ⁿ  →  f′(x) = n·(ax + b)ⁿ⁻¹ · a'],
      ['Top en dal', 'f′(x) = 0: maximum of minimum   ·   f′ > 0 stijgend, f′ < 0 dalend'],
      ['Toenamediagram', 'per stap Δy tekenen als staafje; hoogte = verandering, niet de waarde zelf'],
    ]},
  ]},
]
