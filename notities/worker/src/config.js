import { createClient } from '@supabase/supabase-js';

const env = (k, d) => {
  const v = process.env[k];
  return v === undefined || v === '' ? d : v;
};

export const cfg = {
  supabaseUrl: env('SUPABASE_URL'),
  supabaseKey: env('SUPABASE_SERVICE_ROLE_KEY'),
  ownerId: env('OWNER_ID'),

  openaiKey: env('OPENAI_API_KEY'),
  openaiBase: env('OPENAI_BASE_URL', 'https://eu.api.openai.com/v1').replace(/\/$/, ''),
  openaiTranscribeModel: env('OPENAI_TRANSCRIBE_MODEL', 'gpt-4o-transcribe-diarize'),
  openaiTextModel: env('OPENAI_TEXT_MODEL', 'gpt-5-mini'),
  openaiEmbedModel: env('OPENAI_EMBED_MODEL', 'text-embedding-3-small'),

  mistralKey: env('MISTRAL_API_KEY'),
  mistralTranscribeModel: env('MISTRAL_TRANSCRIBE_MODEL', 'voxtral-mini-latest'),

  anthropicKey: env('ANTHROPIC_API_KEY'),
  anthropicModel: env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'),

  googleClientId: env('GOOGLE_CLIENT_ID'),
  googleClientSecret: env('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: env('GOOGLE_REFRESH_TOKEN'),
  calendarId: env('GOOGLE_CALENDAR_ID', 'primary'),

  telegramToken: env('TELEGRAM_BOT_TOKEN'),
  telegramChat: env('TELEGRAM_CHAT_ID'),

  appUrl: env('APP_URL', ''),
  segmentSec: Number(env('SEGMENT_SEC', 300)),
  pollSec: Number(env('POLL_SEC', 15)),
  drivePollSec: Number(env('DRIVE_POLL_SEC', 300)),
  port: Number(env('PORT', 8080)),
};

/**
 * APP_URL is het adres van de app zelf, dus met het pad erbij
 * (https://<hub>/notities/). Voor CORS telt alleen de oorsprong, zonder pad:
 * een browser stuurt nooit meer dan dat in zijn Origin-kop.
 */
export const appOrigin = () => {
  try { return cfg.appUrl ? new URL(cfg.appUrl).origin : ''; } catch { return ''; }
};
export const appLink = (hash) => (cfg.appUrl ? cfg.appUrl.replace(/\/?$/, '/') + hash : '');

export const googleEnabled = () => Boolean(cfg.googleClientId && cfg.googleClientSecret && cfg.googleRefreshToken);

export function assertConfig() {
  const missing = ['supabaseUrl', 'supabaseKey', 'ownerId'].filter((k) => !cfg[k]);
  if (missing.length) throw new Error(`Ontbrekende configuratie: ${missing.join(', ')}`);
  if (!cfg.openaiKey && !cfg.mistralKey) throw new Error('Geen transcriptiedienst: zet OPENAI_API_KEY en/of MISTRAL_API_KEY');
  if (!cfg.openaiKey && !cfg.anthropicKey) throw new Error('Geen taalmodel: zet OPENAI_API_KEY en/of ANTHROPIC_API_KEY');
}

let _db;
export const db = () => (_db ??= createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: false } }));

export const log = (...a) => console.log(new Date().toISOString(), ...a);
