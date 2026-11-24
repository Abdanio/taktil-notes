<div align="center">

# 🖋️ Taktil Notes
### *A Bespoke, Local-First Desktop Notes Application for Craftspersons*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-34.x-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

<p align="center">
  A high-performance, local-first desktop notes app crafted with physical spring physics, synthesized acoustic chimes, bespoke typography, and zero generic "AI slop" UI patterns.
</p>

[Key Features](#-key-features) •
[Design Manifesto](#-anti-ai-slop-design-manifesto) •
[Architecture](#-architecture--stack) •
[Installation](#-getting-started) •
[Keyboard Shortcuts](#-keyboard-shortcuts) •
[Contributing](#-contributing)

</div>

---

## 💡 The Philosophy: Why "Taktil"?

The word **Taktil** (*Tactile*) originates from the sense of touch — feeling real physical texture, weight, and responsive resistance.

In an era where modern productivity apps often feel cold, cloud-dependent, sluggish, and bloated with generic, cookie-cutter AI interface tropes, **Taktil Notes** was created to bring back the tangible warmth of fine paper:
- **Visual Warmth**: Alabaster paper palettes with a subtle `2.5%` SVG fractal noise grain overlay.
- **Physical Motion**: Real spring physics (`stiffness: 450, damping: 28`) when dragging cards, and micro-bounce checklists.
- **Acoustic Feedback**: Harmonious marimba chimes synthesized directly in real time via the Web Audio API without relying on external media files.
- **Data Sovereignty**: 100% offline, local-first persistence with atomic file writes preventing data corruption.

---

## ✨ Key Features

### 1. 🗂️ Asymmetric 3-Column Workspace
- **Column 1 — Sidebar (210px)**: Frameless drag header, quick filters (*All Notes*, *Pinned*, *Trash*), color-coded droppable folders with item badges, live font switchers, theme toggles, and help triggers.
- **Column 2 — Note Index List (270px)**: Instant fuzzy search, split-button quick create with custom icon picker, 3-dots note menu, and `rounded-xl` cards with Fraunces titles and timestamps.
- **Column 3 — Distraction-Free Canvas (1fr)**: Ergonomic centered writing area constrained to `max-w-[68ch]`, equipped with live Markdown rendering, hybrid writing mode, and custom window controls.

### 2. ⚡ Tactile Motion & Micro-Interactions
- **Living Checklists**: Interactive `- [ ]` / `- [x]` task checkboxes trigger an expressive micro-bounce (`scale: [0.85, 1.2, 1]`) paired with a smooth 200ms left-to-right animated strikethrough.
- **Weighted Drag & Drop (`@dnd-kit`)**: Dragged cards elevate into a `<DragOverlay>` with `scale: 1.03`, `-1.5deg` tilt, and deep layered `shadow-2xl` shadows. Drops settle with spring physics.
- **Magnetic Folder Drop Targets**: Hovering a dragged note over a sidebar folder expands the folder (`scale: 1.08`) and transforms its icon weight to `duotone`.
- **Parallax Empty State**: Minimalist layered 3D paper stack SVG that shifts and tilts proportionally in response to your mouse coordinates when a folder has no notes.

### 3. 🔔 Native Desktop Reminders & Acoustic Chimes
- **Web Audio Chimes**: Synthesizes a calming C5-C6 ascending arpeggio on timer completion and desktop alerts.
- **OS Action Center Integration**: Dispatches native notifications via Electron's `Notification` API. Clicking the notification restores window focus and opens the corresponding note immediately.

### 4. 🖼️ Local Asset Handling (`note-asset://`)
- **OS File Drag & Drop**: Drag `.png`, `.jpg`, `.jpeg`, `.webp`, `.md`, or `.txt` files directly onto the editor canvas.
- **Privileged Protocol**: Images are copied locally to `userData/assets/` and served via `note-asset://filename.ext`, immune to standard CSP restrictions.

### 5. 📖 Built-In Interactive Markdown Guide
- Accessible anytime via `Ctrl + M` or the editor toolbar. Includes visual examples for Headings, Tasks, Fenced Code Blocks, Quotes, Links, Images, and Dividers with one-click **"Copy"** and **"Insert"** actions.

### 6. 🎨 Bespoke Note Identity (*Anti-AI-Slop*)
- Replaces generic colored edge stripes with expressive, customizable note icon badges (*Idea, Project, Code, Coffee, Target, Reading, Personal, etc.*).
- Editable via the 3-dots card menu or directly alongside the title in the editor canvas.

---

## 🎨 Anti-"AI Slop" Design Manifesto

| Design Aspect | Typical Generic Pattern | Taktil Notes Craftsmanship |
| :--- | :--- | :--- |
| **Typography** | Generic Roboto / Inter without distinction | `'Fraunces'` (Editorial Headings), `'Plus Jakarta Sans'` (UI Prose), `'JetBrains Mono'` (Tabular Code) |
| **Canvas Color** | Blinding `#FFFFFF` or pitch `#000000` | *Warm Paper* (`#F8F6F1` with fractal paper grain) & *Matte Obsidian* (`#181715`) |
| **Accent Hue** | Electric purple / generic SaaS blue gradients | Earth tones: *Terracotta Orange* (`#D95D39`) & *Soft Coral* (`#E07A5F`) |
| **Tactile Feel** | Flat, lifeless rectangles with static clicks | Layered depth, spring physics settling, and synthesized acoustic feedback |

---

## 🛠️ Architecture & Stack

```
desktop-notes-app/
├── src/
│   ├── main/
│   │   └── index.ts          # Main Process (IPC, Frameless Window, note-asset://, Atomic Storage)
│   ├── preload/
│   │   ├── index.ts          # contextBridge IPC API
│   │   └── index.d.ts        # Typed window.electronAPI definitions
│   └── renderer/
│       ├── index.html        # HTML Root with Google Fonts (Fraunces, Jakarta Sans, JetBrains)
│       └── src/
│           ├── components/   # UI Modules (Sidebar, NoteList, Editor, Modals)
│           │   ├── Editor.tsx
│           │   ├── NoteList.tsx
│           │   ├── NoteCard.tsx
│           │   ├── Sidebar.tsx
│           │   ├── MarkdownGuideModal.tsx
│           │   ├── NoteIconPicker.tsx
│           │   ├── CommandPalette.tsx
│           │   └── ShortcutsModal.tsx
│           ├── context/      # NotesContext State Store & Atomic Sync
│           ├── lib/          # Sound Synthesizer, Date Helpers, driver.js Tour
│           ├── types/        # Core Data Interfaces
│           ├── globals.css   # CSS Theme Tokens & Tactile Paper Grain
│           └── main.tsx      # React 18 Entrypoint
├── electron.vite.config.ts   # Multi-target Vite Bundler Configuration
├── electron-builder.yml      # Desktop Installer Configuration (Windows, Mac, Linux)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) version `18.x` or later (`v20.x` or `v24.x` recommended).
- `npm` package manager (or `pnpm` / `yarn`).
- Git installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/Abdanio/taktil-notes.git
cd taktil-notes
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode (Hot-Reload)
```bash
npm run dev
```
The frameless Electron application will launch with Vite Hot Module Replacement (HMR).

### 4. Run TypeScript Verification
```bash
npm run typecheck
```

### 5. Build for Production
```bash
npm run build
```

### 6. Package Desktop Installers
- **Windows (NSIS Installer & Portable .exe)**:
  ```bash
  npm run build:win
  ```
- **macOS (DMG & Zip)**:
  ```bash
  npm run build:mac
  ```
- **Linux (AppImage & Deb)**:
  ```bash
  npm run build:linux
  ```

---

## ⌨️ Keyboard Shortcuts

Designed for mouse-free, friction-free productivity:

| Shortcut | Description |
| :--- | :--- |
| `Ctrl / Cmd + N` | Instantly create a new note |
| `Ctrl / Cmd + K` | Open Quick Command Palette |
| `Ctrl / Cmd + M` | Open Markdown Syntax Guide |
| `Ctrl / Cmd + B` | Toggle Sidebar visibility |
| `Ctrl / Cmd + /` | Open 3D Physical Keycaps Cheat Sheet |
| `Ctrl / Cmd + P` | Pin / unpin active note |
| `Ctrl / Cmd + Backspace` | Move active note to Trash |
| `Ctrl / Cmd + Shift + T` | Toggle theme (*Warm Paper* $\leftrightarrow$ *Matte Obsidian*) |
| `Ctrl / Cmd + Shift + F` | Cycle typography (*Editorial* $\rightarrow$ *Sans* $\rightarrow$ *Mono*) |
| `F11` / Toolbar Icon | Toggle Fullscreen Mode |

---

## 🤝 Contributing

Contributions are welcomed! Whether it is fixing a bug, suggesting a new feature, refining translations, or optimizing performance:

1. **Fork** this repository.
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add export to plain text option"
   ```
4. Verify types and builds pass cleanly:
   ```bash
   npm run typecheck
   npm run build
   ```
5. Push to your branch and open a **Pull Request**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software for personal and commercial projects.

<div align="center">
  <sub>Crafted with passion for tactile desktop software engineering.</sub>
</div>
