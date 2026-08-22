/**
 * DE STEM
 *
 * Uitspraak komt van het toestel zelf, met de eerste stem die Arabisch spreekt.
 * Heeft het toestel er geen, dan verdwijnen de luisterknoppen in plaats van dat
 * ze niets doen — een knop die zwijgt is erger dan geen knop. Datzelfde geldt
 * voor geluid dat in het ouderscherm is uitgezet: de oude app liet de knoppen
 * dan staan en liet `zeg()` er stilletjes uit lopen, wat op één na alle schermen
 * een dode knop opleverde. Hier zit die voorkeur in `beschikbaar`.
 *
 * De stemmenlijst komt op Chrome pas ná het eerste verzoek binnen, vandaar dat
 * `voiceschanged` er ook nog een keer naar kijkt.
 */
import { useEffect, useState } from 'react'

export interface Spraak {
  /** Heeft dit toestel een Arabische stem én staat geluid aan? */
  beschikbaar: boolean
  zeg: (tekst: string) => void
}

function zoekStem(): SpeechSynthesisVoice | null {
  try {
    return (speechSynthesis.getVoices() || []).find((v) => /^ar/i.test(v.lang)) ?? null
  } catch {
    return null
  }
}

/** Het tempo: langzamer dan spreektempo, want er wordt op meegelezen. */
const TEMPO = 0.82

export function useSpraak(geluidAan: boolean): Spraak {
  const [stem, zetStem] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const kijk = (): void => zetStem((oud) => oud ?? zoekStem())
    kijk()
    speechSynthesis.addEventListener('voiceschanged', kijk)
    return () => speechSynthesis.removeEventListener('voiceschanged', kijk)
  }, [])

  const beschikbaar = stem !== null && geluidAan
  return {
    beschikbaar,
    zeg: (tekst: string): void => {
      if (!stem || !geluidAan || !tekst) return
      try {
        speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(tekst)
        u.voice = stem
        u.lang = stem.lang
        u.rate = TEMPO
        speechSynthesis.speak(u)
      } catch { /* een geweigerde stem mag de oefening niet stilzetten */ }
    },
  }
}
