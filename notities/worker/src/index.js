import http from 'node:http';
import { cfg, db, log, assertConfig, googleEnabled, appOrigin } from './config.js';
import { claimNext, processNote, failNote, pollDriveInbox, housekeeping } from './pipeline.js';
import { embed } from './structure.js';

assertConfig();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const status = { gestart: new Date().toISOString(), laatsteRun: null, bezig: null, verwerkt: 0, fouten: 0 };

async function werkLus() {
  for (;;) {
    try {
      const note = await claimNext();
      if (!note) { await sleep(cfg.pollSec * 1000); continue; }
      status.bezig = note.id;
      try {
        await processNote(note);
        status.verwerkt++;
      } catch (e) {
        status.fouten++;
        await failNote(note, e);
      } finally {
        status.bezig = null;
        status.laatsteRun = new Date().toISOString();
      }
    } catch (e) {
      log(`Lusfout: ${e.message}`);
      await sleep(cfg.pollSec * 1000);
    }
  }
}

function periodiek(naam, fn, sec) {
  const tik = async () => {
    try { await fn(); } catch (e) { log(`${naam} faalde: ${e.message}`); }
    setTimeout(tik, sec * 1000);
  };
  setTimeout(tik, 5000);
}

// Kleine HTTP-server: /health voor Railway, /embed zodat de app semantisch kan zoeken
// zonder dat de OpenAI-sleutel in de browser komt.
const cors = {
  'Access-Control-Allow-Origin': appOrigin() || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') return send(204, {});
  if (req.url === '/health') return send(200, { ok: true, google: googleEnabled(), ...status });
  if (req.url === '/embed' && req.method === 'POST') {
    // Alles binnen try: een afgewezen promise in deze handler is onafgevangen,
    // en daar stopt Node 22 het hele proces op, werklus en al.
    try {
      const jwt = (req.headers.authorization || '').replace(/^Bearer /, '');
      const { data: u } = await db().auth.getUser(jwt);
      if (!u?.user || u.user.id !== cfg.ownerId) return send(401, { fout: 'niet ingelogd' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 20_000) return send(413, { fout: 'te groot' });
      }
      let tekst = '';
      try { tekst = String(JSON.parse(body || '{}').tekst || '').slice(0, 2000); } catch { return send(400, { fout: 'geen geldige JSON' }); }
      if (!tekst) return send(400, { fout: 'lege zoekvraag' });
      const vector = await embed(tekst);
      return vector ? send(200, { vector }) : send(503, { fout: 'embedding niet beschikbaar' });
    } catch (e) {
      log(`/embed faalde: ${e.message}`);
      return send(500, { fout: 'interne fout' });
    }
  }
  send(404, { fout: 'onbekend' });
}).listen(cfg.port, () => log(`Worker luistert op :${cfg.port} (Google ${googleEnabled() ? 'aan' : 'uit'})`));

periodiek('Drive-inbox', pollDriveInbox, cfg.drivePollSec);
periodiek('Opruimen', housekeeping, 3600);
werkLus();
