/**
 * DE PROEF OP DE WACHTWOORDREGEL
 *
 * Twee soorten gevallen staan hier, en de tweede soort is de belangrijkste:
 * wachtwoorden die er dóór horen. Een regel die alles weigert is even nutteloos
 * als een regel die niets weigert, en alleen de eerste voelt veilig.
 *
 * Wat hier met opzet niet staat is een proef op de inhoud van de lijst. Die is
 * niet geverifieerd tegen een echte top-duizend en dus geen bewijs van iets; wat
 * hier getoetst wordt is de machinerie eromheen, want díe bepaalt of een korte
 * lijst ook op lange varianten bijt.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MINIMUM_LENGTE, grondvorm, langsteRij, wachtwoordklacht, VEELGEBRUIKT,
} from './wachtwoord'

describe('de lengte', () => {
  it('weigert wat korter is dan de ondergrens', () => {
    expect(wachtwoordklacht('kort')).toMatch(/minstens 12 tekens/)
    expect(wachtwoordklacht('elftekens12')).toMatch(/minstens 12 tekens/)
  })

  it('laat precies de ondergrens toe, want een grens hoort inclusief te zijn', () => {
    const twaalf = 'druifmolen7'
    expect(twaalf.length).toBe(MINIMUM_LENGTE - 1)
    expect(wachtwoordklacht(twaalf)).not.toBeNull()
    expect(wachtwoordklacht(twaalf + 'x')).toBeNull()
  })

  /* De oude eis was acht. Dat die nu níet meer volstaat is de hele wijziging,
     en zonder deze regel zou een teruggedraaide constante ongemerkt blijven. */
  it('acht tekens volstaat niet meer', () => {
    expect(wachtwoordklacht('acht1234')).toMatch(/minstens 12 tekens/)
  })
})

describe('de eigen naam', () => {
  it('weigert een wachtwoord met de accountnaam erin', () => {
    expect(wachtwoordklacht('abdelkader2019', 'abdelkader')).toMatch(/accountnaam/)
    expect(wachtwoordklacht('xxABDELKADERxx', 'abdelkader')).toMatch(/accountnaam/)
  })

  /* Een korte naam zit overal in. Wie "ali" heet moet "kwaliteitsbewaking"
     gewoon kunnen gebruiken; de regel begint pas bij vier tekens. */
  it('laat een korte naam met rust, want die zit toevallig overal in', () => {
    expect(wachtwoordklacht('kwaliteitsbewaking', 'ali')).toBeNull()
  })

  it('werkt ook zonder dat de naam bekend is', () => {
    expect(wachtwoordklacht('zeilbootkaravaan')).toBeNull()
  })
})

describe('patronen die geen wachtwoord zijn', () => {
  it('weigert te weinig verschillende tekens', () => {
    expect(wachtwoordklacht('aaaaaaaaaaaaaa')).toMatch(/verschillende tekens/)
    expect(wachtwoordklacht('abababababababab')).toMatch(/verschillende tekens/)
  })

  it('weigert een rechte lijn over het toetsenbord', () => {
    expect(wachtwoordklacht('qwertyuiopas')).toMatch(/rechte lijn/)
    expect(wachtwoordklacht('abcdefghijkl')).toMatch(/rechte lijn/)
    expect(wachtwoordklacht('123456789012')).not.toBeNull()
  })

  it('meet die lijn ook achterstevoren, want terugtypen is even makkelijk', () => {
    expect(langsteRij('ponmlkji')).toBe(8)
    expect(wachtwoordklacht('poiuytrewqas')).toMatch(/rechte lijn/)
  })

  /* En een gewoon wachtwoord bevat toevallig ook wel een stukje rij. "de" ligt
     naast elkaar in het alfabet en "as" op het toetsenbord. Pas als meer dan de
     helft op één lijn ligt is het een handbeweging. */
  it('struikelt niet over een toevallig stukje rij in een gewoon woord', () => {
    expect(langsteRij('zeilbootkaravaan')).toBeLessThan(8)
    expect(wachtwoordklacht('zeilbootkaravaan')).toBeNull()
  })
})

describe('de grondvorm: waarom een korte lijst op lange wachtwoorden bijt', () => {
  it('haalt een aangeplakt jaartal eraf', () => {
    expect(grondvorm('password2019')).toContain('password')
  })

  it('draait cijferspelling terug', () => {
    expect(grondvorm('p4ssw0rd!!!!')).toContain('password')
  })

  it('brengt een herhaling terug tot één keer', () => {
    expect(grondvorm('passwordpassword')).toContain('password')
    expect(grondvorm('abcabcabcabc')).toContain('abc')
  })

  /* De `1` kan een `i` of een `l` zijn en welke het is verschilt per woord.
     Daarom geeft de functie beide vormen en niet één. */
  it('geeft bij een 1 allebei de lezingen, want beide bestaan', () => {
    const vormen = grondvorm('adm1nadm1n')
    expect(vormen).toContain('admin')
    expect(grondvorm('he11ohe11o')).toContain('hello')
  })

  /* HET JAARTAL AFHALEN EN DE HERHALING TERUGBRENGEN ZIJN TWEE DINGEN
     Ze lijken elkaar te overlappen, want de vierde variant doet ze allebei
     achter elkaar. Toch dekt die de andere twee niet: wie beide bewerkingen
     tegelijk doet gaat één stap te ver, of juist niet ver genoeg. Deze twee
     gevallen wijzen dat aan, en zonder hen bleven twee mutanten in leven. */
  it('geeft ook de vorm mét herhaling maar zónder jaartal', () => {
    const vormen = grondvorm('abcabc2019')
    expect(vormen).toContain('abcabc')   // alleen het jaartal eraf
    expect(vormen).toContain('abc')      // en allebei de stappen
  })

  it('en de vorm zónder herhaling maar mét cijfers erin', () => {
    /* Hier valt de volgorde uit elkaar: eerst de cijfers achteraan weghalen
       maakt van `ab12ab12` het scheve `ab12ab`, dat niets herhaalt. Alleen
       ontdubbelen zónder te strippen vindt `ab12`. */
    expect(grondvorm('ab12ab12')).toContain('ab12')
  })

  it('plakt niet iets aan elkaar wat er niet stond', () => {
    expect(grondvorm('zeilboot')).toContain('zeilboot')
    expect(grondvorm('zeilboot')).not.toContain('zeilbot')
  })
})

describe('de lijst in werking', () => {
  it('weigert een veelgebruikt wachtwoord dat lang genoeg is gemaakt', () => {
    for (const poging of ['password1234', 'passwordpassword', 'p4ssw0rd!!!!',
                          'wachtwoord2024', 'welkom12345678', 'iloveyouiloveyou']) {
      expect(wachtwoordklacht(poging), poging).not.toBeNull()
    }
  })

  /* Dit is de kern van het ontwerp: `password` valt al af op lengte en zou dus
     nooit gevraagd worden, maar `password1234` haalt twaalf tekens. Zonder de
     grondvorm zou de lijst niets doen naast de lengte-eis. */
  it('en juist dát is waar de lijst voor dient', () => {
    expect('password'.length).toBeLessThan(MINIMUM_LENGTE)
    expect('password1234'.length).toBeGreaterThanOrEqual(MINIMUM_LENGTE)
    expect(wachtwoordklacht('password1234')).toMatch(/heel veel mensen/)
  })

  it('neemt een vervangende lijst aan, zodat dit niet over de inhoud gaat', () => {
    const eigen = new Set(['zeilbootkaravaan'])
    expect(wachtwoordklacht('zeilbootkaravaan', '', eigen)).toMatch(/heel veel mensen/)
    expect(wachtwoordklacht('zeilbootkaravaan', '', new Set())).toBeNull()
  })

  it('staat in kleine letters, anders kijkt de grondvorm ernaast', () => {
    for (const woord of VEELGEBRUIKT) {
      expect(woord, woord).toBe(woord.toLowerCase())
      expect(woord, woord).toMatch(/^[a-z0-9]+$/)
    }
  })
})

describe('wat er gewoon doorheen hoort', () => {
  /* Zonder deze proef zou `() => 'fout'` alle andere proeven halen. */
  it('laat een gewoon lang wachtwoord met rust', () => {
    for (const goed of ['zeilbootkaravaan', 'drieappelsenpeer', 'mijnfietsstaatbuiten',
                        'Kt7#vunderbaar99', 'tuinslangvlinder', 'kaasschaafmuseum']) {
      expect(wachtwoordklacht(goed, 'abdelkader'), goed).toBeNull()
    }
  })

  it('eist geen hoofdletter, cijfer of leesteken', () => {
    expect(wachtwoordklacht('allemaalkleineletters')).toBeNull()
  })
})

/**
 * DE TWEE KOPIEËN MOETEN GELIJK BLIJVEN
 *
 * Dezelfde regel staat in `health/database/39-een-wachtwoord-dat-standhoudt.sql`,
 * en dat is geen verdubbeling uit slordigheid: de browser geeft antwoord terwijl
 * je typt, de database bepaalt wat er gebeurt. Wie rechtstreeks een RPC doet gaat
 * langs het scherm heen.
 *
 * Twee kopieën lopen uit elkaar zodra iemand er één aanpast. Deze proef leest
 * het SQL-bestand en legt het ernaast. Wat hij níet kan is plpgsql uitvoeren,
 * daarvoor is een database nodig en die staat niet in de poort. Wat hij dus
 * bewaakt is de lijst en het getal, de twee dingen die je in één van beide
 * bestanden zou veranderen en in het andere vergeten.
 */
describe('de database draagt dezelfde regel', () => {
  const sql = readFileSync('health/database/39-een-wachtwoord-dat-standhoudt.sql', 'utf8')

  it('bevat precies dezelfde lijst, woord voor woord', () => {
    const inSql = new Set([...sql.matchAll(/^\s*(?:\('[a-z0-9]+'\),?\s*)+$/gm)]
      .flatMap((r) => [...r[0].matchAll(/\('([a-z0-9]+)'\)/g)].map((m) => m[1])))
    expect(inSql.size).toBeGreaterThan(0)
    expect([...inSql].sort()).toEqual([...VEELGEBRUIKT].sort())
  })

  it('hanteert dezelfde ondergrens', () => {
    expect(sql).toContain(`length(v_ww) < ${MINIMUM_LENGTE}`)
    expect(sql).toContain(`minstens ${MINIMUM_LENGTE} tekens`)
  })

  /* De oude eis mag nergens meer staan, in geen van beide bestanden. Bestand 33
     had hem op twee plaatsen en de dump op één; bestand 39 vervangt alle drie. */
  it('draagt de oude eis van acht tekens niet meer', () => {
    expect(sql).not.toContain('minstens acht tekens')
    expect(sql).not.toMatch(/length\([^)]*\)\s*<\s*8\b/)
  })
})
