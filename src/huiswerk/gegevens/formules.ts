/**
 * FORMULES & UITLEG
 *
 * De formulekaart: wat er op een blaadje naast het schrift hoort te liggen.
 * Mechanisch overgenomen uit de oude pagina.
 *
 * Elk blok zegt erbij bij welke vakken het hoort. Dat is er niet voor de
 * ordening (die zit al in de koppen) maar omdat de kaart ook naast een som
 * open kan staan (`Klapkaart` onderaan het oefenscherm). Daar hoort Wassima bij
 * natuurkunde geen kansrekening te zien staan: een blaadje waar je doorheen
 * moet bladeren is geen blaadje meer.
 */

/** De vakken die een formulekaart hebben. Rekenen op de basisschool niet: daar
 *  is de regel de som zelf en niet iets om naast te leggen. */
export type Formulevak = 'wiskunde' | 'wiskundeA' | 'natuurkunde'

const REKENVAKKEN: readonly Formulevak[] = ['wiskunde', 'wiskundeA']

export interface Formuleblok {
  kop: string
  vakken: readonly Formulevak[]
  items: Array<[string, string]>
}

export const FORMULEBLOKKEN: Formuleblok[] = [
  {kop:'Oppervlakte & omtrek', vakken:REKENVAKKEN, items:[
    ['Rechthoek','opp = l × b   ·   omtrek = 2 × (l + b)'],
    ['Vierkant','opp = z²   ·   omtrek = 4 × z'],
    ['Driehoek','opp = ½ × basis × hoogte'],
    ['Parallellogram','opp = basis × hoogte'],
    ['Trapezium','opp = ½ × (a + c) × hoogte'],
    ['Cirkel','opp = π × r²   ·   omtrek = 2 × π × r   (π ≈ 3,14)'],
  ]},
  {kop:'Pythagoras (rechthoekige driehoek)', vakken:REKENVAKKEN, items:[
    ['Schuine zijde c','a² + b² = c²  →  c = √(a² + b²)'],
    ['Rechthoekszijde','a = √(c² − b²)'],
  ]},
  {kop:'Hoeken', vakken:REKENVAKKEN, items:[
    ['Driehoek','som van de hoeken = 180°'],
    ['Vierhoek','som van de hoeken = 360°'],
    ['Bij evenwijdige lijnen','F-hoeken gelijk · Z-hoeken gelijk · overstaande hoeken gelijk'],
  ]},
  {kop:'Inhoud (ruimtefiguren)', vakken:REKENVAKKEN, items:[
    ['Balk','inhoud = l × b × h'],
    ['Kubus','inhoud = z³'],
    ['Prisma / cilinder','inhoud = oppervlakte grondvlak × hoogte'],
    ['Cilinder','inhoud = π × r² × h'],
  ]},
  /* Verhoudingen en eenheden gebruikt de natuurkunde net zo hard: v = s / t
     rekent niet zonder "km/u → m/s" en een procent. Daarom staat dit blok bij
     alle drie. */
  {kop:'Rekenen & verbanden', vakken:['wiskunde','wiskundeA','natuurkunde'], items:[
    ['Procent','% = (deel ÷ geheel) × 100'],
    ['Groeifactor','erbij p%: 1 + p/100   ·   eraf p%: 1 − p/100   ·   nieuw = oud × factor'],
    ['Rechte lijn','y = a·x + b   (a = hellingsgetal, b = startgetal)'],
    ['Hellingsgetal','a = (y₂ − y₁) ÷ (x₂ − x₁)'],
    ['Exponentieel','N = beginwaarde × groeifactorᵗ'],
    ['Statistiek','gemiddelde = som ÷ aantal · mediaan = middelste · modus = meest voorkomend'],
  ]},
  {kop:'Wiskunde A: verandering & afgeleide', vakken:['wiskundeA'], items:[
    ['Differentiequotiënt','(f(b) − f(a)) ÷ (b − a)   (gemiddelde verandering op [a,b])'],
    ['Afgeleide van xⁿ','f(x) = xⁿ  →  f′(x) = n·xⁿ⁻¹'],
    ['Helling in een punt','de helling van de grafiek in x is f′(x)'],
    ['Exponentiële groei','per n perioden: groeifactor = gⁿ   ·   procent = (g − 1) × 100%'],
  ]},
  {kop:'Wiskunde A: kans & statistiek', vakken:['wiskundeA'], items:[
    ['Kans','P = aantal gunstig ÷ aantal mogelijk'],
    ['Faculteit','n! = n × (n−1) × … × 2 × 1   (aantal volgordes)'],
    ['Verwachtingswaarde','E = som van (kans × waarde)'],
    ['Centrummaten','gemiddelde = som ÷ aantal · mediaan = middelste · modus = vaakst'],
  ]},
  {kop:'Natuurkunde: beweging & kracht', vakken:['natuurkunde'], items:[
    ['Snelheid','v = s / t   (km/u → m/s: ÷ 3,6)'],
    ['Versnelling','a = Δv / t'],
    ['Eenparig versneld','v = v₀ + a·t   ·   vanuit stilstand: s = ½·a·t²'],
    ['Dichtheid','ρ = m / V'],
    ['Kracht (Newton)','F = m × a'],
    ['Zwaartekracht','Fz = m × g   (g ≈ 9,81 N/kg)'],
    ['Nettokracht','tel krachten met richting op (rechts − links)'],
  ]},
  {kop:'Natuurkunde: energie & warmte', vakken:['natuurkunde'], items:[
    ['Arbeid','W = F × s'],
    ['Kinetische energie','Ek = ½ × m × v²'],
    ['Zwaarte-energie','Ez = m × g × h'],
    ['Veerenergie','Ev = ½ × C × u²'],
    ['Energiebehoud (vrije val)','½mv² = mgh  →  v = √(2gh)'],
    ['Vermogen','P = E / t'],
    ['Rendement','η = (nuttig ÷ toegevoerd) × 100%'],
    ['Warmte','Q = c × m × ΔT'],
  ]},
  {kop:'Natuurkunde: elektriciteit', vakken:['natuurkunde'], items:[
    ['Wet van Ohm','U = I × R'],
    ['Elektrisch vermogen','P = U × I'],
    ['Lading','Q = I × t   (in coulomb)'],
    ['Energieverbruik','E = P × t   (kWh = kW × uur)'],
  ]},
];

/** De blokken die bij dit vak horen, in dezelfde volgorde als hierboven. Een
 *  vak zonder formulekaart geeft een lege lijst: dan hoort er ook geen kaart
 *  te staan, en niet een lege. */
export function formulesVoor(vak: string): Formuleblok[] {
  return FORMULEBLOKKEN.filter((b) => (b.vakken as readonly string[]).includes(vak))
}
