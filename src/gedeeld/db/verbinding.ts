/**
 * DE VERBINDING
 *
 * Waarom de sleutel hieronder gewoon in de repo staat en niet in een geheim:
 * dit is de publieke anon-sleutel. Hij hoort in de browser terecht te komen en
 * geeft uit zichzelf geen toegang tot gegevens — geen enkele kal_- of
 * bennahub_-tabel is voor de rol `anon` benaderbaar. Alle toegang loopt via
 * SECURITY DEFINER-functies die zelf een sessietoken of een pincode eisen.
 *
 * Een omgevingsvariabele zou hier niets beveiligen en wel iets stukmaken: een
 * bouw zonder die variabele levert een app op die het stilzwijgend niet doet.
 * De service-rolsleutel is een heel ander verhaal en staat hier dus niet, en
 * hoort ook nooit in een browser.
 */
export const DATABASE_URL = 'https://jnlvvdaisyerhxucxnuu.supabase.co'

export const ANON_SLEUTEL =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubHZ2ZGFpc3llcmh4dWN4bnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDg0MjIsImV4cCI6MjA4MjQyNDQyMn0.8ZXa-N96pRSQovdL_bH5FpJTHeL454830h5LMapCawY'

/** Wat de server terugstuurt als het misgaat, in de vorm die PostgREST kiest. */
interface Serverfout {
  message?: string
  error?: string
  hint?: string | null
}

/**
 * Een fout die uit de database komt in plaats van uit de app. Los type, zodat
 * een scherm het verschil kan tonen tussen "de verbinding viel weg" en "dit
 * gerecht bestaat niet".
 */
export class DatabaseFout extends Error {
  constructor(
    override readonly message: string,
    readonly status: number,
    readonly functie: string,
  ) {
    super(message)
    this.name = 'DatabaseFout'
  }
}

/**
 * Eén plek waar een verzoek de deur uit gaat. Alles wat hierboven zit is
 * getypt; alles wat hieronder zit is netwerk. Die grens hoort scherp te zijn.
 */
export async function verzoek(pad: string, lichaam: unknown): Promise<unknown> {
  let antwoord: Response
  try {
    antwoord = await fetch(DATABASE_URL + pad, {
      method: 'POST',
      headers: {
        apikey: ANON_SLEUTEL,
        Authorization: 'Bearer ' + ANON_SLEUTEL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lichaam ?? {}),
    })
  } catch {
    // Een netwerkfout is geen serverfout: de badkamer heeft geen bereik.
    throw new DatabaseFout('Geen verbinding. Probeer het zo nog eens.', 0, pad)
  }

  let uit: unknown = null
  try {
    uit = await antwoord.json()
  } catch {
    /* leeg antwoord is toegestaan bij functies die niets teruggeven */
  }

  if (!antwoord.ok) {
    const f = uit as Serverfout | null
    throw new DatabaseFout(
      f?.message ?? f?.error ?? `Verbinding mislukt (${antwoord.status})`,
      antwoord.status,
      pad,
    )
  }
  return uit
}
