import { cfg, log } from './config.js';

const strArr = { type: 'array', items: { type: 'string' } };

export function buildSchema(contextNamen) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['titel', 'context', 'samenvatting', 'deelnemers', 'besluiten', 'actiepunten', 'open_vragen', 'mijn_vervolgstappen'],
    properties: {
      titel: { type: 'string', description: 'Korte, specifieke titel (max 8 woorden), zonder datum' },
      context: { type: 'string', enum: contextNamen },
      samenvatting: { type: 'string', description: 'Verhalende samenvatting in lopende tekst, 1–4 alinea\'s, gescheiden door een lege regel' },
      deelnemers: { ...strArr, description: 'Namen of rollen van aanwezigen voor zover herkenbaar' },
      besluiten: { ...strArr, description: 'Genomen besluiten, elk als volledige zin' },
      actiepunten: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['wie', 'wat', 'deadline', 'van_mij'],
          properties: {
            wie: { type: 'string', description: 'Naam of rol; "onbekend" als niet gezegd' },
            wat: { type: 'string' },
            deadline: { type: 'string', description: 'YYYY-MM-DD als genoemd of eenduidig af te leiden, anders lege string' },
            van_mij: { type: 'boolean', description: 'true als Abdelkader dit zelf moet doen' },
          },
        },
      },
      open_vragen: { ...strArr, description: 'Onbeantwoorde vragen of onduidelijkheden' },
      mijn_vervolgstappen: { ...strArr, description: 'Wat Abdelkader vóór het volgende contact moet voorbereiden of beslissen' },
    },
  };
}

function systemPrompt({ mijnNaam, contexten, datum }) {
  const ctx = contexten.map((c) => `- ${c.naam}: ${c.instructie || '(geen bijzondere instructie)'}`).join('\n');
  return `Je bent de notulist van dr. ${mijnNaam} Bennaghmouch: huisarts en praktijkhouder (Het Roosendael, Roermond), kaderarts CVRM bij Meditta, voorzitter van Stichting Achterstandsfonds Limburg, en ondernemer.
Je maakt van een transcript een betrouwbare notitie in het Nederlands.

Regels:
- Gebruik uitsluitend wat in het transcript staat. Verzin geen namen, bedragen, data of besluiten. Is iets onverstaanbaar of dubbelzinnig, zeg dat dan en zet het bij open vragen.
- Schrijf de samenvatting als heldere, verhalende lopende tekst: wat speelde er, welke afwegingen kwamen langs, waar kwam men uit. Geen opsomming in de samenvatting.
- Een besluit is alleen een besluit als het zo is uitgesproken; voorstellen en meningen zijn geen besluiten.
- Spreker "${mijnNaam}" is altijd dr. Bennaghmouch zelf. Andere labels ("Spreker 2B") worden per blok van enkele minuten opnieuw toegekend door de spraakherkenning; hetzelfde label in een ander blok kan een andere persoon zijn. Leid namen af uit aanspreekvormen in het gesprek waar dat kan.
- Deadlines: de opname is van ${datum}. Reken relatieve termen ("volgende week vrijdag") om naar een datum alleen als dat eenduidig is.
- Kies de context die het best past:
${ctx}`;
}

function userPrompt({ transcript, agendaTitel, deelnemers, contextHint, bestandsnaam }) {
  const meta = [
    agendaTitel && `Agenda-afspraak: ${agendaTitel}`,
    deelnemers?.length && `Uitgenodigd: ${deelnemers.join(', ')}`,
    contextHint && `Waarschijnlijke context: ${contextHint}`,
    bestandsnaam && `Bestandsnaam: ${bestandsnaam}`,
  ].filter(Boolean).join('\n');
  return `${meta ? meta + '\n\n' : ''}Transcript:\n${transcript}`;
}

function extractResponsesText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const c of item.content || []) {
        if (c.type === 'output_text') return c.text;
        if (c.type === 'refusal') throw new Error(`Model weigerde: ${c.refusal}`);
      }
    }
  }
  throw new Error('Geen tekst in OpenAI-antwoord');
}

async function viaOpenAI(sys, user, schema) {
  const res = await fetch(`${cfg.openaiBase}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.openaiTextModel,
      input: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      text: { format: { type: 'json_schema', name: 'notitie', schema, strict: true } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI-samenvatting ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return JSON.parse(extractResponsesText(await res.json()));
}

async function viaClaude(sys, user, schema) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': cfg.anthropicKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.anthropicModel,
      max_tokens: 8000,
      system: sys,
      messages: [{ role: 'user', content: user }],
      tools: [{ name: 'notitie', description: 'Sla de gestructureerde notitie op', input_schema: schema }],
      tool_choice: { type: 'tool', name: 'notitie' },
    }),
  });
  if (!res.ok) throw new Error(`Claude-samenvatting ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const tool = (data.content || []).find((c) => c.type === 'tool_use');
  if (!tool) throw new Error('Geen gestructureerde uitvoer van Claude');
  return tool.input;
}

export async function structure(input) {
  const schema = buildSchema(input.contexten.map((c) => c.naam));
  const sys = systemPrompt(input);
  const user = userPrompt(input);
  if (cfg.openaiKey) {
    try {
      return { resultaat: await viaOpenAI(sys, user, schema), provider: `openai:${cfg.openaiTextModel}` };
    } catch (e) {
      log(`OpenAI-samenvatting faalde: ${e.message}`);
      if (!cfg.anthropicKey) throw e;
    }
  }
  return { resultaat: await viaClaude(sys, user, schema), provider: `anthropic:${cfg.anthropicModel}` };
}

export async function embed(text) {
  if (!cfg.openaiKey) return null;
  try {
    const res = await fetch(`${cfg.openaiBase}/embeddings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.openaiEmbedModel, input: text.slice(0, 24000) }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).data[0].embedding;
  } catch (e) {
    log(`Embedding mislukt (zoeken werkt dan alleen op tekst): ${e.message}`);
    return null;
  }
}
