import { cfg } from './config.js';

const FOLDER = 'application/vnd.google-apps.folder';
let token = null, tokenExp = 0;

async function accessToken() {
  if (token && Date.now() < tokenExp - 60_000) return token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      refresh_token: cfg.googleRefreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google-token ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const d = await res.json();
  token = d.access_token;
  tokenExp = Date.now() + d.expires_in * 1000;
  return token;
}

async function g(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${await accessToken()}`, ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`Google ${opts.method || 'GET'} ${url.split('?')[0]} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export async function ensureFolder(name, parentId = 'root') {
  const query = `name='${q(name)}' and mimeType='${FOLDER}' and '${parentId}' in parents and trashed=false`;
  const res = await g(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`);
  const { files } = await res.json();
  if (files?.length) return files[0].id;
  const created = await g('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER, parents: [parentId] }),
  });
  return (await created.json()).id;
}

/** Maakt een Google Doc door HTML te uploaden met conversie. */
export async function createDoc(title, html, parentId) {
  const boundary = 'notitie' + Math.random().toString(36).slice(2);
  const meta = { name: title, mimeType: 'application/vnd.google-apps.document', parents: [parentId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n--${boundary}--`;
  const res = await g('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return res.json();
}

export async function trashFile(id) {
  await g(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }),
  }).catch(() => {});
}

export async function listFolderFiles(folderId) {
  const query = `'${folderId}' in parents and trashed=false and mimeType!='${FOLDER}'`;
  const res = await g(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime)&orderBy=createdTime&pageSize=50`);
  return (await res.json()).files || [];
}

export async function downloadFile(id) {
  const res = await g(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return Buffer.from(await res.arrayBuffer());
}

export async function moveFile(id, toFolder, fromFolder) {
  await g(`https://www.googleapis.com/drive/v3/files/${id}?addParents=${toFolder}&removeParents=${fromFolder}&fields=id`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
}

/** Agenda-afspraak die loopt rond het starttijdstip (niet hele-dag). */
export async function eventAt(isoTime) {
  const t = new Date(isoTime).getTime();
  const params = new URLSearchParams({
    timeMin: new Date(t - 3 * 3600_000).toISOString(),
    timeMax: new Date(t + 30 * 60_000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20',
  });
  const res = await g(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events?${params}`);
  const items = ((await res.json()).items || []).filter((e) => e.start?.dateTime && e.status !== 'cancelled');
  const kandidaten = items
    .map((e) => ({ e, start: Date.parse(e.start.dateTime), eind: Date.parse(e.end.dateTime) }))
    .filter(({ start, eind }) => start - 15 * 60_000 <= t && t <= eind)
    .sort((a, b) => Math.abs(a.start - t) - Math.abs(b.start - t));
  if (!kandidaten.length) return null;
  const { e } = kandidaten[0];
  return {
    id: e.id,
    titel: e.summary || '',
    deelnemers: (e.attendees || []).filter((a) => !a.self && !a.resource).map((a) => a.displayName || a.email),
  };
}
