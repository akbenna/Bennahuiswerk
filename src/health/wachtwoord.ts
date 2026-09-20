/**
 * WAT EEN WACHTWOORD MOET KUNNEN HEBBEN
 *
 * De eis stond op acht tekens, op vier plaatsen los van elkaar ingetikt. Bestand
 * 32 noemde dat zelf al te weinig en schoof het besluit voor zich uit, want het
 * raakt de mensen die er al zijn.
 *
 * WAT ACHT TEKENS WAARD ZIJN
 *
 * De hashes zijn bcrypt met cost 10. Op deze machine is dat gemeten: 17,4 hashes
 * per seconde op één kern. Een aanvaller die de hashes heeft en tienduizend keer
 * sneller rekent dan die ene kern doet dan 173.000 gokken per seconde, en dan
 * duurt een uitputtende zoektocht over alleen kleine letters:
 *
 *     8 tekens   26^8  = 2,1e11   14 dagen
 *    10 tekens   26^10 = 1,4e14   26 jaar
 *    12 tekens   26^12 = 9,5e16   17.000 jaar
 *
 * Acht is dus te weinig en twaalf is ruim. Let op waar de winst ophoudt: bij
 * tien is bruut geweld al kansloos. Nóg langer eisen koopt daar niets meer.
 *
 * EN DAAROM IS LENGTE NIET WAAR HET GEVAAR ZIT
 *
 * Niemand kiest twaalf willekeurige letters. Iemand kiest `abdelkader2019` —
 * veertien tekens, en in een woordenboekaanval binnen een seconde gevonden. Een
 * lengte-eis alleen verplaatst het probleem dus; hij lost het niet op. De drie
 * regels hieronder staan in die volgorde van belangrijkheid omgekeerd: de lengte
 * is de makkelijkste en de minst nuttige.
 *
 * WAT HIER MET OPZET NIET STAAT
 *
 * Geen eis aan hoofdletters, cijfers of leestekens. Die regel is niet neutraal
 * maar schadelijk: hij levert `Wachtwoord1!` op — precies de vorm die elke
 * aanvaller als eerste probeert — en hij maakt een lange zin, het enige dat
 * werkelijk helpt, onnodig lastig. NIST liet die eis in 2017 vallen en raadt
 * sindsdien aan wat hier staat: lengte, en toetsen tegen wat veel voorkomt.
 *
 * WAAROM DE REGEL ALLEEN GELDT BIJ HET ZETTEN
 *
 * Nooit bij het aanmelden. Wie er al is met acht tekens komt gewoon binnen; pas
 * wie een nieuw wachtwoord kiest krijgt de nieuwe eis. Anders sluit een strengere
 * regel met terugwerkende kracht mensen buiten uit hun eigen gegevens, en dat is
 * het bezwaar dat bestand 32 opschreef. `kal_aanmelden` kijkt niet naar lengte
 * en dat moet zo blijven.
 */

/** De ondergrens. Zie de kop: twaalf is ruim, tien is de bodem, acht is te dun. */
export const MINIMUM_LENGTE = 12

/**
 * Het wachtwoord teruggebracht tot waar het op lijkt.
 *
 * Een blokkeerlijst van veelgebruikte wachtwoorden lijkt op het eerste gezicht
 * zinloos naast een eis van twaalf tekens: `password` is er acht en `123456`
 * zes, dus die vallen al af op lengte. Wat er overblijft is juist het gevaar —
 * `password1234`, `Passw0rd!!!!`, `passwordpassword`. Twaalf tekens, en alle
 * drie staan ze boven aan elke lijst die ooit uit een datalek kwam.
 *
 * Daarom toetst de lijst niet op het wachtwoord zelf maar op wat eronder zit:
 * kleine letters, cijferspelling teruggedraaid, leestekens eruit, een aangeplakt
 * jaartal eraf, en een herhaald stuk tot één keer teruggebracht. Zo bijt een
 * lijst van duizend korte wachtwoorden alsnog op lange varianten ervan.
 *
 * De omkering van `1` is met opzet `i` en niet `l`: `passw1rd` bestaat niet,
 * `adm1n` wel. Waar beide kunnen wint de vorm die in de lijst staat, want de
 * functie geeft alle varianten terug en niet één.
 */
export function grondvorm(ww: string): string[] {
  const klein = ww.toLowerCase()
  const cijfers: Record<string, string[]> = {
    '4': ['a'], '@': ['a'], '3': ['e'], '1': ['i', 'l'], '0': ['o'],
    '5': ['s'], '$': ['s'], '7': ['t'], '8': ['b'],
  }
  /* HET UITROEPTEKEN STAAT ER MET OPZET NIET IN
     Als leet voor een `i` bestaat het, maar als opvulling achteraan komt het
     veel vaker voor — en dan is het schadelijk om het te vertalen. Stond het
     erin, dan werd `p4ssw0rd!!!!` de grondvorm `passwordiiii`, dat in geen
     enkele lijst staat, en glipte het er dus juist doorheen. Nu valt het als
     leesteken weg en blijft `password` over. De proef ving dit. */
  /* Alle omkeringen tegelijk, maar niet uitputtend: bij vijf leetcijfers zouden
     dat al tweeëndertig varianten zijn en bij tien duizend. Twee vormen volstaan
     — alles vervangen, en niets vervangen — plus de `1`-splitsing, want dat is
     de enige waar de keuze er echt toe doet. */
  const vormen = new Set<string>([klein])
  for (const keuze of ['i', 'l']) {
    let uit = ''
    for (const teken of klein) {
      const opties = cijfers[teken]
      uit += opties ? (opties.includes(keuze) ? keuze : opties[0]) : teken
    }
    vormen.add(uit)
  }

  const uit = new Set<string>()
  for (const vorm of vormen) {
    const letters = vorm.replace(/[^a-z0-9]/g, '')
    uit.add(letters)
    /* Een aangeplakt getal eraf: `password2019`, `welkom123`. Alleen achteraan,
       want `1password` is een ander woord en geen versiering. */
    uit.add(letters.replace(/\d+$/, ''))
    /* Een herhaald stuk tot één keer. `passwordpassword` is niet twee keer zo
       sterk als `password`; het is precies even zwak. */
    uit.add(ontdubbel(letters))
    uit.add(ontdubbel(letters.replace(/\d+$/, '')))
  }
  uit.delete('')
  return [...uit]
}

/** `abcabcabc` → `abc`. Alleen als het hele woord een heel aantal herhalingen is. */
function ontdubbel(tekst: string): string {
  for (let lengte = 1; lengte <= tekst.length / 2; lengte++) {
    if (tekst.length % lengte !== 0) continue
    const stuk = tekst.slice(0, lengte)
    if (stuk.repeat(tekst.length / lengte) === tekst) return stuk
  }
  return tekst
}

/**
 * Loopt het wachtwoord in een rechte lijn over het toetsenbord, het alfabet of
 * de cijfers?
 *
 * `123456789012` is twaalf tekens en valt dus niet op lengte af. `qwertyuiopas`
 * ook niet, en `abcdefghijkl` ook niet. Dat zijn geen wachtwoorden maar
 * handbewegingen, en ze staan in elke aanvalslijst die er is.
 *
 * De toets kijkt naar het langste stuk dat op zo'n rij ligt, vooruit of
 * achteruit. Ligt meer dan de helft van het wachtwoord op één zo'n stuk, dan is
 * het een handbeweging met wat aankleding.
 */
const RIJEN = [
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'qazwsxedcrfvtgbyhnujmikolp',
]

export function langsteRij(ww: string): number {
  const klein = ww.toLowerCase()
  let langste = 1
  for (const rij of RIJEN) {
    for (const richting of [rij, [...rij].reverse().join('')]) {
      let lopend = 1
      for (let i = 1; i < klein.length; i++) {
        /* `charAt` en niet `[i]`: die laatste geeft `string | undefined`, en
           `indexOf(undefined)` is geen typefout maar wel een stille onzin. */
        const vorige = richting.indexOf(klein.charAt(i - 1))
        const nu = richting.indexOf(klein.charAt(i))
        lopend = (vorige >= 0 && nu === vorige + 1) ? lopend + 1 : 1
        if (lopend > langste) langste = lopend
      }
    }
  }
  return langste
}

/**
 * Wat er mis is met dit wachtwoord, of niets.
 *
 * Eén klacht tegelijk, en in deze volgorde: eerst wat je zelf ziet (te kort),
 * dan wat je zelf kunt bedenken (je eigen naam erin), dan wat je niet kunt
 * weten (het staat in een lijst). Iemand die drie klachten tegelijk krijgt leest
 * er geen van.
 *
 * `account` mag leeg zijn — bij een herstel weet het scherm soms nog niet wie
 * het is. Dan vervalt die ene regel en de rest niet.
 */
export function wachtwoordklacht(ww: string, account = '', lijst = VEELGEBRUIKT): string | null {
  if (ww.length < MINIMUM_LENGTE) {
    return `Kies een wachtwoord van minstens ${MINIMUM_LENGTE} tekens`
  }

  const klein = ww.toLowerCase()
  const naam = account.trim().toLowerCase()
  /* Drie tekens is te kort om iets te betekenen: wie "ali" heet mag "kwaliteit"
     gebruiken. Vanaf vier wordt het een aanwijzing. */
  if (naam.length >= 4 && klein.includes(naam)) {
    return 'Je accountnaam staat erin, en dat raadt iemand meteen'
  }

  /* Minder dan vijf verschillende tekens over twaalf posities: dat is
     `aaaaaaaaaaaa` of `abababababab`, en die vallen door geen enkele andere
     regel. */
  const verschillend = new Set(klein).size
  if (verschillend < 5) {
    return 'Te weinig verschillende tekens: dit is een patroon, geen wachtwoord'
  }

  if (langsteRij(ww) > ww.length / 2) {
    return 'Dit loopt in een rechte lijn over het toetsenbord'
  }

  for (const vorm of grondvorm(ww)) {
    if (lijst.has(vorm)) {
      return 'Dit lijkt te veel op een wachtwoord dat heel veel mensen kiezen'
    }
  }

  return null
}

/**
 * DE LIJST
 *
 * Wat hier staat is samengesteld uit wat er in gepubliceerde datalekken telkens
 * boven komt drijven, en is met opzet klein gehouden: door `grondvorm` bijt een
 * korte lijst ook op lange varianten, en dat is waar hij hier voor dient.
 *
 * Deze lijst is niet geverifieerd tegen een echte top-duizend — die is van hier
 * niet te bereiken. Hij is dus een ondergrens en geen bewijs: wat erin staat
 * wordt geweigerd, en wat er niet in staat is daarmee niet goedgekeurd. Zeg dat
 * ook zo tegen wie het vraagt.
 *
 * Wil je hem vervangen door een echte lijst, dan hoeft alleen deze verzameling
 * te veranderen; alle regels eromheen blijven staan, en `wachtwoordklacht` neemt
 * een eigen lijst aan zodat een proef hem kan vervangen.
 */
export const VEELGEBRUIKT: ReadonlySet<string> = new Set([
  // de eeuwige top
  'password', 'wachtwoord', 'welkom', 'welcome', 'letmein', 'monkey', 'dragon',
  'master', 'shadow', 'sunshine', 'princess', 'football', 'baseball', 'superman',
  'batman', 'trustno', 'iloveyou', 'admin', 'root', 'guest', 'login', 'passwd',
  'secret', 'qwerty', 'azerty', 'qwertz', 'zaq', 'starwars', 'pokemon', 'hunter',
  'freedom', 'whatever', 'computer', 'internet', 'samsung', 'google', 'facebook',
  'michael', 'jennifer', 'jordan', 'harley', 'ranger', 'buster', 'thomas',
  'robert', 'daniel', 'andrew', 'joshua', 'matthew', 'charlie', 'jessica',
  'ashley', 'amanda', 'nicole', 'hannah', 'chocolate', 'cookie', 'pepper',
  'ginger', 'summer', 'winter', 'spring', 'autumn', 'purple', 'orange', 'yellow',
  'silver', 'diamond', 'tigger', 'soccer', 'hockey', 'killer', 'mercedes',
  'ferrari', 'porsche', 'corvette', 'maggie', 'jasmine', 'banana', 'cheese',
  'flower', 'angel', 'heaven', 'forever', 'friend', 'family', 'liverpool',
  'chelsea', 'arsenal', 'barcelona', 'juventus', 'united', 'zidane', 'ajax',
  'feyenoord', 'psv', 'oranje', 'holland', 'nederland', 'amsterdam', 'rotterdam',
  // Nederlands, want de app is dat ook
  'geheim', 'inloggen', 'aanmelden', 'gezin', 'vakantie', 'zomer', 'winter',
  'voetbal', 'lekker', 'liefde', 'vriend', 'moeder', 'vader', 'oma', 'opa',
  'school', 'huiswerk', 'gezondheid', 'gewicht', 'eten', 'dokter', 'ziekenhuis',
  'konijn', 'poesje', 'hondje', 'bloemetje', 'zonnetje', 'kusje', 'schatje',
  'lievelings', 'wachtwoorden', 'nieuwwachtwoord', 'mijnwachtwoord',
  // en de vormen die mensen kiezen als er "minstens twaalf" staat
  'passwordpassword', 'wachtwoordwachtwoord', 'qwertyqwerty', 'abcabcabc',
  'letmeinletmein', 'welkomwelkom', 'iloveyouiloveyou', 'geheimgeheim',
  'wachtwoordisgeheim', 'ditismijnwachtwoord', 'ditiseenwachtwoord',
  'eenlangwachtwoord', 'langwachtwoord', 'veiligwachtwoord', 'sterkwachtwoord',
  'correcthorsebatterystaple', 'thisismypassword', 'mypasswordis',
  'ilovemyfamily', 'trustnoone', 'changemeplease', 'temporarypassword',
])
