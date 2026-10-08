// Eenmalig lokaal draaien:  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run google-auth
// Opent een inloglink; na toestemming print het script de GOOGLE_REFRESH_TOKEN voor de worker.
import http from 'node:http';

const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;
if (!id || !secret) { console.error('Zet GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET'); process.exit(1); }

const PORT = 53682;
const redirect = `http://127.0.0.1:${PORT}/callback`;
const scopes = [
  'https://www.googleapis.com/auth/drive',              // mappen/Docs maken en de _inbox lezen
  'https://www.googleapis.com/auth/calendar.readonly',  // lopende afspraak bij een opname
];
const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: id, redirect_uri: redirect, response_type: 'code',
  scope: scopes.join(' '), access_type: 'offline', prompt: 'consent',
});

http.createServer(async (req, res) => {
  const u = new URL(req.url, redirect);
  if (u.pathname !== '/callback') return res.end();
  const code = u.searchParams.get('code');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: 'authorization_code' }),
  });
  const d = await r.json();
  res.end(d.refresh_token ? 'Gelukt. Je kunt dit venster sluiten.' : 'Mislukt, zie terminal.');
  console.log(d.refresh_token ? `\nGOOGLE_REFRESH_TOKEN=${d.refresh_token}\n` : d);
  process.exit(0);
}).listen(PORT, () => console.log(`Open deze link en log in met je Google-account:\n\n${url}\n`));
