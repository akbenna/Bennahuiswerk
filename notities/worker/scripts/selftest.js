// Test de lokale onderdelen (ffmpeg, opdelen, transcriptopmaak, schema, adressen) zonder API's.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import { makeTmp, cleanTmp, normalizeAndSplit, durationSec } from '../src/audio.js';
import { formatTranscript } from '../src/transcribe.js';
import { buildSchema } from '../src/structure.js';
import { cfg, appOrigin, appLink } from '../src/config.js';

const dir = await makeTmp();
try {
  const src = path.join(dir, 'test.webm');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=730',
    '-c:a', 'libopus', '-b:a', '24k', src]);
  const { blocks, totaal } = await normalizeAndSplit(src, dir);
  assert.equal(blocks.length, 3, 'verwacht 3 blokken van max 5 min');
  assert.ok(Math.abs(totaal - 730) < 3, `totale duur ${totaal}`);
  assert.ok(Math.abs(blocks[2].offset - 600) < 3, 'offset derde blok');
  assert.ok((await durationSec(blocks[0].file)) > 295);
  console.log('✓ ffmpeg normaliseren en opdelen', blocks.map((b) => Math.round(b.duur)));

  const t = formatTranscript([
    { spreker: 'Abdelkader', start_s: 0, eind_s: 3, tekst: 'Goedemorgen.' },
    { spreker: 'Abdelkader', start_s: 3.5, eind_s: 6, tekst: 'Zullen we beginnen?' },
    { spreker: 'Spreker 1A', start_s: 6.2, eind_s: 9, tekst: 'Prima.' },
    { spreker: 'Spreker 1A', start_s: 70, eind_s: 72, tekst: 'Nog één punt.' },
  ]);
  assert.equal(t.split('\n').length, 3);
  assert.ok(t.startsWith('[0:00] Abdelkader: Goedemorgen. Zullen we beginnen?'));
  assert.ok(t.includes('[1:10] Spreker 1A: Nog één punt.'));
  console.log('✓ transcriptopmaak');

  const s = buildSchema(['ASF Limburg', 'Overig']);
  const strict = (o) => o.type !== 'object' || (o.additionalProperties === false &&
    Object.keys(o.properties).every((k) => o.required.includes(k)) && Object.values(o.properties).every((p) => strict(p.items || p)));
  assert.ok(strict(s), 'schema voldoet aan strict json_schema');
  console.log('✓ schema geschikt voor strict structured outputs');

  // De app woont op /notities/ van de hub. Een link zonder dat pad opent de
  // startpagina; een CORS-kop mét pad laat geen enkele browser door.
  cfg.appUrl = 'https://hub.example.nl/notities';
  assert.equal(appOrigin(), 'https://hub.example.nl');
  assert.equal(appLink('#/notitie/x'), 'https://hub.example.nl/notities/#/notitie/x');
  console.log('✓ applink met pad, CORS op de oorsprong');
} finally {
  await cleanTmp(dir);
}
