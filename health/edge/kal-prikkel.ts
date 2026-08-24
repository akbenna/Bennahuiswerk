// =============================================================================
// KALIBRATIE — de prikkel op de post.
//
// SQL bouwt de berichten en weet niets van HTTP; deze functie haalt ze op en
// verstuurt ze. De service-role-sleutel komt uit de eigen runtime en niet uit de
// vault: de vault-kopie in dit project matcht niet meer met wat de functies
// verwachten — een testverzending via send-email gaf 401 — en dat soort
// afhankelijkheid breekt stil bij elke sleutelrotatie.
//
// Aanroep gebeurt door pg_cron met een gedeeld geheim uit kal_config. Zonder dat
// geheim gebeurt er niets, ook al staat het endpoint open.
//
// -----------------------------------------------------------------------------
// WAT ERBIJ KWAM: DE COACH
// -----------------------------------------------------------------------------
// Er zijn nu twee soorten prikkels, en ze worden door verschillende functies
// gebouwd. `dagelijks` gaat over de weegreeks en komt uit kal_prikkel_bouwen.
// Alles wat met `coach-` begint gaat over de dag die loopt en komt uit
// kal_coach_bouwen; het achtervoegsel is het tijdvak ('coach-12'), zodat de
// ontdubbeling per dag én per moment werkt.
//
// Eén bericht kan om raad vragen. Vindt de coach in je eigen geschiedenis niets
// dat nog binnen je resterende ruimte past, dan zet hij `vraag_model` aan. Dán
// pas is een model aan zet, en niet eerder: wat je vorige week zelf at is een
// betere suggestie dan wat een taalmodel verzint, want je kent het en je hebt
// het in huis.
//
// De volgorde is OpenAI, dan Claude. Dat is een keuze van de eigenaar en geen
// technisch oordeel. Faalt er één, dan probeert de ander. Falen ze allebei, dan
// gaat het bericht zonder suggestie de deur uit — een prikkel zonder idee is nog
// steeds een prikkel, een uitgebleven prikkel is niets.
//
// Modelnamen staan in kal_config en niet hier, om dezelfde reden als in kal-ai:
// namen verlopen, en dan valt een functie stil zonder dat iemand het merkt. Eén
// regel in de database wisselt hem. Staat er geen `model_coach_openai`, dan
// wordt OpenAI overgeslagen — er wordt hier geen modelnaam geraden die niemand
// heeft nagekeken.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND = "https://api.resend.com/emails";
const VAN = "ProVita Care <info@provita-care.nl>";

/** Wat het model mag doen, en vooral wat niet. */
const OPDRACHT = `Je helpt iemand die zijn voeding bijhoudt in een app die één regel volgt:
geen enkel getal zonder zijn onzekerheid. Je krijgt wat er vandaag nog aan energie en
eiwit over is, en het feit dat er in zijn eigen geschiedenis niets meer past.

Noem één concreet idee dat binnen de resterende ruimte past en de eiwiteis haalt.
Schrijf in het Nederlands, hooguit veertig woorden, in de je-vorm, zonder uitroeptekens
en zonder aanmoediging. Noem hoeveelheden in grammen of gewone huishoudmaten.

Geef geen exacte kcal- of eiwitwaarden voor je idee: die worden hier uit de
voedingsmiddelentabel gehaald zodra het gelogd wordt, en een getal uit jouw geheugen
zou daarmee botsen. Beschrijf het gerecht en de portie, meer niet.`;

Deno.serve(async (req) => {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const soort: string = body.soort ?? "dagelijks";

    const { data: rij } = await db.from("kal_config").select("waarde")
      .eq("sleutel", "prikkel_geheim").maybeSingle();
    const geheim = rij?.waarde as string | undefined;
    if (!geheim || body.geheim !== geheim) {
      return json({ error: "Geen toegang" }, 401);
    }

    /* Een proefstand voor de modellaag. Zonder dit is de eerste echte toets pas
       op de dag dat er toevallig niets meer in je geschiedenis past — dat kan
       weken duren, en dan blijkt de sleutel verkeerd te staan. Deze weg stuurt
       niets, schrijft niets en zegt per aanbieder wat er gebeurde. */
    if (body.proef_model === true) {
      const stand = { kcal_over: 600, eiwit_over: 45, eis_per_100: 7.5 };
      const v = vraag(stand);
      const uitleg: Uitleg = {};
      const [open, claudeUit] = [await viaOpenAI(db, v, uitleg), await viaClaude(db, v)];
      return json({
        vraag: v,
        openai: {
          sleutel_aanwezig: !!Deno.env.get("OPENAI_API_KEY"),
          model: await modelNaam(db, "model_coach_openai"),
          antwoord: open,
          waarom_niet: open ? null : uitleg,
        },
        claude: {
          sleutel_aanwezig: !!Deno.env.get("ANTHROPIC_API_KEY"),
          model: (await modelNaam(db, "model_coach")) ?? (await modelNaam(db, "model_herkenning")),
          antwoord: claudeUit,
        },
        wie_wint: open ? "openai" : claudeUit ? "claude" : "geen van beide",
      });
    }

    const sleutel = Deno.env.get("RESEND_API_KEY");
    if (!sleutel) return json({ error: "RESEND_API_KEY ontbreekt" }, 503);

    // De soort kiest de bouwer. Eén plek, zodat een nieuwe soort niet op drie
    // plaatsen hoeft te worden aangemeld.
    const bouwer = soort.startsWith("coach") ? "kal_coach_bouwen" : "kal_prikkel_bouwen";
    const { data: berichten, error } = await db.rpc(bouwer, { p_soort: soort });
    if (error) throw new Error(error.message);

    const lijst = (berichten ?? []) as Array<Record<string, unknown>>;
    let verstuurd = 0;
    let gevraagd = 0;
    const fouten: string[] = [];

    for (const b of lijst) {
      const onderwerp = String(b.subject ?? "");
      try {
        let html = String(b.html ?? "");
        let tekst = String(b.tekst ?? "");

        if (b.vraag_model === true) {
          const idee = await vraagModel(db, b.stand as Record<string, unknown>);
          if (idee) {
            gevraagd++;
            tekst += `\n\nIdee: ${idee}`;
            html = html.replace(
              "</div>",
              `<p style="margin:0 0 14px;font-size:14px"><b>Idee.</b> ${escape(idee)}</p>` +
              `<p style="margin:0 0 14px;font-size:12px;color:#8A968F">` +
              `Dit staat niet in je geschiedenis; het is een voorstel van een taalmodel. ` +
              `De voedingswaarden komen pas uit de tabel als je het logt.</p></div>`,
            );
          }
        }

        const r = await fetch(RESEND, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sleutel}` },
          body: JSON.stringify({
            from: VAN, to: [b.to], subject: onderwerp, html, text: tekst,
          }),
        });
        if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 160)}`);
        await db.rpc("kal_prikkel_gelogd", {
          p_gebruiker: b.gebruiker_id, p_soort: soort, p_onderwerp: onderwerp,
          p_gelukt: true, p_fout: null,
        });
        verstuurd++;
      } catch (e) {
        const fout = e instanceof Error ? e.message : String(e);
        fouten.push(fout);
        // Ook een mislukking wordt gelogd, anders probeert de volgende run het
        // dezelfde dag opnieuw en staat er twee keer hetzelfde in de bus.
        await db.rpc("kal_prikkel_gelogd", {
          p_gebruiker: b.gebruiker_id, p_soort: soort, p_onderwerp: onderwerp,
          p_gelukt: false, p_fout: fout,
        });
      }
    }

    return json({ soort, gebouwd: lijst.length, verstuurd, gevraagd, fouten });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

/* -------------------------------------------------------------------------- */
/*  Het model, alleen als de geschiedenis niets had                           */
/* -------------------------------------------------------------------------- */

function vraag(stand: Record<string, unknown>): string {
  return [
    `Nog over vandaag: ${stand.kcal_over} kcal.`,
    `Nog nodig: ${stand.eiwit_over} gram eiwit.`,
    stand.eis_per_100
      ? `Dat vraagt ${stand.eis_per_100} gram eiwit per 100 kcal.`
      : "Het eiwit is al binnen.",
    "In zijn eigen geschiedenis past niets meer binnen die ruimte.",
  ].join(" ");
}

async function vraagModel(
  db: ReturnType<typeof createClient>,
  stand: Record<string, unknown>,
): Promise<string | null> {
  const v = vraag(stand);
  return (await viaOpenAI(db, v)) ?? (await viaClaude(db, v));
}

/** Een naam uit kal_config, of niets. Raden doen we hier niet. */
async function modelNaam(
  db: ReturnType<typeof createClient>,
  sleutel: string,
): Promise<string | null> {
  const { data } = await db.from("kal_config").select("waarde").eq("sleutel", sleutel).maybeSingle();
  const naam = (data?.waarde as string | undefined)?.trim();
  return naam ? naam : null;
}

/* De uitleg is er alleen voor de proefstand. In het echte pad wordt een fout
   stil opgevangen en valt hij terug op Claude — dat is daar juist, want een
   uitgebleven prikkel is erger dan een prikkel zonder idee. Maar bij het
   instellen wil je weten wát er misging: een verkeerde modelnaam en een
   verlopen sleutel geven allebei "geen antwoord", en dat zijn heel verschillende
   dingen om op te lossen. */
interface Uitleg {
  reden?: string; status?: number; antwoord?: string
  klaar_omdat?: string; verbruik?: unknown
}

async function viaOpenAI(
  db: ReturnType<typeof createClient>,
  v: string,
  uitleg?: Uitleg,
): Promise<string | null> {
  const sleutel = Deno.env.get("OPENAI_API_KEY");
  const model = await modelNaam(db, "model_coach_openai");
  if (!sleutel) { if (uitleg) uitleg.reden = "geen OPENAI_API_KEY in de secrets"; return null; }
  if (!model) { if (uitleg) uitleg.reden = "geen model_coach_openai in kal_config"; return null; }
  try {
    /* Chat Completions en niet de nieuwere Responses-vorm: deze weg werkt op
       elke sleutel en elk model, en er is hier geen manier om een aanroep te
       proberen — het netwerk van de ontwikkelomgeving laat deze host niet door. */
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sleutel}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: OPDRACHT },
          { role: "user", content: v },
        ],
        /* Ruim, en dat is geen slordigheid. Een redeneermodel rekent eerst en
           schrijft daarna, en beide komen uit ditzelfde budget. Op 300 kwam er
           een keurige 200 terug met een leeg antwoord: alles was opgegaan aan
           denken, en `finish_reason` stond op length. Veertig woorden kosten
           er hooguit honderd; de rest is ruimte om te mogen nadenken. */
        max_completion_tokens: 2000,
      }),
    });
    if (!r.ok) {
      if (uitleg) {
        uitleg.status = r.status;
        uitleg.antwoord = (await r.text()).slice(0, 300);
        uitleg.reden = "OpenAI weigerde het verzoek";
      }
      return null;
    }
    const d = await r.json();
    const tekst = schoon(d.choices?.[0]?.message?.content);
    if (!tekst && uitleg) {
      uitleg.reden = "OpenAI antwoordde, maar zonder tekst";
      uitleg.klaar_omdat = d.choices?.[0]?.finish_reason;
      uitleg.verbruik = d.usage;
    }
    return tekst;
  } catch (e) {
    if (uitleg) uitleg.reden = "netwerkfout: " + (e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function viaClaude(
  db: ReturnType<typeof createClient>,
  v: string,
): Promise<string | null> {
  const sleutel = Deno.env.get("ANTHROPIC_API_KEY");
  if (!sleutel) return null;
  /* Dezelfde vorm als kal-ai, die tegen deze sleutel bewezen draait. */
  const model = (await modelNaam(db, "model_coach")) ??
                (await modelNaam(db, "model_herkenning"));
  if (!model) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": sleutel,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system: OPDRACHT,
        messages: [{ role: "user", content: v }],
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const blok = (d.content ?? []).find((c: { type: string }) => c.type === "text");
    return schoon(blok?.text);
  } catch {
    return null;
  }
}

/** Eén alinea, geen aanhalingstekens eromheen, en niet eindeloos. */
function schoon(t: string | undefined): string | null {
  if (!t) return null;
  const s = t.trim().replace(/^["'«»]+|["'«»]+$/g, "").replace(/\s+/g, " ");
  return s.length > 0 ? s.slice(0, 400) : null;
}

/** De tekst komt van een model en gaat in html. Dus ontsnappen. */
function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
