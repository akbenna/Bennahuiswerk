/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Een privacyverklaring is de enige tekst in deze app waar iemand zich later op
 * kan beroepen. Wat erin staat moet dus waar zijn, en wat waar is moet erin
 * staan. Dat is maar ten dele te toetsen, en dit bestand toetst het deel dat
 * kan.
 *
 * **Het document en de app zeggen hetzelfde.** Twee plekken die los van elkaar
 * bijgewerkt worden, groeien uit elkaar. Bij een juridisch document is dat niet
 * slordig maar gevaarlijk: dan belooft de een iets wat de ander niet doet.
 *
 * **Elke verwerker wordt bij naam genoemd.** Een verklaring die zegt "wij delen
 * gegevens met derden" zonder te zeggen met wie, zegt niets.
 *
 * **En er staat geen belofte in die de app niet waarmaakt.** De knop om je
 * gegevens te verwijderen bestaat niet, dus die mag er ook niet in staan. Dit
 * is de proef die het moeilijkst te schrijven was en er het meest toe doet:
 * hij verbiedt woorden die er goed uitzien.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CONTACT, NAGEKEKEN, PRIVACY, platteTekst } from './privacy'

const document = () => readFileSync('health/PRIVACY.md', 'utf8')

describe('het document en de app', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('zeggen woord voor woord hetzelfde', () => {
    const md = document()
    for (const stuk of PRIVACY) {
      expect(md, `kop "${stuk.kop}"`).toContain(`## ${stuk.kop}`)
      for (const alinea of stuk.alineas) expect(md, stuk.kop).toContain(alinea)
    }
  })

  it('en het document is bijgewerkt na de laatste wijziging', () => {
    /* Zonder deze regel zou een gewijzigde tekst in de app kunnen staan terwijl
       het document de oude belofte draagt. Draai
       `node gereedschap/privacy-schrijven.mjs` als dit omvalt. */
    expect(document()).toContain(NAGEKEKEN)
    expect(document()).toContain(CONTACT)
  })

  it('draagt geen enkel stuk dat in de app niet meer staat', () => {
    const koppen = [...document().matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(koppen).toEqual(PRIVACY.map((s) => s.kop))
  })
})

describe('wat er in moet staan', () => {
  const alles = platteTekst()

  it('noemt elke verwerker bij naam', () => {
    for (const wie of ['Supabase', 'Anthropic', 'OpenAI', 'Vercel']) {
      expect(alles, wie).toContain(wie)
    }
  })

  it('noemt de grondslag en de toezichthouder', () => {
    expect(alles).toContain('toestemming')
    expect(alles).toContain('artikel 9')
    expect(alles).toContain('Autoriteit Persoonsgegevens')
  })

  it('noemt elk soort gegeven dat de app werkelijk bewaart', () => {
    for (const wat of ['gewicht', 'bloeddruk', 'labwaarden', 'slaap', 'stappen',
                       'vragenlijsten', 'notities', 'wachtwoord']) {
      expect(alles, wat).toContain(wat)
    }
  })

  it('en zegt wat er met een foto gebeurt', () => {
    expect(alles).toMatch(/niet bewaard/)
  })

  /* De app stuurt bij een herkenning alleen de tekst of de foto van die
     maaltijd naar het model, en niet de rest van je gegevens. Dat is voor een
     lezer het verschil tussen "mijn eten gaat naar een AI" en "mijn bloeddruk
     gaat naar een AI", en het hoort er daarom met zoveel woorden te staan. */
  it('zegt wat er níet naar het model gaat', () => {
    expect(alles).toMatch(/gaan daar niet heen/)
  })
})

describe('wat er niet in mag staan', () => {
  /* Een verklaring die een recht belooft dat de app niet kan uitvoeren, wekt
     vertrouwen dat nergens op rust. Zolang er geen knop is, mag er ook geen
     zin staan die er een suggereert. Valt deze proef om omdat de knop er
     inmiddels wél is, dan hoort de zin hier veranderd te worden en niet de
     proef weggehaald. */
  it('belooft niets over verwijderen wat de app niet doet', () => {
    const alles = platteTekst()

    /* Deze proef stond er eerst omgekeerd in: toen was er geen knop, en mocht
       er geen zin staan die er een suggereerde. Bestand 52 maakte de knop, dus
       draait de proef mee. Wat hetzelfde blijft is wat hij bewaakt: de tekst
       mag niet meer beloven dan er gebeurt.

       Drie dingen doet de app werkelijk, en alle drie horen er te staan, want
       ze bepalen of iemand durft te tikken: hij laat eerst zien wat er weggaat,
       hij vraagt het wachtwoord opnieuw, en er is geen weg terug. */
    expect(alles).toContain('laat eerst zien wat er precies weg zou gaan')
    expect(alles).toContain('wachtwoord er nog een keer bij')
    expect(alles).toContain('geen prullenbak')

    /* En het ene dat níet verdwijnt. Een verklaring die "alles wordt
       verwijderd" zegt terwijl er een aantekening blijft staan, klopt niet. */
    expect(alles).toContain('blijft een aantekening')
  })

  /* De lijst met testers bevat geen gezondheidsgegeven, en dat staat in de
     verklaring. Dat is geen vrome wens maar een eigenschap van `kal_testers`
     in bestand 48, die precies twaalf velden teruggeeft en geen ervan uit de
     app zelf. Deze proef houdt de twee zinnen bij elkaar: gaat die functie ooit
     meer teruggeven, dan valt hij hier om. */
  it('belooft over de beheerder niets meer dan de database teruggeeft', () => {
    const sql = readFileSync('health/database/48-een-wachtkamer-en-een-budget.sql', 'utf8')
    const lijst = sql.slice(sql.indexOf('create or replace function public.kal_testers'))
      .slice(0, sql.slice(sql.indexOf('create or replace function public.kal_testers'))
        .indexOf('end $function$'))
    for (const verboden of ['gewicht', 'bloeddruk', 'kal_dagen', 'kal_regels', 'kal_metingen']) {
      expect(lijst, `kal_testers noemt ${verboden}`).not.toContain(verboden)
    }
    expect(platteTekst()).toContain('Geen gewicht, geen bloeddruk, geen labwaarde')
  })
})

describe('het staat in versiebeheer', () => {
  /* Een privacyverklaring die niet in versiebeheer staat, is een belofte zonder
     datum: er is dan niet na te gaan wat er op enig moment beloofd werd. */
  it('is een bestand dat git kent', () => {
    const uit = execFileSync('git', ['ls-files', 'health/PRIVACY.md'], { encoding: 'utf8' })
    expect(uit.trim()).toBe('health/PRIVACY.md')
  })
})
