import { readFile } from 'node:fs/promises';
import { cfg, log } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const retryable = (status) => status === 429 || status >= 500;

async function postForm(url, headers, form, label) {
  for (let poging = 1; poging <= 3; poging++) {
    const res = await fetch(url, { method: 'POST', headers, body: form() });
    if (res.ok) return res.json();
    const body = await res.text();
    if (!retryable(res.status) || poging === 3) throw new Error(`${label} ${res.status}: ${body.slice(0, 400)}`);
    log(`${label} ${res.status}, nieuwe poging ${poging + 1}`);
    await sleep(2000 * poging ** 2);
  }
}

async function openaiTranscribe(file, { mijnNaam, stemRef }) {
  const buf = await readFile(file);
  const diarize = cfg.openaiTranscribeModel.includes('diarize');
  const form = () => {
    const f = new FormData();
    f.append('file', new Blob([buf], { type: 'audio/mpeg' }), 'blok.mp3');
    f.append('model', cfg.openaiTranscribeModel);
    if (diarize) {
      f.append('response_format', 'diarized_json');
      f.append('chunking_strategy', 'auto');
      if (stemRef) {
        f.append('known_speaker_names[]', mijnNaam);
        f.append('known_speaker_references[]', stemRef);
      }
    } else {
      f.append('response_format', 'json');
      f.append('language', 'nl');
    }
    return f;
  };
  const data = await postForm(`${cfg.openaiBase}/audio/transcriptions`,
    { Authorization: `Bearer ${cfg.openaiKey}` }, form, 'OpenAI-transcriptie');
  if (diarize && Array.isArray(data.segments)) {
    return data.segments.map((s) => ({ spreker: s.speaker ?? null, start: s.start ?? 0, eind: s.end ?? 0, tekst: (s.text || '').trim() }));
  }
  return [{ spreker: null, start: 0, eind: null, tekst: (data.text || '').trim() }];
}

async function mistralTranscribe(file) {
  const buf = await readFile(file);
  const form = () => {
    const f = new FormData();
    f.append('file', new Blob([buf], { type: 'audio/mpeg' }), 'blok.mp3');
    f.append('model', cfg.mistralTranscribeModel);
    f.append('timestamp_granularities', 'segment');
    return f;
  };
  const data = await postForm('https://api.mistral.ai/v1/audio/transcriptions',
    { Authorization: `Bearer ${cfg.mistralKey}` }, form, 'Mistral-transcriptie');
  if (Array.isArray(data.segments) && data.segments.length) {
    return data.segments.map((s) => ({ spreker: null, start: s.start ?? 0, eind: s.end ?? 0, tekst: (s.text || '').trim() }));
  }
  return [{ spreker: null, start: 0, eind: null, tekst: (data.text || '').trim() }];
}

/**
 * Transcribeer één blok. Geeft { segmenten, provider } met tijden relatief aan het hele gesprek.
 * Sprekerlabels anders dan mijnNaam (A, B, ...) worden per blok opnieuw toegekend; we prefixen ze
 * met het bloknummer zodat het taalmodel weet dat 'B' in blok 1 niet per se 'B' in blok 2 is.
 */
export async function transcribeBlock(block, index, opts) {
  let segs, provider;
  if (cfg.openaiKey) {
    try {
      segs = await openaiTranscribe(block.file, opts);
      provider = `openai:${cfg.openaiTranscribeModel}`;
    } catch (e) {
      log(`OpenAI-transcriptie faalde voor blok ${index + 1}: ${e.message}`);
      if (!cfg.mistralKey) throw e;
    }
  }
  if (!segs) {
    segs = await mistralTranscribe(block.file);
    provider = `mistral:${cfg.mistralTranscribeModel}`;
  }
  const segmenten = segs.filter((s) => s.tekst).map((s) => ({
    spreker: !s.spreker ? null : s.spreker === opts.mijnNaam ? opts.mijnNaam : `Spreker ${index + 1}${s.spreker}`,
    start_s: block.offset + (s.start || 0),
    eind_s: block.offset + (s.eind ?? block.duur),
    tekst: s.tekst,
  }));
  return { segmenten, provider };
}

const mmss = (s) => {
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(sec).padStart(2, '0')}`;
};

/** Leesbaar transcript; opeenvolgende segmenten van dezelfde spreker worden samengevoegd. */
export function formatTranscript(segmenten) {
  const regels = [];
  let huidig = null;
  for (const s of segmenten) {
    if (huidig && huidig.spreker === s.spreker && s.start_s - huidig.eind_s < 4) {
      huidig.tekst += ' ' + s.tekst;
      huidig.eind_s = s.eind_s;
    } else {
      if (huidig) regels.push(huidig);
      huidig = { ...s };
    }
  }
  if (huidig) regels.push(huidig);
  return regels.map((r) => `[${mmss(r.start_s)}]${r.spreker ? ` ${r.spreker}:` : ''} ${r.tekst}`).join('\n');
}
