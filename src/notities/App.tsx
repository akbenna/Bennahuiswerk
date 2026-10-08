/**
 * NOTITIES
 *
 * Een notetaker voor alles buiten de spreekkamer: bestuur, kaderwerk,
 * zakelijk overleg en telefoontjes. Consulten en alles met patiëntgegevens
 * blijven bij SmartVoice; dat staat ook op het inlogscherm, want het is de
 * grens waar de rest van het ontwerp op rust.
 *
 * Eigen aanmelding, los van de startpagina: een ander Supabase-project, dus
 * een andere sessie. Inloggen gaat met een cijfercode en niet met een link,
 * omdat een web-app op het beginscherm van een iPhone een eigen opslag heeft:
 * een link zou in Safari openen en daar inloggen, niet in de app.
 */
import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { db, gekoppeld } from './verbinding'
import { leesRoute } from './opmaak'
import { Acties, Instellingen, Lijst, Notitie, Opnemen } from './schermen'

function useHash(): string {
  const [hash, zetHash] = useState(location.hash)
  useEffect(() => {
    const f = (): void => zetHash(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return hash
}

function NietGekoppeld() {
  return (
    <main className="inlog">
      <h1>Notities</h1>
      <p>Deze app is nog niet aan zijn database gekoppeld. Vul het adres en de publieke sleutel van het Notities-project in <code>src/notities/verbinding.ts</code> in; de stappen staan in <code>notities/README.md</code>.</p>
    </main>
  )
}

function Inloggen() {
  const [email, zetEmail] = useState('')
  const [code, zetCode] = useState('')
  const [stap, zetStap] = useState<'email' | 'code'>('email')
  const [melding, zetMelding] = useState('')

  const stuur = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    zetMelding('')
    /* Geen nieuwe gebruikers vanuit de app. De eerste aanmelding gaat één keer
       via het dashboard; zie stap 1 van de README. */
    const { error } = await db().auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) { zetMelding(error.message); return }
    zetStap('code')
  }
  const bevestig = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const { error } = await db().auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    if (error) zetMelding('Deze code klopt niet of is verlopen. Vraag een nieuwe aan.')
  }

  return (
    <main className="inlog">
      <h1>Notities</h1>
      <p className="klein">Voor vergaderingen, overleggen en zakelijke gesprekken. Niet voor consulten of iets anders met patiëntgegevens.</p>
      {stap === 'email' ? (
        <form onSubmit={(e) => void stuur(e)}>
          <label htmlFor="email">E-mailadres</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => zetEmail(e.target.value)} />
          <button className="knop primair" type="submit">Stuur inlogcode</button>
        </form>
      ) : (
        <form onSubmit={(e) => void bevestig(e)}>
          <label htmlFor="code">Code uit de e-mail naar {email}</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => zetCode(e.target.value)} />
          <button className="knop primair" type="submit">Inloggen</button>
          <button className="knop tekst" type="button" onClick={() => zetStap('email')}>Ander adres</button>
        </form>
      )}
      {melding && <p className="fout" role="alert">{melding}</p>}
    </main>
  )
}

const TABS = [
  ['opnemen', '#/', 'Opnemen'],
  ['notities', '#/notities', 'Notities'],
  ['acties', '#/acties', 'Acties'],
  ['instellingen', '#/instellingen', 'Instellingen'],
] as const

function Binnen({ sessie }: { sessie: Session }) {
  const route = leesRoute(useHash())
  const uid = sessie.user.id

  /* De eerste keer: standaardcontexten en instellingen. De functie neemt de
     ingelogde gebruiker zelf en doet niets als alles er al staat. */
  useEffect(() => {
    void db().from('contexts').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (!count) void db().rpc('maak_standaard_aan')
    })
  }, [uid])

  const inhoud = route.scherm === 'notitie' ? <Notitie key={route.id} id={route.id} />
    : route.scherm === 'notities' ? <Lijst />
    : route.scherm === 'acties' ? <Acties />
    : route.scherm === 'instellingen' ? <Instellingen uid={uid} />
    : <Opnemen uid={uid} />
  const actief = route.scherm === 'notitie' ? 'notities' : route.scherm

  return (
    <>
      <div className="pagina">{inhoud}</div>
      <nav className="tabs" aria-label="Hoofdmenu">
        {TABS.map(([sleutel, href, naam]) => (
          <a key={sleutel} href={href} aria-current={actief === sleutel ? 'page' : undefined}>{naam}</a>
        ))}
      </nav>
    </>
  )
}

export function App() {
  const [sessie, zetSessie] = useState<Session | null | undefined>(gekoppeld() ? undefined : null)

  useEffect(() => {
    if (!gekoppeld()) return
    void db().auth.getSession().then(({ data }) => zetSessie(data.session))
    const { data } = db().auth.onAuthStateChange((_e, s) => zetSessie(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!gekoppeld()) return <NietGekoppeld />
  if (sessie === undefined) return null
  if (!sessie) return <Inloggen />
  return <Binnen sessie={sessie} />
}
