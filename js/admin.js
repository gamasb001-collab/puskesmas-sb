/* Puskesmas Digital — admin.js v2.0 • © Arraihan Academy
   Panel Admin/Pegawai: dashboard, CRUD generik (optimistic UI + rollback), registrasi, pengaturan, lisensi. */
'use strict';
const online = () => { if (!navigator.onLine) { toast('Anda sedang offline. Sambungkan internet lalu coba lagi.', 'err'); return false; } return true; };
const isA = () => S.adm.sesi.peran === 'admin', isDemo = () => !!(S.adm && S.adm.sesi.demo);

/* ── Muat data panel & bangun menu ── */
async function loadAdm(first) {
  try {
    const d = await POST('dataAdmin', {}, { retry: 1 });
    ['pegawai', 'jadwal', 'wilayah', 'daftar', 'profil', 'klaster', 'layananDesa', 'galeri', 'pengguna'].forEach(x => d[x] = d[x] || []);
    S.adm = d; if (d.lisensi && S.pub) S.pub.lisensi = d.lisensi;
    buildSide(); applyBrand(d.cfg.WarnaDashboard);
    const w = S.want || (first ? 'a-dash' : null); S.want = null; hideLd();
    if (w) go(w); else if (S.view.startsWith('a-')) show(S.view); else renderLis();
    if (first) toast('Selamat datang, ' + d.sesi.nama, 'ok');
  } catch (x) { S.want = null; hideLd(); if (first) throw x; if (!x.handled) toast(x.message, 'err'); }
}
function buildSide() {
  const a = isA(), it = [['dash', 'speedometer2'], ['pegawai', 'people'], ['klaster', 'person-badge'], ['jadwal', 'calendar3'], ['wilayah', 'geo-alt'], ['galeri', 'images'], ['reg', 'clipboard2-pulse'], ['akun', 'gear', 1]];
  $('#side').innerHTML = `<div class="sb">${LOGO()}<div><b>Puskesmas Digital</b><br><span class="tag w">${a ? 'Admin' : 'Pegawai'}${isDemo() ? ' · Demo' : ''}</span></div></div><nav>${it.map(x => `<a href="#/a-${x[0]}" data-v="a-${x[0]}"><i class="bi bi-${x[1]}"></i>${ADMV[x[0]]}${x[2] && !a ? '<i class="bi bi-lock ml"></i>' : ''}</a>`).join('')}</nav><div class="sf"><button type="button" data-act="tema"><i class="bi bi-circle-half"></i>Mode terang / gelap</button><button type="button" data-act="keluar"><i class="bi bi-box-arrow-left"></i>Keluar</button></div>`;
  $('#who').textContent = S.adm.sesi.nama + (isDemo() ? ' (demo)' : '');
  $('#abt').innerHTML = [['dash', 'speedometer2', 'Beranda'], ['reg', 'clipboard2-pulse', 'Registrasi'], ['jadwal', 'calendar3', 'Jadwal'], ['wilayah', 'geo-alt', 'Desa']].map(x => `<a href="#/a-${x[0]}" data-v="a-${x[0]}"><i class="bi bi-${x[1]}"></i>${x[2]}</a>`).join('') + '<a href="#" data-act="menu"><i class="bi bi-list"></i>Menu</a>';
}
ACT.keluar = () => { POST('keluar', {}).catch(() => { }); resetSesi(); go('beranda'); toast('Anda telah keluar.', 'ok'); };
const toggleSide = () => { const o = $('#side').classList.toggle('open'); $('#scrim').classList.toggle('on', o); };
ACT.menu = (t, e) => { e.preventDefault(); toggleSide(); };
$('#mbtn').addEventListener('click', toggleSide); $('#scrim').addEventListener('click', toggleSide);
ACT.cm = () => mdlCancel();
let mdlRst = null; function mdlCancel() { if (mdlRst) { mdlRst(); mdlRst = null; } cm(); }

/* ── Modul CRUD generik ── */
const LBS = { VideoUrl: 'Link' };
const LBL = { JamMulai: 'Jam mulai', JamSelesai: 'Jam selesai', FotoKepala: 'Foto Kepala Puskesmas', FotoUrl: 'Foto', VideoUrl: 'Link video (YouTube / Google Drive)', FotoHero: 'Foto Puskesmas (beranda)', LogoUrl: 'Logo' };
const MOD = {
  pegawai: { t: 'Pegawai', k: 'pegawai', j: 'Data Pegawai', c: ['FotoUrl', 'Nama', 'NIP', 'Jabatan', 'Unit'], f: [['Nama', '', 1], ['NIP'], ['Jabatan', '', 1], ['Unit'], ['Kontak'], ['FotoUrl', 'foto:Foto Pegawai']], w: 'a' },
  jadwal: { t: 'JadwalLayanan', k: 'jadwal', j: 'Jadwal Layanan', c: ['Layanan', 'Hari', 'JamMulai', 'JamSelesai', 'Lokasi', 'PJ', 'Status'], f: [['Layanan', '', 1], ['Hari', '', 1], ['JamMulai', 'time', 1], ['JamSelesai', 'time', 1], ['Lokasi'], ['PJ'], ['Status', 'sel:Aktif,Nonaktif']], w: 'ap' },
  wilayah: { t: 'WilayahKerja', k: 'wilayah', j: 'Daftar Desa', c: ['Nama', 'Desa', 'Keterangan'], f: [['Nama', '', 1], ['Desa'], ['Keterangan', 'area']], w: 'a' },
  profil: { t: 'Profil', k: 'profil', j: 'Profil (Visi, Misi, Moto)', c: ['Jenis', 'Isi'], f: [['Jenis', '', 1], ['Isi', 'area', 1]], w: 'a' },
  galeri: { t: 'Galeri', k: 'galeri', j: 'Galeri (foto, video, link)', c: ['FotoUrl', 'Nama', 'VideoUrl'], f: [['Nama', '', 1], ['FotoUrl', 'foto:Galeri Kegiatan'], ['VideoUrl', 'url']], w: 'ap' },
  klaster: { t: 'PJKlaster', k: 'klaster', j: 'PJ Klaster', c: ['LogoUrl', 'FotoUrl', 'Klaster', 'Nama', 'Jabatan'], f: [['Klaster', '', 1], ['Nama', '', 1], ['Jabatan'], ['FotoUrl', 'foto:Foto Pegawai'], ['LogoUrl', 'foto:Foto Puskesmas']], w: 'a' },
  layananDesa: { t: 'LayananDesa', k: 'layananDesa', j: 'Kegiatan Desa', c: ['FotoUrl', 'Desa', 'Layanan', 'Hari', 'PJ'], h: { Layanan: 'Kegiatan' }, f: [['Desa', 'seldesa', 1], ['Layanan', '', 1, 'Nama Kegiatan'], ['Hari'], ['JamMulai', 'time'], ['JamSelesai', 'time'], ['Lokasi'], ['PJ'], ['Keterangan', 'area'], ['FotoUrl', 'foto:Galeri Kegiatan', 0, 'Dokumentasi (foto kegiatan)']], w: 'ap' },
  akun: { t: 'Pengguna', k: 'pengguna', j: 'Akun Pengguna', c: ['Nama', 'Email', 'Peran', 'Aktif'], f: [['Nama', '', 1], ['Email', 'email', 1], ['Peran', 'sel:admin,pegawai'], ['Aktif', 'sel:ya,tidak']], w: 'a' }
};
const RV = { pegawai: 'pegawai', jadwal: 'jadwal', wilayah: 'wilayah', klaster: 'klaster', layananDesa: 'wilayah', galeri: 'galeri', profil: 'akun', akun: 'akun' };
const RA = { dash: rDash, pegawai: () => rMod('pegawai'), klaster: () => rMod('klaster'), galeri: () => rMod('galeri'), jadwal: () => rMod('jadwal'), wilayah: rWilAdm, reg: rReg, akun: rAkun };
const rMod = k => { $('#v-a-' + RV[k]).innerHTML = modHTML(k); };
const bolehUbah = (k, x) => { const m = MOD[k], a = isA(); return m.w.includes(a ? 'a' : 'p') && (a || k !== 'jadwal' || x.PJ === S.adm.sesi.nama); };
function modHTML(k) {
  const m = MOD[k], w = m.w.includes(isA() ? 'a' : 'p');
  return `<div class="card"><div class="hd"><h3>${m.j}</h3>${w && k !== 'profil' ? `<button class="btn" data-act="fm" data-k="${k}"><i class="bi bi-plus-lg"></i> Tambah</button>` : ''}</div><input class="sr" placeholder="Cari…" aria-label="Cari" data-oi="srch" data-k="${k}"><div class="tw"><table><thead><tr>${m.c.map(c => `<th>${(m.h && m.h[c]) || LBS[c] || LBL[c] || c}</th>`).join('')}<th></th></tr></thead><tbody id="tb-${k}">${rowsHTML(k, '')}</tbody></table></div></div>`;
}
OI.srch = t => { $('#tb-' + t.dataset.k).innerHTML = rowsHTML(t.dataset.k, t.value); };
function rowsHTML(k, q) {
  const m = MOD[k], a = isA(); q = q.toLowerCase();
  const r = (S.adm[m.k] || []).filter(x => !q || Object.values(x).join(' ').toLowerCase().includes(q));
  if (!r.length) return `<tr><td colspan="${m.c.length + 1}" class="em">Belum ada data.</td></tr>`;
  const lb = c => (m.h && m.h[c]) || LBS[c] || LBL[c] || c;
  return r.map(x => `<tr>${m.c.map(c => `<td data-l="${esc(lb(c))}">${(c === 'FotoUrl' || c === 'LogoUrl') ? (x[c] ? `<img class="th" loading="lazy" referrerpolicy="no-referrer" src="${esc(x[c])}" alt="">` : '-') : ['Publik', 'Status', 'Aktif'].includes(c) ? pill(x[c]) : esc(x[c])}</td>`).join('')}<td class="ac">${bolehUbah(k, x) ? `<button class="ib" aria-label="Ubah" data-act="fm" data-k="${k}" data-id="${esc(x.ID)}"><i class="bi bi-pencil"></i></button>` : ''}${a && k !== 'profil' ? `<button class="ib dg" aria-label="Hapus" data-act="hp" data-k="${k}" data-id="${esc(x.ID)}"><i class="bi bi-trash"></i></button>` : ''}</td></tr>`).join('');
}
function fld(n, t, r, v, lb) {
  const l = `<label class="${t === 'area' || t.startsWith('foto') ? 'full' : ''}">${esc(lb || LBL[n] || n)}${r ? ' *' : ''}`;
  if (t === 'seldesa') return l + `<select name="${n}">${S.adm.wilayah.map(w => `<option ${w.Nama === v ? 'selected' : ''}>${esc(w.Nama)}</option>`).join('')}</select></label>`;
  if (t.startsWith('sel:')) return l + `<select name="${n}">${t.slice(4).split(',').map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  if (t === 'area') return l + `<textarea name="${n}" rows="3">${esc(v)}</textarea></label>`;
  if (t.startsWith('foto')) return l + `<input type="hidden" name="${n}" value="${esc(v)}"><img class="fpv" referrerpolicy="no-referrer" src="${esc(v)}" alt="" ${v ? '' : 'hidden'}><input type="file" accept="image/*" data-oi="up" data-sub="${esc(t.slice(5))}"><small>${v ? 'Foto tersimpan' : 'Belum ada foto'}</small></label>`;
  return l + `<input name="${n}" type="${t || 'text'}" value="${esc(v)}" ${r ? 'required' : ''}></label>`;
}
ACT.fm = t => fm(t.dataset.k, t.dataset.id);
function fm(k, id, pre) {
  const m = MOD[k], x = id ? S.adm[m.k].find(r => r.ID === id) : (pre || {});
  openModal(`<div class="hd"><h3>${id ? 'Ubah' : 'Tambah'} data</h3><button class="ib" aria-label="Tutup" data-act="cm"><i class="bi bi-x-lg"></i></button></div><div class="fg">${m.f.map(f => fld(f[0], f[1] || '', f[2], x[f[0]] || '', f[3])).join('')}</div><div class="ft"><button class="btn o" data-act="cm">Batal</button><button class="btn" data-sv data-act="sm" data-k="${k}" data-id="${esc(id || '')}">Simpan</button></div>`);
}
function kecil(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), i = new Image();
    i.onload = () => { const k = Math.min(1, 1000 / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .8).split(',')[1]); };
    i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('File bukan gambar yang valid.')); }; i.src = u;
  });
}
OI.up = async el => {
  const f = el.files[0]; if (!f) return; if (!online()) { el.value = ''; return; }
  const p = el.parentNode, s = p.querySelector('small'), im = p.querySelector('img'), bs = $$('[data-sv]');
  im.src = URL.createObjectURL(f); im.hidden = false; s.textContent = 'Mengunggah… tunggu sampai selesai sebelum menyimpan'; bs.forEach(b => b.disabled = true);
  try { const b = await kecil(f), r = await POST('unggah', { b64: b, nama: f.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', sub: el.dataset.sub }, { timeout: 90000 }); p.querySelector('input[type=hidden]').value = r.url; s.textContent = 'Foto terunggah. Klik Simpan.'; }
  catch (x) { s.textContent = 'Gagal mengunggah'; fail(x); }
  bs.forEach(b => b.disabled = false);
};
ACT.sm = t => {
  const k = t.dataset.k, id = t.dataset.id, m = MOD[k], rec = id ? Object.assign({}, S.adm[m.k].find(r => r.ID === id)) : {}; let bad = 0;
  $$('#mdl [name]').forEach(e => { rec[e.name] = e.value.trim(); if (e.required && !e.value.trim()) bad = 1; });
  if (bad) { toast('Lengkapi kolom yang wajib diisi.', 'err'); return; } if (!online()) return;
  if (k === 'akun' && !/^\S+@\S+\.\S+$/.test(rec.Email || '')) { toast('Email tidak valid.', 'err'); return; }
  if (!id) rec.ID = uid(); if (!isA() && k === 'jadwal') rec.PJ = S.adm.sesi.nama;
  S.adm[m.k] = S.adm[m.k] || []; const snap = JSON.stringify(S.adm[m.k]), L = S.adm[m.k], i = L.findIndex(r => r.ID === rec.ID); if (i >= 0) L[i] = rec; else L.push(rec);
  cm(); RA[RV[k]](); toast('Menyimpan…');
  POST('simpan', { tabel: m.t, rec: rec }, { timeout: 60000 }).then(() => { toast('Tersimpan', 'ok'); refreshPub(); }).catch(x => { S.adm[m.k] = JSON.parse(snap); if (S.adm) RA[RV[k]](); fail(x); });
};
ACT.hp = t => {
  const k = t.dataset.k, id = t.dataset.id;
  conf('Hapus data ini? Tindakan tidak dapat dibatalkan.', () => {
    if (!online()) return; const m = MOD[k], snap = JSON.stringify(S.adm[m.k]); S.adm[m.k] = S.adm[m.k].filter(r => r.ID !== id); RA[RV[k]](); toast('Menghapus…');
    POST('hapus', { tabel: m.t, id: id }).then(() => { toast('Dihapus', 'ok'); refreshPub(); }).catch(x => { S.adm[m.k] = JSON.parse(snap); if (S.adm) RA[RV[k]](); fail(x); });
  });
};

/* ── Dashboard ── */
function rDash() {
  const A = S.adm, t = wib(new Date()), k = +A.cfg.KuotaHarian || 100, h = A.daftar.filter(r => r.TglKunjungan === t && r.Status !== 'Dibatalkan').length;
  const kp = [['people', 'Total Pegawai', A.pegawai.length, 'orang'], ['calendar3', 'Jadwal Aktif', A.jadwal.filter(j => j.Status === 'Aktif').length, 'layanan'], ['megaphone', 'Kegiatan Desa', A.layananDesa.length, 'kegiatan'], ['clipboard2-pulse', 'Pendaftaran Hari Ini', h + ' / ' + k, 'dari kuota harian']];
  const hari = [...Array(7)].map((_, i) => wib(new Date(Date.now() + (i - 3) * 864e5))), cnt = hari.map(y => A.daftar.filter(r => r.TglKunjungan === y && r.Status !== 'Dibatalkan').length), mx = Math.max(1, ...cnt);
  $('#v-a-dash').innerHTML = `<div class="card kepala">${av(A.cfg.FotoKepala, A.cfg.NamaKepala || 'K')}<div><b>${esc(A.cfg.NamaKepala || 'Kepala Puskesmas')}</b><br><small>Kepala Puskesmas</small></div>${isA() ? '<button class="btn o sm" data-act="fmKepala">Ubah</button>' : ''}</div>
<div class="kp">${kp.map(x => `<div class="card"><i class="bi bi-${x[0]}"></i><small>${x[1]}</small><b class="big">${x[2]}</b><small>${x[3]}</small></div>`).join('')}</div>
<div class="card"><h3>Kunjungan terdaftar — 7 hari (3 hari lalu s.d. 3 hari ke depan)</h3><div class="cht" role="img" aria-label="Grafik pendaftaran per hari">${hari.map((y, i) => `<div><b>${cnt[i]}</b><i style="height:${Math.max(3, cnt[i] / mx * 100)}%;${y === t ? '' : 'opacity:.65'}"></i><span>${dn(y).slice(0, 3)} ${+y.slice(8)}</span></div>`).join('')}</div></div>
<div class="card"><div class="hd"><h3>Pendaftaran Terbaru</h3><a href="#/a-reg">Lihat semua</a></div><div class="tw"><table><thead><tr><th>Antrean</th><th>Nama</th><th>Layanan</th><th>Kunjungan</th><th>Status</th></tr></thead><tbody>${A.daftar.slice(-5).reverse().map(x => `<tr><td data-l="Antrean" class="mono">${esc(x.NoAntrean)}</td><td data-l="Nama">${esc(x.Nama)}</td><td data-l="Layanan">${esc(x.Layanan)}</td><td data-l="Kunjungan">${tgl(x.TglKunjungan)}</td><td data-l="Status">${pill(x.Status)}</td></tr>`).join('') || '<tr><td colspan="5" class="em">Belum ada pendaftaran.</td></tr>'}</tbody></table></div></div>`;
}

/* ── Registrasi pasien ── */
const ST = ['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];
function rReg() {
  const a = S.adm.daftar, t = wib(new Date()), k = +S.adm.cfg.KuotaHarian || 100, h = a.filter(r => r.TglKunjungan === t && r.Status !== 'Dibatalkan').length;
  $('#v-a-reg').innerHTML = `<div class="kp">${ST.map(s => `<div class="card"><small>${s}</small><b class="big">${a.filter(r => r.Status === s).length}</b></div>`).join('')}<div class="card"><small>Kuota hari ini</small><b class="big mono">${h} / ${k}</b><div class="bar"><i style="width:${Math.min(100, h / k * 100)}%"></i></div></div></div><div class="card"><div class="fl" style="margin-bottom:10px"><input id="rq" data-oi="freg" placeholder="Cari nama atau nomor pendaftaran" aria-label="Cari"><input type="date" id="rt" data-oi="freg" aria-label="Tanggal kunjungan"><select id="rs" data-oi="freg" aria-label="Status"><option value="">Semua status</option>${ST.map(s => `<option>${s}</option>`).join('')}</select></div><div class="tw"><table><thead><tr><th>No Daftar</th><th>Antrean</th><th>Nama</th><th>NIK</th><th>Layanan</th><th>Kunjungan</th><th>Status</th><th></th></tr></thead><tbody id="rb"></tbody></table></div></div>`; fReg();
}
OI.freg = () => fReg();
function fReg() {
  const q = $('#rq').value.toLowerCase(), t = $('#rt').value, s = $('#rs').value, r = S.adm.daftar.filter(x => (!q || (x.Nama + ' ' + x.ID).toLowerCase().includes(q)) && (!t || x.TglKunjungan === t) && (!s || x.Status === s)).sort((a, b) => b.TglKunjungan.localeCompare(a.TglKunjungan) || b.ID.localeCompare(a.ID));
  $('#rb').innerHTML = r.length ? r.map(x => `<tr><td data-l="No Daftar" class="mono">${esc(x.ID)}</td><td data-l="Antrean" class="mono">${esc(x.NoAntrean)}</td><td data-l="Nama">${esc(x.Nama)}</td><td data-l="NIK" class="mono">${mk(x.NIK)}</td><td data-l="Layanan">${esc(x.Layanan)}</td><td data-l="Kunjungan">${tgl(x.TglKunjungan)}</td><td data-l="Status">${pill(x.Status)}</td><td class="ac"><button class="btn o sm" data-act="dt" data-id="${esc(x.ID)}">Detail</button></td></tr>`).join('') : '<tr><td colspan="8" class="em">Tidak ada pendaftaran.</td></tr>';
}
ACT.dt = t => {
  const x = S.adm.daftar.find(r => r.ID === t.dataset.id); if (!x) return;
  openModal(`<div class="hd"><h3 class="mono">${esc(x.ID)}</h3>${pill(x.Status)}<button class="ib" aria-label="Tutup" data-act="cm"><i class="bi bi-x-lg"></i></button></div><dl class="dl">${[['NIK', x.NIK], ['Nama', x.Nama], ['Tanggal lahir', tgl(x.TglLahir)], ['Jenis kelamin', x.JK], ['Alamat', x.Alamat], ['Nomor HP', x.NoHP], ['Nomor BPJS', x.NoBPJS || '-'], ['Layanan', x.Layanan], ['Kunjungan', tgl(x.TglKunjungan)], ['Antrean', x.NoAntrean]].map(y => `<dt>${y[0]}</dt><dd class="${y[0] === 'NIK' ? 'mono' : ''}">${esc(y[1])}</dd>`).join('')}</dl><div class="fl">${['Dikonfirmasi', 'Selesai', 'Dibatalkan'].map(s => `<button class="btn ${x.Status === s ? '' : 'o'}" data-act="us" data-id="${esc(x.ID)}" data-s="${s}">${s}</button>`).join('')}</div><small class="mono">Status Dibatalkan mengembalikan kuota tanggal kunjungan.</small>${isA() ? `<div class="ft"><button class="btn dg sm" data-act="hr" data-id="${esc(x.ID)}">Hapus</button></div>` : ''}`);
};
ACT.us = t => {
  if (!online()) return; const id = t.dataset.id, s = t.dataset.s, x = S.adm.daftar.find(r => r.ID === id), o = x.Status; x.Status = s; cm(); rReg(); toast('Status: ' + s, 'ok');
  POST('ubahStatus', { id: id, status: s }).then(() => refreshPub()).catch(e => { x.Status = o; if (S.adm) rReg(); fail(e); });
};
ACT.hr = t => {
  const id = t.dataset.id;
  conf('Hapus pendaftaran ini?', () => {
    if (!online()) return; const snap = JSON.stringify(S.adm.daftar); S.adm.daftar = S.adm.daftar.filter(r => r.ID !== id); rReg();
    POST('hapus', { tabel: 'Pendaftaran', id: id }).then(() => { toast('Dihapus', 'ok'); refreshPub(); }).catch(e => { S.adm.daftar = JSON.parse(snap); if (S.adm) rReg(); fail(e); });
  });
};

/* ── Pengaturan: tampilan, identitas, lisensi, profil, akun ── */
function rAkun() {
  const c = S.adm.cfg, l = lisNow();
  $('#v-a-akun').innerHTML = `<div class="card"><div class="hd"><h3>Tampilan</h3><div class="fl"><button class="btn o sm" data-act="tema"><i class="bi bi-circle-half"></i> Mode terang / gelap</button><button class="btn o sm" data-act="fmWarna"><i class="bi bi-palette"></i> Warna tema</button></div></div><small>Mode terang/gelap disimpan di perangkat ini. Warna tema berlaku untuk seluruh pengguna.</small></div>
<div class="card"><h3>Pengaturan Pendaftaran dan Identitas</h3><div class="fg" id="cfg">${[['KuotaHarian', 'Kuota harian pendaftaran (total seluruh layanan)', 'number'], ['Nama', 'Nama Puskesmas'], ['Hero', 'Judul beranda'], ['Alamat', 'Alamat'], ['Telepon', 'Telepon'], ['Jam', 'Jam operasional'], ['TahunBerdiri', 'Tahun berdiri']].map(x => `<label>${x[1]}<input name="${x[0]}" type="${x[2] || 'text'}" ${x[2] === 'number' ? 'min="1" max="5000"' : ''} value="${esc(c[x[0]] || '')}"></label>`).join('')}${fld('FotoHero', 'foto:Foto Puskesmas', 0, c.FotoHero || '')}${fld('LogoUrl', 'foto:Foto Puskesmas', 0, c.LogoUrl || '')}</div><div class="ft"><button class="btn" data-sv data-act="saveCfg" data-sel="#cfg">Simpan Pengaturan</button></div></div>
<div class="card lc"><div class="hd"><h3>Lisensi Aplikasi</h3><a class="btn o sm" href="#/aktivasi"><i class="bi bi-patch-check"></i> Aktivasi / perpanjang</a></div>${lisHTML(l)}<small>Dikembangkan dan dilisensikan oleh Arraihan Academy.</small></div>
${modHTML('profil')}<div style="height:16px"></div>${isDemo() ? '<div class="card em"><i class="bi bi-info-circle"></i><b>Pengelolaan akun dinonaktifkan pada akun demo</b><small>Aktifkan aplikasi untuk mengelola akun admin dan pegawai.</small></div>' : modHTML('akun')}`;
}
ACT.saveCfg = t => { sc(t.dataset.sel); if (t.dataset.close) cm(); if (t.dataset.after === 'wil') RA.wilayah(); if (t.dataset.after === 'dash') rDash(); };
function sc(sel) {
  const o = {}; $$(sel + ' [name]').forEach(e => o[e.name] = e.value.trim());
  if ('KuotaHarian' in o && !(+o.KuotaHarian >= 1 && +o.KuotaHarian <= 5000)) { toast('Kuota harian harus 1–5000.', 'err'); return; } if (!online()) return;
  mdlRst = null; const oa = Object.assign({}, S.adm.cfg), op = Object.assign({}, S.pub.cfg); Object.assign(S.adm.cfg, o); Object.assign(S.pub.cfg, o); renderPub(); applyBrand(S.adm.cfg.WarnaDashboard); toast('Menyimpan…');
  POST('simpanCfg', { cfg: o }).then(() => { toast('Tersimpan', 'ok'); refreshPub(); }).catch(x => { S.adm.cfg = oa; S.pub.cfg = op; renderPub(); applyBrand(oa.WarnaDashboard); if (S.view === 'a-akun') rAkun(); fail(x); });
}
function rWilAdm() {
  const A = S.adm, a = isA();
  $('#v-a-wilayah').innerHTML = `${a ? `<div class="card"><div class="hd"><h3>Peta Wilayah Kerja</h3><div class="fl"><button class="btn o sm" data-act="fmPeta"><i class="bi bi-image"></i> Edit Gambar Peta</button><button class="btn sm" data-act="fm" data-k="wilayah"><i class="bi bi-plus-lg"></i> Tambah Desa</button></div></div>${peta()}</div>` : ''}<div class="g3">${A.wilayah.map(x => { const l = A.layananDesa.filter(y => y.Desa === x.Nama); return `<div class="card"><b>${esc(x.Nama)}</b><small>${l.length} kegiatan</small><div class="kgl">${l.map(y => `<div class="kg">${y.FotoUrl ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(y.FotoUrl)}" alt="">` : ''}<b>${esc(y.Layanan)}</b></div>`).join('')}</div><button class="btn sm" data-act="tkd" data-d="${esc(x.Nama)}"><i class="bi bi-plus-lg"></i> Tambah Kegiatan</button></div>`; }).join('') || '<p class="em">Belum ada desa.</p>'}</div><div style="height:16px"></div>${modHTML('layananDesa')}${a ? `<div style="height:16px"></div>${modHTML('wilayah')}` : ''}`;
}
ACT.tkd = t => fm('layananDesa', '', { Desa: t.dataset.d });
ACT.fmPeta = () => { const c = S.adm.cfg; openModal(`<div class="hd"><h3>Edit Gambar Peta</h3><button class="ib" aria-label="Tutup" data-act="cm"><i class="bi bi-x-lg"></i></button></div><div class="fg" id="cfgp">${fld('FotoPeta', 'foto:Foto Puskesmas', 0, c.FotoPeta || '')}</div><small>Unggah gambar peta wilayah.</small><div class="ft"><button class="btn o" data-act="cm">Batal</button><button class="btn" data-sv data-act="saveCfg" data-sel="#cfgp" data-close="1" data-after="wil">Simpan</button></div>`); };
ACT.fmKepala = () => { const c = S.adm.cfg; openModal(`<div class="hd"><h3>Kepala Puskesmas</h3><button class="ib" aria-label="Tutup" data-act="cm"><i class="bi bi-x-lg"></i></button></div><div class="fg" id="cfgk"><label class="full">Nama<input name="NamaKepala" value="${esc(c.NamaKepala || '')}" placeholder="dr. Nama Lengkap"></label>${fld('FotoKepala', 'foto:Foto Puskesmas', 0, c.FotoKepala || '')}</div><div class="ft"><button class="btn o" data-act="cm">Batal</button><button class="btn" data-sv data-act="saveCfg" data-sel="#cfgk" data-close="1" data-after="dash">Simpan</button></div>`, 'sm'); };
const SW = ['#0A6B1A', '#0F766E', '#1D4ED8', '#6D28D9', '#9F1239', '#C2410C', '#334155'];
ACT.fmWarna = () => {
  const c = S.adm.cfg.WarnaDashboard || '#0A6B1A'; mdlRst = () => applyBrand(S.adm.cfg.WarnaDashboard);
  openModal(`<div class="hd"><h3>Warna Tema</h3><button class="ib" aria-label="Tutup" data-act="cm"><i class="bi bi-x-lg"></i></button></div><div id="cfgw"><label>Pilih warna<input type="color" name="WarnaDashboard" value="${esc(c)}" data-oi="warna"></label></div><div class="fl" style="margin:10px 0">${SW.map(w => `<button class="sw" style="background:${w}" aria-label="Warna ${w}" data-act="sw" data-w="${w}"></button>`).join('')}</div><small>Pilih warna sedang hingga gelap agar teks tetap terbaca. Pratinjau berlaku pada mode terang dan gelap.</small><div class="ft"><button class="btn o" data-act="cm">Batal</button><button class="btn" data-sv data-act="saveCfg" data-sel="#cfgw" data-close="1">Simpan</button></div>`, 'sm');
};
OI.warna = t => applyBrand(t.value);
ACT.sw = t => { $('#cfgw input').value = t.dataset.w; applyBrand(t.dataset.w); };
