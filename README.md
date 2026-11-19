# vibeS — Ruang Tenang

Web penenang universal. Bukan web ulang tahun, bukan kado untuk seseorang.
Siapa saja bisa masuk, duduk sebentar, dan merasa sedikit lebih lega.

## Yang ada di dalamnya

- **Beranda** — langit malam yang pelan: bintang berkelip, partikel cahaya
  melayang, dan cahaya yang mengembang seperti napas. Menghormati
  `prefers-reduced-motion`.
- **Musik** — cari lagu (YouTube atau Spotify), putar, dan simpan ke favorit.
  Favorit disimpan di browser sebagai metadata saja. Link audio tidak pernah
  disimpan, karena bisa kedaluwarsa, jadi audio selalu diminta ulang saat
  diputar. Kartu player ala tren foto Spotify: cover, judul, artis, progress
  bar, dan tombol putar.
- **Photo Book** — halaman ala polaroid dari foto pengguna sendiri. Foto
  tampil mengikuti rasio aslinya, tidak pernah di-crop. Kartu musik di atas
  halaman bisa digeser dengan mouse maupun sentuhan, supaya pengguna sendiri
  yang menaruhnya di tempat yang tidak menutupi subjek.
- **Teman** — pendamping suportif untuk saat hari terasa berat. Berjalan tanpa
  API AI eksternal: balasan berbasis pola kata, reflective listening, dan
  saran lembut (latihan napas, lagu favorit, foto favorit). Termasuk latihan
  napas terpandu (tarik 4, tahan 4, buang 6). Teman bukan terapis atau tenaga
  medis, dan itu tertulis jelas di halaman. Kalau pengguna mengungkapkan
  pikiran menyakiti diri, kartu bantuan krisis tampil menonjol: 119 ext 8
  (Healing119, Kemenkes, gratis, 24 jam) dan healing119.id.

## Menjalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build produksi
npm start       # jalankan hasil build
```

## Arsitektur

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Zustand.
- `app/api/music/route.ts` — route server yang memanggil API Delirius
  (tidak resmi) untuk mencari dan mengambil audio, sumber YouTube (default)
  atau Spotify. Route ini dipertahankan apa adanya.
- `lib/audio.ts` — satu elemen audio untuk seluruh aplikasi, jadi lagu terus
  berjalan saat pindah halaman.
- `store/musicStore.ts` — favorit, persisten di localStorage
  (`vibes:favorites:v1`).
- `lib/photos.ts` — foto disimpan di IndexedDB browser, dikecilkan dulu
  (sisi terpanjang 1600 px, JPEG 0.85).
- `lib/companion.ts` — mesin respons Teman (pola kata + deteksi krisis).
  Tidak ada data yang dikirim ke server, percakapan tidak disimpan.

## Batasan yang jujur

- **API musik tidak resmi.** Delirius bukan API resmi Spotify atau YouTube.
  Layanan ini bisa berubah atau mati sewaktu-waktu. Kalau pencarian gagal,
  aplikasi menampilkan pesan yang jelas, bukan diam.
- **Foto hanya ada di browser ini.** Tidak ada sinkronisasi antar perangkat,
  dan foto hilang kalau data situs dihapus.
- **Teman itu scripted, bukan AI sungguhan.** Balasannya dari pola kata yang
  sudah disiapkan. Untuk bantuan nyata, hubungi 119 ext 8 atau tenaga
  profesional.
- **Tidak ada akun.** Semua data tersimpan lokal di browser pengguna.
