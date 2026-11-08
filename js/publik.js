/* Puskesmas Digital — publik.js v2.0 • © Arraihan Academy
   Halaman publik, pendaftaran online, login (OTP / akun demo 7 hari), dan aktivasi lisensi. */
'use strict';
const hideLd = () => $('#ld').classList.add('off');
const lisNow = () => (S.adm && S.adm.lisensi) || (S.pub && S.pub.lisensi) || null;

/* ── Pemuatan data: tampilkan cache lokal seketika, perbarui di latar belakang ── */
async function initPub() {
  try { const c = JSON.parse(localStorage.getItem('pub_' + window.APP_VER) || 'null'); if (c && c.d) S.pub = c.d; } catch (e) { }
  if (S.pub) renderPub();
  route(); if (S.tok) loadAdm(false);
  if (S.pub) hideLd();
  await refreshPub(true); hideLd();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - S.lastPub > 180000) refreshPub(); });
  setInterval(() => { if (!document.hidden && navigator.onLine && Date.now() - S.lastPub > 300000) refreshPub(); }, 60000);
}
async function refreshPub(first) {
  try {
    const d = await GET('publik', { retry: first ? 2 : 1 }); S.pub = d; S.lastPub = Date.now();
    try { localStorage.setItem('pub_' + window.APP_VER, JSON.stringify({ d: d, t: Date.now() })); } catch (e) { }
    renderPub();
  } catch (e) {
    if (!S.pub) $('#v-beranda').innerHTML = `<div class="wrap"><div class="card em"><i class="bi bi-exclamation-triangle"></i><b>Data belum dapat dimuat</b><small>${esc(e.message)}</small><small class="mono">Versi ${esc(window.APP_VER)}</small><button class="btn" data-act="retry">Coba lagi</button></div></div>`;
    else if (first) toast('Menampilkan data tersimpan. ' + e.message, 'err');
  }
}
ACT.retry = async b => { busy(b, true, 'Memuat…'); await refreshPub(true); busy(b, false); };

function renderPub() {
  const d = S.pub; if (!d) return;
  applyBrand(d.cfg.WarnaDashboard);
  $('#lg0').innerHTML = LOGO() + '<span>Puskesmas Digital</span>';
  rBeranda(d); rJadwal(); rGaleri(d); rWil(d);
  const c = d.cfg;
  $('#ft').innerHTML = `<b>${esc(c.Nama)}</b><br><small>${esc(c.Alamat)} · ${esc(c.Telepon)}</small><br><small>${esc(c.Jam)}</small><br><span class="lic"><i class="bi bi-patch-check"></i> Aplikasi berlisensi Arraihan Academy</span><br><small>© ${new Date().getFullYear()} Arraihan Academy · <a href="#/aktivasi">Status lisensi</a> · <span class="mono">v${esc(window.APP_VER)}</span></small>`;
  if (S.view === 'daftar' && $('#v-daftar .sk')) rDaftar();
  renderLis(); if (S.adm && !S.adm.lisensi) S.adm.lisensi = d.lisensi;
}
/* Pita mode demo (publik) dan spanduk lisensi (panel admin) */
function renderLis() {
  const l = lisNow(), adm = document.body.classList.contains('adm'); let rb = $('#rb');
  if (l && l.mode === 'demo' && !adm && S.view !== 'aktivasi') { if (!rb) { rb = document.createElement('a'); rb.id = 'rb'; rb.className = 'rb'; rb.href = '#/aktivasi'; document.body.appendChild(rb); } rb.textContent = 'Mode Demo · sisa ' + l.sisa + ' hari'; rb.hidden = false; } else if (rb) rb.hidden = true;
  const b = $('#dmb'); if (!b) return; let t = '';
  if (l && l.mode === 'demo') t = `<i class="bi bi-hourglass-split"></i> Mode demo — sisa ${l.sisa} hari. <a href="#/aktivasi">Aktivasi sekarang</a>`;
  else if (l && l.mode === 'aktif' && l.sisa != null && l.sisa <= 30) t = `<i class="bi bi-exclamation-triangle"></i> Lisensi berakhir dalam ${l.sisa} hari. <a href="#/aktivasi">Perpanjang</a>`;
  b.innerHTML = t; b.hidden = !t;
}

/* ── Halaman publik ── */
function peta() {
  const u = S.pub && S.pub.cfg.FotoPeta, ed = S.adm && S.adm.sesi.peran === 'admin' && document.body.classList.contains('adm');
  return `<div class="map mi" role="img" aria-label="Peta wilayah kerja">${u ? `<img src="${esc(u)}" referrerpolicy="no-referrer" alt="Peta wilayah kerja">` : '<div class="ph"><span>[GAMBAR PETA]</span></div>'}${ed ? '<button class="btn sm pe" data-act="fmPeta"><i class="bi bi-pencil"></i> Edit Peta</button>' : ''}</div>`;
}
function rBeranda(d) {
  const c = d.cfg, pf = k => (d.profil.find(p => p.Jenis === k) || {}).Isi || '';
  $('#v-beranda').innerHTML = `<section class="wrap hero"><div><span class="tag">Fasilitas Kesehatan Tingkat Pertama (FKTP)</span><h1>${hl(c.Hero || '')}</h1><p class="mu">${esc(c.Nama)} melayani masyarakat dengan ramah dan profesional.</p><div class="fl"><a class="btn" href="#/daftar">Daftar Online</a><a class="btn o" href="#/jadwal">Lihat Jadwal Layanan</a></div></div>${c.FotoHero ? `<img class="hi" referrerpolicy="no-referrer" src="${esc(c.FotoHero)}" alt="${esc(c.Nama)}">` : '<div class="ph"><span>[FOTO PUSKESMAS]</span></div>'}</section>
<section class="wrap"><h2>Tentang Puskesmas</h2><div class="g3"><div class="card"><span class="tag">Visi</span><p>${esc(pf('Visi'))}</p></div><div class="card"><span class="tag">Misi</span><ol>${pf('Misi').split('\n').filter(Boolean).map(m => `<li>${esc(m)}</li>`).join('')}</ol></div><div class="card gt"><span class="tag">Moto</span><p class="q">“${esc(pf('Moto'))}”</p></div></div></section>
<section class="wrap"><h2>PJ Klaster</h2><div class="g5 sc">${(d.klaster || []).map(p => `<div class="card tc pk">${p.LogoUrl ? `<img class="kl" loading="lazy" referrerpolicy="no-referrer" src="${esc(p.LogoUrl)}" alt="Logo ${esc(p.Klaster)}">` : ''}<span class="tag">${esc(p.Klaster)}</span>${av(p.FotoUrl, p.Nama)}<b>${esc(p.Nama)}</b><small>${esc(p.Jabatan)}</small></div>`).join('') || '<p class="em">Belum ada data.</p>'}</div></section>
<section class="wrap"><h2>Layanan melalui Daftar Online</h2><div class="g3 sc">${d.jadwal.map(j => `<div class="card"><i class="bi bi-heart-pulse"></i><b>${esc(j.Layanan)}</b><small>${esc(j.Lokasi)}</small><small class="mono">${esc(j.JamMulai)} – ${esc(j.JamSelesai)}</small></div>`).join('')}</div></section>
<section class="cta"><div class="wrap"><h2>Daftarkan Kunjungan Anda Secara Online</h2><p>Ambil nomor antrean dari rumah tanpa antre panjang di loket.</p><a class="btn w2" href="#/daftar">Daftar Online</a></div></section>
<section class="wrap"><h2>Wilayah Kerja</h2><div class="g2">${peta()}<div class="card"><b>Alamat</b><p>${esc(c.Alamat)}</p><b>Telepon</b><p>${esc(c.Telepon)}</p><b>Jam operasional</b><p>${esc(c.Jam)}</p></div></div></section>`;
}
function rJadwal() {
  const e = $('#v-jadwal'); if (!$('#lj'))
    e.innerHTML = `<div class="wrap"><div class="hd"><div><h1 class="h1s">Jadwal Layanan Puskesmas</h1><p class="mu">Jam operasional poli dan layanan.</p></div><div class="al in" id="kq"></div></div><div class="card fl" style="flex-direction:row"><select id="hj" data-oi="fj" aria-label="Hari"><option value="">Semua hari</option>${HR.slice(1).map(h => `<option>${h}</option>`).join('')}</select><input id="qj" data-oi="fj" placeholder="Cari layanan atau penanggung jawab" aria-label="Cari"></div><div id="lj" style="margin-top:12px"></div></div>`;
  fJ();
}
OI.fj = () => fJ();
function fJ() {
  const d = S.pub, h = $('#hj').value, q = $('#qj').value.toLowerCase(), k = +d.cfg.KuotaHarian || 100, s = k - (d.terpakai[wib(new Date())] || 0);
  $('#kq').innerHTML = `Sisa kuota hari ini: <b class="mono">${Math.max(0, s)}</b> dari ${k} <a class="btn sm" href="#/daftar">Daftar Online</a>`;
  const r = d.jadwal.filter(j => (!h || j.Hari.includes(h)) && (!q || (j.Layanan + ' ' + j.PJ).toLowerCase().includes(q)));
  $('#lj').innerHTML = r.length ? `<div class="tw card"><table><thead><tr><th>Layanan</th><th>Hari</th><th>Jam</th><th>Lokasi</th><th>Penanggung Jawab</th><th>Status</th></tr></thead><tbody>${r.map(j => `<tr><td data-l="Layanan"><b>${esc(j.Layanan)}</b></td><td data-l="Hari">${j.Hari.split(',').map(x => `<span class="pl ok">${esc(x.trim().slice(0, 3))}</span>`).join(' ')}</td><td data-l="Jam" class="mono">${esc(j.JamMulai)} – ${esc(j.JamSelesai)}</td><td data-l="Lokasi">${esc(j.Lokasi)}</td><td data-l="PJ">${esc(j.PJ)}</td><td data-l="Status">${pill(j.Status)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="card em"><i class="bi bi-calendar-x"></i><b>Tidak ada jadwal yang sesuai</b><button class="btn o" data-act="rj">Reset Filter</button></div>`;
}
ACT.rj = () => { $('#hj').value = ''; $('#qj').value = ''; fJ(); };
function vsrc(u) {
  u = String(u || '').trim(); if (!/^https?:\/\//i.test(u)) return null;
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/); if (m) return { s: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1', p: 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg' };
  m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/); if (m) return { s: 'https://drive.google.com/file/d/' + m[1] + '/preview', p: '' }; return { s: '', p: '', l: u };
}
ACT.pv = b => { b.outerHTML = `<div class="vd"><iframe allow="autoplay;fullscreen" allowfullscreen title="Video kegiatan" src="${esc(b.dataset.s)}"></iframe></div>`; };
function media(k) {
  const v = vsrc(k.VideoUrl), im = k.FotoUrl ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(k.FotoUrl)}" alt="${esc(k.Nama)}">` : '<div class="ph"><span>[FOTO DOKUMENTASI]</span></div>';
  if (!v) return im;
  if (v.s) { const po = k.FotoUrl || v.p; return `<button class="vp" aria-label="Putar video" data-act="pv" data-s="${esc(v.s)}"${po ? ` style="background-image:url('${esc(po)}')"` : ''}><i class="bi bi-play-circle-fill"></i></button>`; }
  return im + `<a class="btn o sm vl" target="_blank" rel="noopener" href="${esc(v.l)}"><i class="bi bi-play-circle"></i> Tonton video</a>`;
}
function rGaleri(d) { $('#v-galeri').innerHTML = `<div class="wrap"><h1 class="h1s">Galeri</h1><p class="mu">Foto dan video kegiatan.</p><div class="g3">${(d.galeri || []).map(k => `<article class="card gc">${media(k)}<div class="cb"><b>${esc(k.Nama)}</b></div></article>`).join('') || '<p class="em">Belum ada isi galeri.</p>'}</div></div>`; }
const ldHTML = (d, n) => { const l = (d.layananDesa || []).filter(y => y.Desa === n); return l.length ? `<h4 class="sh">Kegiatan</h4><div class="kgl">${l.map(y => `<div class="kg">${y.FotoUrl ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(y.FotoUrl)}" alt="${esc(y.Layanan)}">` : ''}<b>${esc(y.Layanan)}</b><small>${[y.Hari, y.JamMulai ? y.JamMulai + '–' + y.JamSelesai : '', y.Lokasi].filter(Boolean).map(esc).join(' · ')}</small></div>`).join('')}</div>` : '<small>Belum ada kegiatan.</small>'; };
function rWil(d) { $('#v-wilayah').innerHTML = `<div class="wrap"><h1 class="h1s">Wilayah Kerja Puskesmas</h1><p class="mu">${esc(d.cfg.Nama)}.</p>${peta()}<div class="g3 st">${d.wilayah.map(w => `<div class="card"><b>${esc(w.Nama)}</b><small>${esc(w.Desa)}</small><p>${esc(w.Keterangan)}</p>${ldHTML(d, w.Nama)}</div>`).join('')}</div></div>`; }

/* ── Pendaftaran online (3 langkah + tiket) ── */
function rDaftar() {
  const e = $('#v-daftar'), d = S.pub, f = S.f, st = S.step; if (!d) { e.innerHTML = '<div class="wrap"><div class="sk"></div></div>'; return; }
  const l = d.lisensi;
  if (l && l.mode === 'habis') { e.innerHTML = `<div class="wrap nrw"><div class="card em"><i class="bi bi-lock"></i><b>Pendaftaran online sedang tidak tersedia</b><small>Silakan datang langsung ke loket pendaftaran atau hubungi Puskesmas.</small><a class="btn o" href="#/beranda">Kembali ke Beranda</a></div></div>`; return; }
  if (st === 4) {
    const t = S.tk;
    e.innerHTML = `<div class="wrap"><div class="card tk"><div class="ok0"><i class="bi bi-check-lg"></i></div><h2>Pendaftaran Berhasil</h2><p class="mu">Simpan atau cetak bukti ini.</p><div class="qn"><small>Nomor Antrean</small><b class="mono">${esc(t.NoAntrean)}</b></div><dl class="dl">${[['Nomor pendaftaran', t.ID], ['Nama', t.Nama], ['Layanan', t.Layanan], ['Tanggal kunjungan', tgl(t.TglKunjungan)], ['Jam pelayanan', t.Jam], ['Lokasi', t.Lokasi]].map(x => `<dt>${x[0]}</dt><dd>${esc(x[1])}</dd>`).join('')}</dl><div class="al in">Harap datang 30 menit sebelum jam pelayanan dan bawa kartu identitas.</div><div class="fl noprint"><button class="btn o" data-act="cetak"><i class="bi bi-printer"></i> Cetak Bukti</button><button class="btn" data-act="selesaiDaftar">Kembali ke Beranda</button></div></div></div>`; return;
  }
  const bar = `<ol class="steps">${['Data Pasien', 'Layanan dan Tanggal', 'Konfirmasi'].map((n, i) => `<li class="${st > i + 1 ? 'dn' : st === i + 1 ? 'cur' : ''}"><i>${st > i + 1 ? '<i class="bi bi-check-lg"></i>' : i + 1}</i><span>${n}</span></li>`).join('')}</ol>`; let b;
  if (st === 1) b = `<div class="fg">${[['NIK', 'NIK (16 digit)', 'text'], ['Nama', 'Nama lengkap', 'text'], ['TglLahir', 'Tanggal lahir', 'date'], ['NoHP', 'Nomor HP / WhatsApp', 'tel'], ['NoBPJS', 'Nomor BPJS (opsional)', 'text']].map(x => `<label>${x[1]}<input ${x[0] === 'NIK' ? 'class="mono" inputmode="numeric" maxlength="16" autocomplete="off"' : ''} ${x[0] === 'TglLahir' ? `max="${wib(new Date())}"` : ''} ${x[0] === 'Nama' ? 'autocomplete="name"' : ''} ${x[0] === 'NoHP' ? 'autocomplete="tel" inputmode="tel"' : ''} type="${x[2]}" value="${esc(f[x[0]])}" data-f="${x[0]}"></label>`).join('')}<label>Jenis kelamin<select data-f="JK"><option value="">Pilih</option>${['Laki-laki', 'Perempuan'].map(o => `<option ${f.JK === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label><label class="full">Alamat<textarea rows="2" data-f="Alamat" autocomplete="street-address">${esc(f.Alamat)}</textarea></label><label class="hp" aria-hidden="true">Website<input tabindex="-1" autocomplete="off" data-f="website"></label></div>`;
  else if (st === 2) {
    const L = [...new Set(d.jadwal.map(j => j.Layanan))], k = +d.cfg.KuotaHarian || 100, j = d.jadwal.find(x => x.Layanan === f.Layanan);
    b = `<h3>Pilih layanan</h3><div class="g3">${L.map(x => `<button type="button" class="card sel ${f.Layanan === x ? 'on' : ''}" data-act="pilL" data-l="${esc(x)}"><b>${esc(x)}</b></button>`).join('')}</div>`;
    if (j) b += `<h3 style="margin-top:14px">Pilih tanggal</h3><div class="dc">${[...Array(14)].map((_, i) => wib(new Date(Date.now() + i * 864e5))).map(y => { const o = j.Hari.includes(dn(y)), s = k - (d.terpakai[y] || 0), x = !o || s <= 0; return `<button type="button" class="chip ${f.TglKunjungan === y ? 'on' : ''}" ${x ? 'disabled' : ''} data-act="pilT" data-t="${y}"><b>${dn(y).slice(0, 3)} ${+y.slice(8)}</b><small>${!o ? 'Libur' : s <= 0 ? 'Penuh' : 'Sisa ' + s}</small></button>`; }).join('')}</div>`;
  } else b = `<dl class="dl">${[['NIK', f.NIK], ['Nama', f.Nama], ['Tanggal lahir', tgl(f.TglLahir)], ['Jenis kelamin', f.JK], ['Alamat', f.Alamat], ['Nomor HP', f.NoHP], ['Nomor BPJS', f.NoBPJS || '-'], ['Layanan', f.Layanan], ['Kunjungan', tgl(f.TglKunjungan)]].map(x => `<dt>${x[0]}</dt><dd>${esc(x[1])}</dd>`).join('')}</dl><label class="ck"><input type="checkbox" id="oke"> Saya menyatakan data yang diisi sudah benar.</label><div id="er"></div>`;
  e.innerHTML = `<div class="wrap nrw"><h1 class="h1s">Daftar Kunjungan Online</h1><p class="mu">Tidak perlu login. Siapkan NIK dan nomor HP aktif.</p>${bar}<div class="card">${b}</div><div class="fl bt">${st > 1 ? '<button class="btn o" data-act="prev">Kembali</button>' : '<span></span>'}${st < 3 ? '<button class="btn" data-act="next">Lanjut</button>' : '<button class="btn" id="sb" data-act="kirim">Kirim Pendaftaran</button>'}</div></div>`;
}
ACT.pilL = t => { S.f.Layanan = t.dataset.l; S.f.TglKunjungan = ''; rDaftar(); };
ACT.pilT = t => { S.f.TglKunjungan = t.dataset.t; rDaftar(); };
ACT.prev = () => { S.step--; rDaftar(); scrollTo(0, 0); };
ACT.cetak = () => window.print();
ACT.selesaiDaftar = () => { S.step = 1; S.f = {}; S.rid = ''; go('beranda'); };
ACT.next = () => {
  const f = S.f, m = (c, t) => { if (!c) { toast(t, 'err'); return 1; } };
  if (S.step === 1) { if (m(/^\d{16}$/.test(f.NIK || ''), 'NIK harus 16 digit angka.') || m((f.Nama || '').trim().length > 2, 'Isi nama lengkap.') || m(f.TglLahir, 'Isi tanggal lahir.') || m(f.JK, 'Pilih jenis kelamin.') || m((f.Alamat || '').trim(), 'Isi alamat.') || m(/^\+?\d{9,15}$/.test((f.NoHP || '').replace(/[\s-]/g, '')), 'Nomor HP tidak valid.')) return; }
  else if (S.step === 2) { if (m(f.Layanan, 'Pilih layanan.') || m(f.TglKunjungan, 'Pilih tanggal kunjungan.')) return; }
  S.step++; rDaftar(); scrollTo(0, 0);
};
ACT.kirim = async b => {
  if (!$('#oke').checked) { toast('Centang pernyataan terlebih dahulu.', 'err'); return; }
  if (!navigator.onLine) { $('#er').innerHTML = '<div class="al er"><i class="bi bi-wifi-off"></i> Anda sedang offline. Sambungkan internet lalu coba lagi.</div>'; return; }
  busy(b, true, 'Mengirim…'); $('#er').innerHTML = '';
  const sg = JSON.stringify(S.f); if (S.ridSig !== sg) { S.rid = uid(); S.ridSig = sg; }       // kunci idempoten: kirim ulang tidak membuat data ganda
  try {
    S.tk = await POST('daftarOnline', { data: Object.assign({}, S.f, { rid: S.rid, _t: S.t0 }) }, { retry: 2, timeout: 60000 });
    const t = S.pub.terpakai; t[S.f.TglKunjungan] = (t[S.f.TglKunjungan] || 0) + 1; S.step = 4; rDaftar(); scrollTo(0, 0); refreshPub();
  } catch (x) { busy(b, false); if (x.handled) return; $('#er').innerHTML = `<div class="al er"><i class="bi bi-exclamation-triangle"></i> ${esc(x.message)} <a href="#/daftar" data-act="pilihLagi">Pilih tanggal lain</a></div>`; }
};
ACT.pilihLagi = (t, e) => { e.preventDefault(); S.step = 2; rDaftar(); };

/* ── Login: OTP email atau akun demo (7 hari) ── */
function rLogin() {
  const l = lisNow(), habis = l && l.mode === 'habis', demo = l && l.mode === 'demo';
  $('#v-login').innerHTML = `<div class="lg card"><div class="logo">${LOGO()}</div><h2 style="text-align:center">Masuk ke Sistem Manajemen</h2><p class="mu" style="text-align:center">Portal khusus Admin dan Pegawai Puskesmas terdaftar</p>
${habis ? `<div class="al er"><i class="bi bi-lock"></i> Masa demo / lisensi telah berakhir. <a href="#/aktivasi">Aktivasi aplikasi</a></div>` : `<div class="al in">${S.lg === 'kode' ? 'Kode 6 digit telah dikirim ke <b>' + esc(S.em) + '</b>. Periksa juga folder spam.' : 'Masukkan email yang sudah didaftarkan admin. Kami kirimkan kode masuk 6 digit.'}</div><div id="le"></div>
${S.lg === 'email' ? `<label>Email<input id="em" type="email" autocomplete="email" inputmode="email" data-enter="mulai" value="${esc(S.em)}" placeholder="nama@gmail.com"></label><button class="btn w" id="lb" data-act="mulai">Kirim Kode Masuk</button>` : `<label>Kode verifikasi<input id="kd" class="mono" inputmode="numeric" maxlength="6" autocomplete="one-time-code" data-enter="verif" placeholder="000000"></label><button class="btn w" id="lb" data-act="verif">Verifikasi dan Masuk</button><button class="btn g w" data-act="ulang">Kirim ulang kode</button><button class="btn g w" data-act="gantiEmail">Ganti email</button>`}
${demo ? `<div class="al wn" style="margin-top:14px"><i class="bi bi-stars"></i> Mode demo aktif — sisa <b>${l.sisa} hari</b>.</div><button class="btn o w" data-act="demo"><i class="bi bi-person-badge"></i> Masuk dengan Akun Demo</button>` : ''}`}
<a class="tl" href="#/beranda">Kembali ke Beranda</a></div>`;
}
const lerr = m => { $('#le').innerHTML = '<div class="al er"><i class="bi bi-exclamation-circle"></i> ' + esc(m) + '</div>'; };
ACT.mulai = async b => {
  const em = ($('#em') || {}).value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(em)) { lerr('Masukkan email yang valid.'); return; }
  S.em = em; busy(b, true, 'Mengirim…');
  try { await POST('mulaiLogin', { email: em }); S.lg = 'kode'; S.kirimAt = Date.now(); rLogin(); const k = $('#kd'); if (k) k.focus(); } catch (x) { busy(b, false); if (!x.handled) lerr(x.message); }
};
ACT.ulang = async () => { if (Date.now() - (S.kirimAt || 0) < 45000) { toast('Tunggu sebentar sebelum meminta kode lagi.', 'err'); return; } try { await POST('mulaiLogin', { email: S.em }); S.kirimAt = Date.now(); toast('Kode baru dikirim.', 'ok'); } catch (x) { fail(x); } };
ACT.gantiEmail = () => { S.lg = 'email'; rLogin(); };
ACT.verif = async b => {
  const k = ($('#kd') || {}).value.trim(); if (!/^\d{6}$/.test(k)) { lerr('Masukkan kode 6 digit.'); return; }
  busy(b, true, 'Memeriksa…'); try { await masuk(await POST('verifikasiKode', { email: S.em, kode: k })); } catch (x) { busy(b, false); if (!x.handled) lerr(x.message); }
};
ACT.demo = async b => { busy(b, true, 'Menyiapkan demo…'); try { await masuk(await POST('masukDemo', {})); } catch (x) { busy(b, false); if (!x.handled) lerr(x.message); } };
async function masuk(r) { S.tok = r.token; S.lg = 'email'; try { sessionStorage.setItem('tok', r.token); } catch (e) { } await loadAdm(true); }

/* ── Aktivasi lisensi (publik: bisa dibuka walau masa demo sudah habis) ── */
function lisHTML(l) {
  if (!l) return '<div class="sk" style="height:120px"></div>';
  const row = (a, b) => `<div class="row"><span class="mu">${a}</span><b>${b}</b></div>`;
  const st = l.mode === 'aktif' ? '<span class="pl ok">Aktif</span>' : l.mode === 'demo' ? '<span class="pl wt">Mode Demo</span>' : '<span class="pl er">Berakhir</span>';
  return row('Status', st) + (l.mode === 'aktif' ? row('Paket', esc(l.planNama)) + row('Berlaku sampai', l.exp ? tgl(l.exp) + ' (sisa ' + l.sisa + ' hari)' : 'Seumur hidup') : l.mode === 'demo' ? row('Sisa masa demo', l.sisa + ' dari ' + l.trialHari + ' hari') : row('Masa demo', 'Telah berakhir')) +
    (l.kunciGagal ? `<div class="al er" style="margin:6px 0 0">${esc(l.kunciGagal)}</div>` : '') +
    `<div class="row"><span class="mu">ID Instalasi</span><span class="cp"><b class="kunci" id="iid">${esc(l.inst)}</b><button class="btn o sm" data-act="salinId"><i class="bi bi-clipboard"></i> Salin</button></span></div>`;
}
function rAktivasi() {
  const l = lisNow(), k = window.KONTAK_LISENSI || {}, wa = k.wa ? `<a class="btn o sm" target="_blank" rel="noopener" href="https://wa.me/${esc(k.wa)}?text=${encodeURIComponent('Halo ' + (k.nama || '') + ', saya ingin aktivasi Puskesmas Digital. ID Instalasi: ' + (l ? l.inst : ''))}"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : '', em = k.email ? `<a class="btn o sm" href="mailto:${esc(k.email)}"><i class="bi bi-envelope"></i> Email</a>` : '', web = k.web ? `<a class="btn o sm" target="_blank" rel="noopener" href="${esc(k.web)}"><i class="bi bi-globe"></i> Situs</a>` : '';
  $('#v-aktivasi').innerHTML = `<div class="wrap nrw"><h1 class="h1s">Aktivasi Lisensi</h1><p class="mu">Aplikasi ini dikembangkan dan dilisensikan oleh <b>${esc(k.nama || 'Arraihan Academy')}</b>.</p>
<div class="card lc" id="lstat">${lisHTML(l)}</div>
<div class="card" style="margin-top:16px"><h3>Masukkan kunci aktivasi</h3><div id="ae"></div><label>Kunci aktivasi<input id="ak" class="kunci" data-oi="kunci" data-enter="aktifkan" placeholder="ARA-TH-261231-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><button class="btn w" data-act="aktifkan"><i class="bi bi-patch-check"></i> Aktifkan</button></div>
<div class="card" style="margin-top:16px"><h3>Cara mendapatkan kunci</h3><ol><li>Salin <b>ID Instalasi</b> di atas.</li><li>Kirim ke ${esc(k.nama || 'Arraihan Academy')} beserta nama instansi Anda.</li><li>Tempel kunci yang Anda terima, lalu tekan <b>Aktifkan</b>.</li></ol>${wa || em || web ? `<div class="fl">${wa}${em}${web}</div>` : '<small>Isi kontak penerbit lisensi pada js/config.js agar tombol hubungi muncul di sini.</small>'}</div>
<a class="btn g" href="#/beranda" style="margin-top:8px">Kembali ke Beranda</a></div>`;
  GET('lisensi', { retry: 1 }).then(x => { if (S.pub) S.pub.lisensi = x; if (S.adm) S.adm.lisensi = x; const e = $('#lstat'); if (e) e.innerHTML = lisHTML(x); renderLis(); }).catch(() => { });
}
OI.kunci = t => { t.value = t.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); };
ACT.salinId = async () => { await salin($('#iid').textContent); toast('ID Instalasi disalin.', 'ok'); };
ACT.aktifkan = async () => {
  const k = ($('#ak') || {}).value.trim(); if (!k) { $('#ae').innerHTML = '<div class="al er">Masukkan kunci aktivasi.</div>'; return; }
  const b = $('[data-act=aktifkan]'); busy(b, true, 'Memeriksa…');
  try { const r = await POST('aktivasi', { kunci: k }); if (S.pub) S.pub.lisensi = r; if (S.adm) S.adm.lisensi = r; renderPub(); rAktivasi(); $('#ae').innerHTML = '<div class="al okk"><i class="bi bi-check-circle"></i> Aktivasi berhasil. Terima kasih!</div>'; toast('Aktivasi berhasil.', 'ok'); }
  catch (x) { busy(b, false); if (!x.handled) $('#ae').innerHTML = '<div class="al er"><i class="bi bi-exclamation-circle"></i> ' + esc(x.message) + '</div>'; }
};
