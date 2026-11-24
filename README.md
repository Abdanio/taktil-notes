<div align="center">

# 🖋️ Taktil Notes
### *Bespoke, Local-First Desktop Notes Application for Craftspersons*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-34.x-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

<p align="center">
  Aplikasi catatan desktop lokal (<em>local-first</em>) berkinerja native tinggi dengan visual yang halus, bebas dari pola desain generik ("AI slop"), dan responsif terhadap sentuhan serta pendengaran Anda.
</p>

[Fitur Utama](#-fitur-utama) •
[Manifesto Desain](#-manifesto-desain-anti-ai-slop) •
[Teknologi](#-arsitektur--teknologi) •
[Instalasi](#-instalasi--menjalankan) •
[Pintasan Keyboard](#-pintasan-keyboard) •
[Panduan Kontribusi](#-panduan-berkontribusi)

</div>

---

## 💡 Filosofi & Nama: Mengapa "Taktil"?

Kata **Taktil** (*Tactile*) berakar dari kemampuan indra peraba dalam merasakan tekstur fisik, bobot, dan getaran nyata dari sebuah objek. 

Di era di mana sebagian besar perangkat lunak catatan modern terasa dingin, datar, berbasis cloud lambat, dan penuh dengan pola antarmuka generik buatan AI yang tidak berkarakter, **Taktil Notes** diciptakan untuk mengembalikan kehangatan kertas fisik:
- **Kenyamanan Visual**: Gradien hangat kertas Alabaster dengan tekstur fraktal mikro.
- **Umpan Balik Taktil**: Fisika pegas (*spring physics*) nyata saat menyeret kartu catatan.
- **Umpan Balik Auditori**: Lonceng akustik marimba yang disintesis langsung melalui Web Audio API tanpa berkas rekaman eksternal.
- **Kedaulatan Data**: Semua catatan tersimpan secara lokal dan atomik di perangkat Anda.

---

## ✨ Fitur Utama

### 1. 🗂️ Ruang Kerja Asimetris 3 Kolom
- **Kolom 1 — Sidebar (210px)**: Area drag jendela frameless, filter cepat (*Semua Catatan*, *Disematkan*, *Sampah*), folder berwarna dengan indikator jumlah, tombol pengalih jenis huruf, pengalih tema, serta akses ke panduan.
- **Kolom 2 — Indeks Catatan (270px)**: Pencarian teks instan, tombol pembuatan cepat (*split-button* dengan pemilih ikon langsung), menu titik tiga (`...`) pada kartu, serta kartu catatan bersudut `rounded-xl`.
- **Kolom 3 — Kanvas Menulis Bebas Distraksi (1fr)**: Area penulisan selebar `max-w-[68ch]` yang ergonomis untuk kenyamanan membaca jangka panjang.

### 2. ⚡ Interaksi Taktil & Fisika Animasi
- **Living Checklists**: Kotak centang `- [ ]` / `- [x]` interaktif memicu micro-bounce (`scale: [0.85, 1.2, 1]`) dan garis coret teks (*strikethrough*) yang bergerak mulus dari kiri ke kanan selama `200ms`.
- **Drag & Drop Berbobot (`@dnd-kit`)**: Kartu catatan yang ditarik memiliki elevasi `<DragOverlay>` dengan `scale: 1.03`, kemiringan `-1.5deg`, dan bayangan berlapis `shadow-2xl`. Settle drop diredam dengan fisika pegas (`stiffness: 450, damping: 28`).
- **Target Folder Magnetik**: Mengarahkan catatan ke atas folder memicu pembesaran folder (`scale: 1.08`) dan mengubah ikon ke bobot `duotone`.
- **Status Kosong Berparalaks (Parallax Empty State)**: Tumpukan lembaran kertas 3D SVG bergeser dan miring merespons pergerakan kursor mouse saat suatu folder kosong.

### 3. 🔔 Pengingat Desktop Native & Sintesis Suara Lonceng
- **Web Audio Chime**: Menggunakan osilator harmonik untuk memainkan akor marimba nada C5-C6 yang menenangkan saat pengingat berbunyi.
- **Integrasi OS Native**: Menggunakan Electron `Notification` API yang dipadukan dengan `app.setAppUserModelId` sehingga notifikasi diproses langsung oleh pusat notifikasi Windows/macOS. Mengklik notifikasi akan mengembalikan fokus jendela dan membuka catatan terkait.

### 4. 🖼️ Penanganan Berkas & Protokol Aman `note-asset://`
- **Jatuhkan File dari OS (Drag & Drop)**: Jatuhkan berkas gambar (`.png`, `.jpg`, `.jpeg`, `.webp`) atau dokumen (`.md`, `.txt`) dari file explorer ke kanvas.
- **Protokol Privileged**: Gambar disimpan secara lokal ke direktori aman `userData/assets/` dan dirender menggunakan skema protokol khusus `note-asset://filename.ext` yang kebal terhadap pembatasan CSP.

### 5. 📖 Panduan Sintaksis Markdown Bawaan
- Modal panduan interaktif yang memuat format Heading, Checklist, Penekanan Teks, Blok Kode, Kutipan, Tautan, dan Garis Pembatas.
- Dilengkapi tombol **"Salin"** dan tombol **"Sisipkan"** untuk langsung menyuntikkan template sintaks ke catatan aktif.

### 6. 🎨 Ikon Catatan Kustom (*Bebas AI Slop*)
- Menghilangkan pola klise garis strip warna di sisi kiri kartu catatan.
- Menggantikannya dengan lencana ikon yang dapat diubah sesuai topik catatan (*Ide Baru, Riset, Koding, Bacaan, Kopi, Target, Proyek, dll.*) melalui modal pemilih ikon.

---

## 🎨 Manifesto Desain (Anti-AI-Slop)

| Prinsip | Yang Dihindari (AI Slop) | Pendekatan Taktil Notes |
| :--- | :--- | :--- |
| **Tipografi** | Inter, Roboto, atau font sistem standar tanpa hierarki | `'Fraunces'` (Headings editorial), `'Plus Jakarta Sans'` (Body UI), `'JetBrains Mono'` (Tabular Code) |
| **Warna Latar** | `#FFFFFF` silau atau `#000000` hitam pekat | *Warm Paper* (`#F8F6F1` + tekstur fractal noise `2.5%`) & *Matte Obsidian* (`#181715`) |
| **Gradien** | Gradien ungu/biru generik SaaS | Warna aksen bumi: *Terracotta Orange* (`#D95D39`) & *Soft Coral* (`#E07A5F`) |
| **Sentuhan** | Kotak datar kaku tanpa umpan balik fisik | Elevasi berlapis, fisika pegas, dan respons audio Web Audio API |

---

## 🛠️ Arsitektur & Teknologi

```
desktop-notes-app/
├── src/
│   ├── main/
│   │   └── index.ts          # Proses Utama Electron (IPC, Window, Protocol, Atomic Storage)
│   ├── preload/
│   │   ├── index.ts          # Bridge Aman contextBridge (IPC Client)
│   │   └── index.d.ts        # Definisi Tipe window.electronAPI
│   └── renderer/
│       ├── index.html        # HTML Root dengan Google Fonts (Fraunces, Jakarta Sans, JetBrains)
│       └── src/
│           ├── components/   # Komponen UI (Sidebar, NoteList, Editor, Modals)
│           │   ├── Editor.tsx
│           │   ├── NoteList.tsx
│           │   ├── NoteCard.tsx
│           │   ├── Sidebar.tsx
│           │   ├── MarkdownGuideModal.tsx
│           │   ├── NoteIconPicker.tsx
│           │   ├── CommandPalette.tsx
│           │   └── ShortcutsModal.tsx
│           ├── context/      # NotesContext & State Store Atomik
│           ├── lib/          # Utilitas Format Tanggal, Suara Akustik, dan Tur driver.js
│           ├── types/        # Definisi Tipe Data Renderer
│           ├── globals.css   # Variabel Tema & Tekstur Kertas
│           └── main.tsx      # Entrypoint React 18
├── electron.vite.config.ts   # Konfigurasi Build Multi-Target
├── tailwind.config.ts        # Konfigurasi Desain & Token Warna
└── package.json
```

---

## 🚀 Instalasi & Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) versi `18.x` atau lebih baru (`v24.x` direkomendasikan).
- Manajer paket `npm` (atau `pnpm` / `yarn`).
- Git terpasang di sistem operasi Anda.

### 1. Kloning Repositori
```bash
git clone https://github.com/username-anda/taktil-notes.git
cd taktil-notes
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Jalankan Mode Pengembang (Hot-Reload)
```bash
npm run dev
```
Aplikasi Electron akan otomatis terbuka dengan Vite Hot Module Replacement (HMR).

### 4. Pemeriksaan Tipe Data (Typecheck)
```bash
npm run typecheck
```

### 5. Kompilasi Bundel Produksi
```bash
npm run build
```

### 6. Memaketkan Installer Desktop (Distribusi)
- **Windows (Portable / NSIS)**:
  ```bash
  npm run build:win
  ```
- **macOS (DMG / Zip)**:
  ```bash
  npm run build:mac
  ```
- **Linux (AppImage / Deb)**:
  ```bash
  npm run build:linux
  ```

---

## ⌨️ Pintasan Keyboard

Aplikasi ini dirancang untuk navigasi cepat tanpa perlu mengangkat tangan dari keyboard:

| Pintasan | Aksi |
| :--- | :--- |
| `Ctrl / Cmd + N` | Membuat catatan baru secara instan |
| `Ctrl / Cmd + K` | Membuka Palet Perintah Cepat (*Command Palette*) |
| `Ctrl / Cmd + M` | Membuka Panduan Sintaksis Markdown |
| `Ctrl / Cmd + B` | Menyembunyikan / Menampilkan Sidebar |
| `Ctrl / Cmd + /` | Membuka Lembar Contekan Pintasan Keyboard (3D Keycaps) |
| `Ctrl / Cmd + P` | Menyematkan (*Pin*) / Melepas Sematan Catatan Aktif |
| `Ctrl / Cmd + Backspace` | Memindahkan catatan aktif ke folder Sampah |
| `Ctrl / Cmd + Shift + T` | Mengalihkan tema (*Warm Paper* $\leftrightarrow$ *Matte Obsidian*) |
| `Ctrl / Cmd + Shift + F` | Mengganti mode tipografi (*Editorial* $\rightarrow$ *Sans* $\rightarrow$ *Mono*) |
| `F11` / Tombol Toolbar | Beralih ke Mode Layar Penuh (*Fullscreen*) |

---

## 🤝 Panduan Berkontribusi

Kami sangat menyambut kontribusi dari komunitas! Baik berupa perbaikan bug, usulan fitur, perbaikan terjemahan, maupun peningkatan performa.

### Alur Kontribusi:
1. **Fork** repositori ini ke akun GitHub Anda.
2. Buat branch fitur baru dari `main`:
   ```bash
   git checkout -b feature/nama-fitur-keren
   ```
3. Lakukan perubahan kode dengan mematuhi prinsip desain anti-AI-slop.
4. Pastikan verifikasi tipe data dan build lolos:
   ```bash
   npm run typecheck
   npm run build
   ```
5. Commit perubahan Anda dengan format [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: menambahkan dukungan ekspor catatan ke pdf"
   ```
6. Dorong branch Anda ke fork:
   ```bash
   git push origin feature/nama-fitur-keren
   ```
7. Buka **Pull Request** di repositori utama dan jelaskan perubahan yang Anda buat.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE). Anda bebas menggunakan, memodifikasi, dan mendistribusikannya untuk kebutuhan pribadi maupun komersial.

<div align="center">
  <sub>Dibuat dengan dedikasi pada keahlian kriya perangkat lunak desktop.</sub>
</div>
