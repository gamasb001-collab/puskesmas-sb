/* Puskesmas Digital — core.js v2.0 • © Arraihan Academy
   Inti aplikasi: utilitas, tema terang/gelap, klien API (timeout, retry, idempoten), modal, router hash. */
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = { pub: null, adm: null, tok: null, step: 1, f: {}, tk: null, lg: 'email', em: '', view: 'beranda', want: null, t0: Date.now(), rid: '', ridSig: '', lastPub: 0 };
const ACT = {}, OI = {};                                   // ACT: aksi klik • OI: aksi input
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HR = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], BL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const wib = d => new Date(d.getTime() + 252e5).toISOString().slice(0, 10), dn = y => HR[new Date(y + 'T12:00:00Z').getUTCDay()];
const tgl = y => { if (!y) return ''; const p = String(y).split('-'); return p.length < 3 ? y : +p[2] + ' ' + BL[p[1] - 1] + ' ' + p[0]; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));
const mk = n => String(n).slice(0, 4) + ' •••• •••• ••••';
const pill = v => { const m = { ya: 'ok', Aktif: 'ok', Selesai: 'ok', Dikonfirmasi: 'ok', Menunggu: 'wt', Terjadwal: 'wt', tidak: 'ds', Nonaktif: 'ds', Dibatalkan: 'er' }; return `<span class="pl ${m[v] || ''}">${esc(v)}</span>`; };
const hl = t => { const w = esc(t).split(' '); return w.length > 2 ? w.slice(0, -2).join(' ') + ' <b>' + w.slice(-2).join(' ') + '</b>' : esc(t); };
const av = (u, n) => u ? `<img class="av" loading="lazy" referrerpolicy="no-referrer" src="${esc(u)}" alt="${esc(n)}">` : `<div class="av" aria-hidden="true">${esc((String(n).replace(/^(dr\.?|drg\.?|Bdn\.?|Ns\.?)\s*/i, '')[0] || '?').toUpperCase())}</div>`;
const LOGO = () => { const u = S.pub && S.pub.cfg && S.pub.cfg.LogoUrl; return u ? `<img src="${esc(u)}" alt="Logo" referrerpolicy="no-referrer">` : '<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2 38 12v20L20 42 2 32V12z" fill="#fff" stroke="#064A18" stroke-width="3"/><path d="M15 12h10v8h8v8h-8v8H15v-8H7v-8h8z" fill="#0A6B1A"/></svg>'; };
function salin(teks) { return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(teks) : Promise.reject()).catch(() => { const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove(); }); }

/* ── Toast ── */
let tt; function toast(m, t) { const e = $('#toast'); e.textContent = m; e.className = 'on ' + (t || ''); clearTimeout(tt); tt = setTimeout(() => e.className = '', t === 'err' ? 5000 : 3000); }
const fail = e => { if (!e || !e.handled) toast((e && e.message) || 'Terjadi kesalahan.', 'err'); };

/* ── Tema terang / gelap ── */
const Tema = {
  get() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
  set(t, simpan) {
    document.documentElement.setAttribute('data-theme', t);
    if (simpan) try { localStorage.setItem('tema', t); } catch (e) { }
    $$('.tg i').forEach(i => i.className = 'bi bi-' + (t === 'dark' ? 'sun' : 'moon-stars'));
    $$('.tg').forEach(b => b.setAttribute('aria-label', t === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'));
    const m = $('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue(t === 'dark' ? '--bg' : '--g').trim() || '#0A6B1A';
  },
  toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark', true); }
};
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!localStorage.getItem('tema')) Tema.set(e.matches ? 'dark' : 'light'); }); } catch (e) { }
ACT.tema = () => Tema.toggle();

/* Warna tema aplikasi (dipilih admin) → variabel CSS untuk mode terang dan gelap */
function applyBrand(h) {
  let st = $('#brand'); if (!st) { st = document.createElement('style'); st.id = 'brand'; document.head.appendChild(st); }
  if (!/^#[0-9a-f]{6}$/i.test(h || '')) { st.textContent = ''; Tema.set(Tema.get()); return; }
  const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let H = 0, Sx = 0, L = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; Sx = L > .5 ? d / (2 - mx - mn) : d / (mx + mn); H = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60; }
  L = Math.min(L, .42); const c = (l, s) => `hsl(${Math.round(H)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`, s = Math.min(Sx, .9);
  st.textContent = `:root{--g:${c(L, s)};--gh:${c(Math.max(L - .05, .1), s)};--gd:${c(L * .55, s)};--gt:${c(.94, Math.min(s, .45))};--gx:${c(L, s)}}[data-theme=dark]{--g:${c(.3, s)};--gh:${c(.25, s)};--gd:${c(.12, s)};--gt:${c(.16, Math.min(s, .5))};--gx:${c(.68, Math.min(s, .8))}}`;
  Tema.set(Tema.get());
}

/* ── Klien API: GET/POST ke Apps Script (text/plain → tanpa preflight CORS) ── */
class ApiErr extends Error { constructor(m, kode) { super(m); this.kode = kode || ''; } }
const cfgOk = () => window.GAS_URL && !/XXXX/.test(window.GAS_URL);
async function http(url, opt, timeout) {
  if (!cfgOk()) throw new ApiErr('URL backend belum diisi. Edit js/config.js dan isi GAS_URL dengan URL /exec dari Apps Script.', 'KONFIG');
  const c = new AbortController(), to = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, Object.assign({ signal: c.signal, redirect: 'follow', credentials: 'omit' }, opt)), tx = await r.text();
    try { return JSON.parse(tx); } catch (e) { throw new ApiErr('Respons server tidak valid. Pastikan URL /exec benar dan deployment memakai Execute as: Me, Who has access: Anyone.', 'FORMAT'); }
  } catch (e) {
    if (e instanceof ApiErr) throw e;
    if (e.name === 'AbortError') throw new ApiErr('Server tidak merespons tepat waktu. Periksa koneksi lalu coba lagi.', 'WAKTU');
    throw new ApiErr(navigator.onLine ? 'Tidak dapat terhubung ke server. Periksa URL /exec dan pengaturan deployment.' : 'Anda sedang offline.', 'JARINGAN');
  } finally { clearTimeout(to); }
}
async function call(fn, o) {
  o = o || {}; let last;
  for (let i = 0; i <= (o.retry || 0); i++) {
    try { const j = await fn(); if (!j || !j.success) throw new ApiErr((j && j.message) || 'Permintaan gagal.', j && j.kode); return j.data; }
    catch (e) { last = e; if (['JARINGAN', 'WAKTU', 'FORMAT'].includes(e.kode) && i < (o.retry || 0)) { await sleep(700 * 2 ** i); continue; } break; }
  }
  if (!(last instanceof ApiErr)) last = new ApiErr(last && last.message);
  gangguan(last); throw last;
}
const GET = (a, o) => call(() => http(window.GAS_URL + '?action=' + a + '&v=' + window.APP_VER, { method: 'GET' }, (o && o.timeout) || 45000), o);
const POST = (a, p, o) => call(() => http(window.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: a, token: S.tok }, p)) }, (o && o.timeout) || 60000), o);
/* Penanganan galat lintas-modul: sesi berakhir & lisensi habis */
function gangguan(e) {
  if (e.kode === 'SESI') { e.handled = true; resetSesi(); toast('Sesi berakhir. Silakan masuk kembali.', 'err'); go('login'); }
  else if (e.kode === 'LISENSI') { e.handled = true; if (S.pub && S.pub.lisensi) S.pub.lisensi.mode = 'habis'; resetSesi(); toast(e.message, 'err'); go('aktivasi'); }
}
function resetSesi() { S.tok = null; S.adm = null; try { sessionStorage.removeItem('tok'); } catch (x) { } if (typeof renderLis === 'function') renderLis(); }

/* ── Modal (fokus terjaga, Esc menutup, gulir latar dikunci) ── */
let lastFocus = null;
function openModal(html, cls) {
  lastFocus = document.activeElement; const m = $('#mdl');
  m.innerHTML = `<div class="mb" data-act="mbg"><div class="md ${cls || ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  m.classList.add('on'); document.body.style.overflow = 'hidden';
  const f = $('#mdl input:not([type=hidden]):not([type=file]),#mdl select,#mdl textarea,#mdl .btn'); if (f) f.focus({ preventScroll: true });
}
function cm() { const m = $('#mdl'); m.classList.remove('on'); m.innerHTML = ''; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { } }
ACT.mbg = (t, e) => { if (e.target === t) (typeof mdlCancel === 'function' ? mdlCancel() : cm()); }; ACT.cm = () => cm();
function conf(msg, fn, ok) {
  openModal(`<p>${esc(msg)}</p><div class="ft"><button class="btn o" data-act="cm">Batal</button><button class="btn dg" id="cy">${esc(ok || 'Ya, lanjutkan')}</button></div>`, 'sm');
  $('#cy').onclick = () => { cm(); fn(); };
}
const busy = (b, on, txt) => { if (!b) return; if (on) { b.dataset.t = b.innerHTML; b.disabled = true; if (txt) b.textContent = txt; } else { b.disabled = false; if (b.dataset.t) b.innerHTML = b.dataset.t; } };

/* ── Delegasi event (tanpa atribut onclick sebaris) ── */
document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && ACT[t.dataset.act]) { const r = ACT[t.dataset.act](t, e); if (r instanceof Promise) r.catch(fail); } });
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const t = e.target; if (!t.dataset) return; if (t.type === 'file' && e.type !== 'change') return;
  if (t.dataset.f) { if (t.dataset.f === 'NIK') { const v = t.value.replace(/\D/g, '').slice(0, 16); if (v !== t.value) t.value = v; } S.f[t.dataset.f] = t.value; }
  if (t.dataset.oi && OI[t.dataset.oi]) OI[t.dataset.oi](t, e);
}));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#mdl').classList.contains('on')) { (typeof mdlCancel === 'function' ? mdlCancel() : cm()); return; }
  if (e.key === 'Tab' && $('#mdl').classList.contains('on')) {
    const f = $$('#mdl button:not(:disabled),#mdl input:not([type=hidden]):not(:disabled),#mdl select,#mdl textarea,#mdl a[href]'); if (!f.length) return;
    const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
  }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter && ACT[e.target.dataset.enter]) { e.preventDefault(); ACT[e.target.dataset.enter](e.target, e); }
});
document.addEventListener('click', e => { if (e.target.closest('.tg')) Tema.toggle(); });

/* ── Router hash (tombol Kembali bekerja, tanpa perlu konfigurasi server) ── */
const PUB = ['beranda', 'jadwal', 'galeri', 'wilayah', 'daftar', 'login', 'aktivasi'], ADMV = { dash: 'Dashboard', pegawai: 'Data Pegawai', klaster: 'PJ Klaster', jadwal: 'Jadwal Layanan', wilayah: 'Wilayah Kerja', galeri: 'Galeri', reg: 'Registrasi Pasien', akun: 'Pengaturan' };
const JUDUL = { beranda: 'Beranda', jadwal: 'Jadwal Layanan', galeri: 'Galeri', wilayah: 'Wilayah Kerja', daftar: 'Daftar Online', login: 'Masuk', aktivasi: 'Aktivasi Lisensi' };
function go(v) { if (location.hash === '#/' + v) show(v); else location.hash = '#/' + v; }
const route = () => show((location.hash || '').replace(/^#\/?/, '') || 'beranda');
function show(v) {
  if (v === 'login' && S.adm) v = 'a-dash';
  if (v.startsWith('a-')) {
    if (!ADMV[v.slice(2)]) v = 'beranda';
    else if (!S.tok) { S.want = v; v = 'login'; }
    else if (!S.adm) { S.want = v; $('#ld').classList.remove('off'); return; }
    else if (v === 'a-akun' && S.adm.sesi.peran !== 'admin') { toast('Menu Pengaturan khusus admin.', 'err'); v = 'a-dash'; }
  } else if (!PUB.includes(v)) v = 'beranda';
  S.view = v; const a = v.startsWith('a-');
  document.body.classList.toggle('adm', a);
  $$('.v').forEach(e => e.classList.toggle('on', e.id === 'v-' + v)); $$('[data-v]').forEach(e => e.classList.toggle('act', e.dataset.v === v));
  $('#side').classList.remove('open'); $('#scrim').classList.remove('on'); scrollTo(0, 0);
  document.title = (a ? ADMV[v.slice(2)] : JUDUL[v]) + ' — ' + ((S.pub && S.pub.cfg && S.pub.cfg.Nama) || 'Puskesmas Digital');
  if (a) { $('#ttl').textContent = ADMV[v.slice(2)]; RA[v.slice(2)](); } else { if (v === 'daftar') rDaftar(); else if (v === 'login') rLogin(); else if (v === 'aktivasi') rAktivasi(); }
  const mn = $('#main'); if (mn) mn.focus({ preventScroll: true }); renderLis();
}
window.addEventListener('hashchange', route);

/* ── Galat global & status jaringan ── */
const eb = m => { const b = $('#eb'); b.hidden = false; b.textContent = m; };
window.addEventListener('error', e => { if (/ResizeObserver/.test(e.message || '')) return; eb('Terjadi galat tak terduga (' + window.APP_VER + '): ' + (e.message || '') + (e.lineno ? ' [baris ' + e.lineno + ']' : '') + '\nCoba muat ulang halaman (Ctrl+Shift+R).'); });
window.addEventListener('unhandledrejection', e => { const m = e.reason && e.reason.message; if (e.reason instanceof ApiErr) return; eb('Galat: ' + (m || e.reason)); });
document.addEventListener('DOMContentLoaded', () => { $('#eb').addEventListener('click', () => $('#eb').hidden = true); });
const netUi = () => { $('#off').hidden = navigator.onLine; };
window.addEventListener('online', () => { netUi(); toast('Koneksi kembali.', 'ok'); if (typeof refreshPub === 'function') refreshPub(); }); window.addEventListener('offline', netUi);

/* ── Boot ── */
function boot() { Tema.set(Tema.get()); netUi(); try { S.tok = sessionStorage.getItem('tok'); } catch (e) { } initPub(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
