import path from 'node:path';
import { cfg, db, log, googleEnabled, appLink } from './config.js';
import { listNoteAudio, downloadJoined, normalizeAndSplit, voiceReferenceDataUrl, makeTmp, cleanTmp, deleteNoteAudio } from './audio.js';
import { transcribeBlock, formatTranscript } from './transcribe.js';
import { structure, embed } from './structure.js';
import { ensureFolder, createDoc, trashFile, eventAt, listFolderFiles, downloadFile, moveFile } from './google.js';
import { notify } from './notify.js';

const AUDIO_EXT = /\.(m4a|mp3|wav|webm|ogg|oga|opus|mp4|aac|flac|caf|amr|3gp)$/i;

async function settingsFor(ownerId) {
  const { data } = await db().from('settings').select('*').eq('owner_id', ownerId).maybeSingle();
  return data || { owner_id: ownerId, mijn_naam: 'Abdelkader', bewaartermijn_audio_dagen: 30 };
}

async function contextsFor(ownerId) {
  const { data, error } = await db().from('contexts').select('*').eq('owner_id', ownerId).order('volgorde');
  if (error) throw error;
  if (!data?.length) throw new Error('Geen contexten: draai eerst maak_standaard_aan(<user id>) in de SQL-editor');
  return data;
}

async function update(id, fields) {
  const { error } = await db().from('notes').update(fields).eq('id', id);
  if (error) throw error;
}

function matchContext(contexten, ...teksten) {
  const hay = teksten.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return null;
  return contexten.find((c) => (c.agenda_trefwoorden || []).some((w) => hay.includes(w.toLowerCase()))) || null;
}

async function rootFolders(settings) {
  let root = settings.drive_root_folder_id;
  let inbox = settings.drive_inbox_folder_id;
  if (!root) root = await ensureFolder('Notities', 'root');
  if (!inbox) inbox = await ensureFolder('_inbox', root);
  if (root !== settings.drive_root_folder_id || inbox !== settings.drive_inbox_folder_id) {
    await db().from('settings').upsert({ owner_id: settings.owner_id, drive_root_folder_id: root, drive_inbox_folder_id: inbox });
  }
  return { root, inbox };
}

async function contextFolder(ctx, root) {
  if (ctx.drive_folder_id) return ctx.drive_folder_id;
  const id = await ensureFolder(ctx.naam, root);
  await db().from('contexts').update({ drive_folder_id: id }).eq('id', ctx.id);
  return id;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const datumNL = (iso) => new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'long', timeStyle: 'short' });

function docHtml(note, r, ctxNaam, transcript) {
  const lijst = (titel, items) => items?.length ? `<h2>${titel}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
  const acties = r.actiepunten?.length
    ? `<h2>Actiepunten</h2><ul>${r.actiepunten.map((a) => `<li><b>${esc(a.wie)}</b>: ${esc(a.wat)}${a.deadline ? ` <i>(vóór ${esc(a.deadline)})</i>` : ''}</li>`).join('')}</ul>` : '';
  const meta = [datumNL(note.gestart_op), ctxNaam, note.agenda_titel && `Agenda: ${note.agenda_titel}`,
    r.deelnemers?.length && `Aanwezig: ${r.deelnemers.join(', ')}`].filter(Boolean).map(esc).join('<br>');
  return `<html><head><meta charset="utf-8"></head><body>
<h1>${esc(r.titel)}</h1><p style="color:#5B6676">${meta}</p>
<h2>Samenvatting</h2>${r.samenvatting.split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('')}
${lijst('Besluiten', r.besluiten)}${acties}${lijst('Open vragen', r.open_vragen)}${lijst('Mijn vervolgstappen', r.mijn_vervolgstappen)}
<hr><h2>Transcript</h2>${transcript.split('\n').map((l) => `<p style="font-size:10pt">${esc(l)}</p>`).join('')}
<p style="color:#5B6676;font-size:9pt">Automatisch gemaakt door Notities. Controleer namen, bedragen en besluiten vóór gebruik.</p>
</body></html>`;
}

/** Verwerkt één notitie. Bij status 'opnieuw' met bestaand transcript wordt alleen opnieuw samengevat. */
export async function processNote(note) {
  const ownerId = note.owner_id;
  const settings = await settingsFor(ownerId);
  const contexten = await contextsFor(ownerId);
  const mijnNaam = settings.mijn_naam || 'Abdelkader';
  const modellen = { ...(note.modellen || {}) };
  let transcript = note.transcript;
  let duur = note.duur_sec;
  let bestandsnaam = note.modellen?.bestandsnaam || null;

  const alleenSamenvatten = note.status_oud === 'opnieuw' && transcript;
  if (!alleenSamenvatten) {
    const dir = await makeTmp();
    try {
      const paths = await listNoteAudio(ownerId, note.id);
      const bron = await downloadJoined(paths, dir);
      const { blocks, totaal } = await normalizeAndSplit(bron, dir);
      if (!blocks.length) throw new Error('Opname is leeg of onleesbaar');
      duur = Math.round(totaal);
      const stemRef = await voiceReferenceDataUrl(settings.stemreferentie_pad, dir);
      const alle = [];
      const providers = new Set();
      for (let i = 0; i < blocks.length; i++) {
        const { segmenten, provider } = await transcribeBlock(blocks[i], i, { mijnNaam, stemRef });
        alle.push(...segmenten);
        providers.add(provider);
      }
      if (!alle.length) throw new Error('Geen spraak herkend in de opname');
      transcript = formatTranscript(alle);
      modellen.transcriptie = [...providers];
      await db().from('segments').delete().eq('note_id', note.id);
      for (let i = 0; i < alle.length; i += 500) {
        const { error } = await db().from('segments').insert(alle.slice(i, i + 500).map((s) => ({ ...s, note_id: note.id, owner_id: ownerId })));
        if (error) throw error;
      }
      await update(note.id, { transcript, duur_sec: duur, status: 'samenvatten', modellen });
    } finally {
      await cleanTmp(dir);
    }
  } else {
    await update(note.id, { status: 'samenvatten' });
  }

  // Agenda (alleen voor opnames in de app: dan klopt het starttijdstip)
  let agendaTitel = note.agenda_titel, deelnemers = note.deelnemers || [], agendaId = note.agenda_event_id;
  if (note.bron === 'app' && !agendaId && googleEnabled()) {
    try {
      const ev = await eventAt(note.gestart_op);
      if (ev) ({ id: agendaId, titel: agendaTitel, deelnemers } = ev);
    } catch (e) { log(`Agenda niet beschikbaar: ${e.message}`); }
  }

  const vast = note.context_vast && contexten.find((c) => c.id === note.context_id);
  const hint = vast || matchContext(contexten, agendaTitel, bestandsnaam);
  const { resultaat: r, provider } = await structure({
    transcript, mijnNaam, contexten: vast ? [vast] : contexten,
    datum: datumNL(note.gestart_op), agendaTitel, deelnemers, contextHint: hint?.naam, bestandsnaam,
  });
  modellen.samenvatting = provider;
  const ctx = vast || contexten.find((c) => c.naam === r.context) || hint || contexten.find((c) => c.naam === 'Overig') || contexten[0];

  await db().from('actions').delete().eq('note_id', note.id);
  if (r.actiepunten?.length) {
    const { error } = await db().from('actions').insert(r.actiepunten.map((a) => ({
      note_id: note.id, owner_id: ownerId, wie: a.wie, wat: a.wat,
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(a.deadline) ? a.deadline : null, van_mij: !!a.van_mij,
    })));
    if (error) throw error;
  }

  let driveDocId = note.drive_doc_id, driveLink = null;
  if (googleEnabled()) {
    try {
      const { root } = await rootFolders(settings);
      const folder = await contextFolder(ctx, root);
      if (driveDocId) await trashFile(driveDocId);
      const d = new Date(note.gestart_op).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
      const doc = await createDoc(`${d} ${r.titel}`, docHtml({ ...note, agenda_titel: agendaTitel }, r, ctx.naam, transcript), folder);
      driveDocId = doc.id; driveLink = doc.webViewLink;
    } catch (e) {
      log(`Drive-document mislukt: ${e.message}`);
      modellen.drive_fout = e.message.slice(0, 300);
    }
  }

  const embedding = await embed([r.titel, ctx.naam, r.samenvatting, ...(r.besluiten || [])].join('\n'));
  await update(note.id, {
    status: 'gereed', titel: r.titel, samenvatting: r, context_id: ctx.id,
    deelnemers: r.deelnemers?.length ? r.deelnemers : deelnemers,
    agenda_event_id: agendaId, agenda_titel: agendaTitel, drive_doc_id: driveDocId,
    embedding, modellen, fout: null,
  });

  const mijn = (r.actiepunten || []).filter((a) => a.van_mij).length;
  await notify(`Notitie klaar: ${r.titel} (${ctx.naam})${mijn ? `\n${mijn} actiepunt(en) voor jou` : ''}\n${driveLink || appLink(`#/notitie/${note.id}`)}`);
  log(`Gereed: ${note.id} "${r.titel}" [${ctx.naam}] via ${modellen.transcriptie || '-'} / ${provider}`);
}

/** Pakt de volgende notitie atomair op. */
export async function claimNext() {
  // Alleen de eigenaar: wie zich ooit aanmeldt kan rijen aanmaken, maar laat
  // de worker daarmee niet op jouw sleutels transcriberen.
  const { data } = await db().from('notes').select('*').eq('owner_id', cfg.ownerId)
    .in('status', ['klaar_voor_verwerking', 'opnieuw']).order('aangemaakt').limit(1);
  const note = data?.[0];
  if (!note) return null;
  const { data: claimed } = await db().from('notes')
    .update({ status: 'transcriberen' }).eq('id', note.id).eq('status', note.status).select();
  return claimed?.length ? { ...claimed[0], status_oud: note.status } : null;
}

export async function failNote(note, err) {
  log(`Fout bij ${note.id}: ${err.stack || err.message}`);
  await update(note.id, { status: 'fout', fout: String(err.message || err).slice(0, 1000) }).catch(() => {});
  await notify(`Notitie mislukt (${note.titel || note.id}): ${String(err.message).slice(0, 300)}`);
}

/** Drive-inbox: elk audiobestand in Notities/_inbox wordt een notitie; daarna naar _inbox/verwerkt. */
export async function pollDriveInbox() {
  if (!googleEnabled()) return;
  const settings = await settingsFor(cfg.ownerId);
  const { inbox } = await rootFolders(settings);
  const files = (await listFolderFiles(inbox)).filter((f) => AUDIO_EXT.test(f.name) || f.mimeType?.startsWith('audio/'));
  if (!files.length) return;
  const verwerkt = await ensureFolder('verwerkt', inbox);
  for (const f of files) {
    const { data: bestaand } = await db().from('notes').select('id').eq('drive_bron_file_id', f.id).limit(1);
    if (bestaand?.length) { await moveFile(f.id, verwerkt, inbox).catch(() => {}); continue; }
    const buf = await downloadFile(f.id);
    const { data: note, error } = await db().from('notes').insert({
      owner_id: cfg.ownerId, bron: 'drive', status: 'opname', gestart_op: f.createdTime,
      drive_bron_file_id: f.id, titel: f.name, modellen: { bestandsnaam: f.name },
    }).select().single();
    if (error) throw error;
    const ext = path.extname(f.name) || '.m4a';
    const { error: upErr } = await db().storage.from('audio')
      .upload(`${cfg.ownerId}/${note.id}/upload${ext.toLowerCase()}`, buf, { contentType: f.mimeType || 'application/octet-stream', upsert: true });
    if (upErr) throw upErr;
    await update(note.id, { status: 'klaar_voor_verwerking' });
    await moveFile(f.id, verwerkt, inbox);
    log(`Uit Drive-inbox opgepakt: ${f.name}`);
  }
}

/** Opruimen: audio na bewaartermijn weg; vastgelopen opnames (app gecrasht) toch verwerken. */
export async function housekeeping() {
  const nu = new Date().toISOString();
  const { data: oud } = await db().from('notes').select('id, owner_id').eq('owner_id', cfg.ownerId)
    .lt('audio_verwijderen_na', nu).eq('audio_verwijderd', false).limit(50);
  for (const n of oud || []) {
    const aantal = await deleteNoteAudio(n.owner_id, n.id);
    await update(n.id, { audio_verwijderd: true });
    log(`Audio verwijderd voor ${n.id} (${aantal} bestanden)`);
  }
  const grens = new Date(Date.now() - 3 * 3600_000).toISOString();
  const { data: hangend } = await db().from('notes').select('id, owner_id').eq('owner_id', cfg.ownerId).eq('status', 'opname').lt('bijgewerkt', grens).limit(20);
  for (const n of hangend || []) {
    const paths = await listNoteAudio(n.owner_id, n.id);
    await update(n.id, paths.length ? { status: 'klaar_voor_verwerking' } : { status: 'fout', fout: 'Opname afgebroken zonder audio' });
    log(`Vastgelopen opname ${n.id}: ${paths.length ? 'alsnog verwerken' : 'fout'}`);
  }
}
