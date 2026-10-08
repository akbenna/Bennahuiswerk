import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readdir, readFile, rm, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cfg, db } from './config.js';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} faalde (${code}): ${err.slice(-800)}`))));
  });
}

export const makeTmp = () => mkdtemp(path.join(tmpdir(), 'notitie-'));
export const cleanTmp = (dir) => rm(dir, { recursive: true, force: true });

/** Alle audiobestanden van een notitie uit storage, op naam gesorteerd (chunk-00001, ... of upload.*). */
export async function listNoteAudio(ownerId, noteId) {
  const prefix = `${ownerId}/${noteId}`;
  const { data, error } = await db().storage.from('audio').list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;
  return (data || []).filter((f) => /^(chunk-\d+|upload)\./.test(f.name)).map((f) => `${prefix}/${f.name}`);
}

/**
 * Download en voeg samen. Chunks van één MediaRecorder-sessie vormen achter elkaar
 * geplakt weer één geldig bestand (webm of gefragmenteerde mp4).
 */
export async function downloadJoined(paths, dir) {
  if (!paths.length) throw new Error('Geen audio gevonden voor deze notitie');
  const ext = path.extname(paths[0]) || '.bin';
  const target = path.join(dir, `bron${ext}`);
  await writeFile(target, Buffer.alloc(0));
  for (const p of paths) {
    const { data, error } = await db().storage.from('audio').download(p);
    if (error) throw new Error(`Download ${p} mislukt: ${error.message}`);
    await appendFile(target, Buffer.from(await data.arrayBuffer()));
  }
  return target;
}

export async function durationSec(file) {
  const out = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  const d = parseFloat(out.trim());
  return Number.isFinite(d) ? d : null;
}

/** Naar mono 16 kHz mp3 (32 kbps) in blokken van SEGMENT_SEC; geeft [{file, offset}] terug. */
export async function normalizeAndSplit(input, dir) {
  const pattern = path.join(dir, 'blok-%03d.mp3');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-fflags', '+genpts', '-i', input,
    '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '32k',
    '-f', 'segment', '-segment_time', String(cfg.segmentSec), '-reset_timestamps', '1', pattern]);
  const files = (await readdir(dir)).filter((f) => f.startsWith('blok-')).sort();
  let offset = 0;
  const blocks = [];
  for (const f of files) {
    const file = path.join(dir, f);
    const d = (await durationSec(file)) ?? cfg.segmentSec;
    if (d >= 0.5) blocks.push({ file, offset, duur: d });
    offset += d;
  }
  return { blocks, totaal: offset };
}

/** Stemreferentie als data-URL (wav, max 10 s) voor sprekerherkenning. */
export async function voiceReferenceDataUrl(storagePath, dir) {
  if (!storagePath) return null;
  const { data, error } = await db().storage.from('audio').download(storagePath);
  if (error) return null;
  const src = path.join(dir, 'stem-bron');
  const out = path.join(dir, 'stem.wav');
  await writeFile(src, Buffer.from(await data.arrayBuffer()));
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', src, '-t', '9.5', '-ac', '1', '-ar', '16000', out]);
  return `data:audio/wav;base64,${(await readFile(out)).toString('base64')}`;
}

export async function deleteNoteAudio(ownerId, noteId) {
  const prefix = `${ownerId}/${noteId}`;
  const { data } = await db().storage.from('audio').list(prefix, { limit: 1000 });
  const paths = (data || []).map((f) => `${prefix}/${f.name}`);
  if (paths.length) {
    const { error } = await db().storage.from('audio').remove(paths);
    if (error) throw error;
  }
  return paths.length;
}
