# Panduan Instalasi — Puskesmas Digital v2.0

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**.
2. Ganti isi `Code.gs` dengan isi **Kode.gs**; rename file menjadi `Kode`.
3. Aktifkan manifest: ⚙️ Project Settings → centang *Show "appsscript.json"*, lalu tempel isi **appsscript.json**.
4. **Ganti `LIS_RAHASIA`** di Kode.gs dengan kalimat rahasia Anda sendiri (harus sama dengan `RAHASIA` di Aktivator.gs).
5. Pilih fungsi `setupAppEnvironment` → ▶ Run → beri izin. **Jalankan sekali.** Log menampilkan URL Spreadsheet, **ID Instalasi** (INS-XXXXXXXX), dan email admin awal.
6. Deploy → New deployment → Web app → *Execute as:* **Me**, *Who has access:* **Anyone** → Deploy → salin URL `/exec`.
7. Uji: buka `URL/exec?action=ping` → harus muncul JSON `{"success":true...}`; `?action=diag` untuk diagnosa.
> Setiap mengubah Kode.gs: Deploy → Manage deployments → ✏️ → *New version* → Deploy.

## B. Aktivator Lisensi (khusus vendor — Arraihan Academy)
1. Proyek Apps Script **terpisah** → tempel **Aktivator.gs**, samakan `RAHASIA` dengan `LIS_RAHASIA`.
2. Deploy Web app: *Execute as* Me, *Who has access* **Only myself**.
3. Pelanggan memberi **ID Instalasi** → isi nama, ID, paket → **Buat Kunci** → kirim kunci `ARA-...`.

## C. Frontend (GitHub Pages)
Folder hasil ekstraksi ZIP (`puskesmas-digital`) **adalah** folder yang di-`git init`; `index.html` harus langsung terlihat di dalamnya.
1. Edit `js/config.js`: isi `GAS_URL` dengan URL `/exec`; isi `KONTAK_LISENSI`.
2. Di terminal, masuk ke folder itu lalu pastikan `dir`/`ls` menampilkan `index.html`, `css`, `js`.
3. `git init` → `git add .` → `git commit -m "Upload pertama"` → `git branch -M main` → `git remote add origin https://github.com/USERNAME/NAMA-REPO.git` → `git push -u origin main` (password = Personal Access Token).
4. Repo → Settings → Pages → Branch `main` / root → Save → buka `https://USERNAME.github.io/NAMA-REPO/`.
5. Update: `git add .` → `git commit -m "update"` → `git push`.

## D. Cara kerja demo & aktivasi
- 7 hari pertama sejak setup: tombol **Masuk dengan Akun Demo** di halaman Masuk (tanpa email). Pita "Mode Demo · sisa N hari" tampil.
- Hari ke-8: login & pendaftaran online terkunci; halaman publik tetap terbaca; menu **Aktivasi** tetap terbuka.
- Aktivasi memakai kunci → akun demo otomatis nonaktif; login hanya via email terdaftar (kode OTP).
- Login email butuh kuota MailApp (±100/hari akun Gmail biasa).
- Keterbatasan: karena kode berjalan di akun Google pelanggan, pemilik skrip yang mahir bisa mengubah kode. Ini pencegah, bukan DRM mutlak; perkuat dengan kontrak lisensi (LICENSE.txt).
