/**
 * DE UITSLAG VAN EEN AANMELDING
 *
 * `kal_aanmelden` gooit sinds bestand 32 geen exception meer bij een mislukking
 * maar geeft `{fout}` terug. De reden staat daar: de functie houdt een teller
 * bij van mislukte pogingen, en een exception draait de transactie terug —
 * inclusief die teller. De rem zou nooit grijpen.
 *
 * Dat verplaatst een risico naar deze kant. Een mislukte aanmelding komt nu
 * binnen met een 200 en zonder token. Wie daar niet op let, bewaart een lege
 * sessie in localStorage en de app denkt dat je binnen bent — een scherm vol
 * nullen zonder uitleg, en geen weg terug behalve je opslag wissen.
 *
 * `isSessie` is de enige plek waar dat onderscheid wordt gemaakt, en deze proef
 * gaat over precies de vormen die er werkelijk uit kunnen komen.
 */
import { describe, expect, it } from 'vitest'
import { isSessie } from './db/rpc'
import type { Aanmelduitslag } from './db/rpc'

describe('isSessie', () => {
  it('herkent een echte sessie', () => {
    expect(isSessie({ token: 'a3f19c7e', account: 'abdelkader' })).toBe(true)
  })

  it('herkent de twee foutantwoorden die de functie kan geven', () => {
    expect(isSessie({ fout: 'Onbekend account of verkeerd wachtwoord' })).toBe(false)
    expect(isSessie({
      fout: 'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.',
    })).toBe(false)
  })

  /* DE VORM DIE ALLES STUKMAAKT
     Een leeg token is geen token. Zonder deze regel zou `{token: ''}` als een
     geslaagde aanmelding tellen — en dat is precies wat er overblijft als er
     ooit iets misgaat in de functie of onderweg. */
  it('rekent een leeg token niet als aangemeld', () => {
    expect(isSessie({ token: '', account: 'abdelkader' } as Aanmelduitslag)).toBe(false)
  })

  it('rekent een ontbrekend of verkeerd getypt token niet als aangemeld', () => {
    expect(isSessie({} as Aanmelduitslag)).toBe(false)
    expect(isSessie({ account: 'abdelkader' } as unknown as Aanmelduitslag)).toBe(false)
    expect(isSessie({ token: 42 } as unknown as Aanmelduitslag)).toBe(false)
    expect(isSessie({ token: null } as unknown as Aanmelduitslag)).toBe(false)
  })
})
