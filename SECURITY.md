# Security Policy

The **Taktil Notes** project is committed to delivering a secure, private, and local-first desktop experience. This document outlines our security architecture, supported versions, and responsible vulnerability disclosure process.

---

## 🔒 Security Architecture & Guarantees

Taktil Notes is designed from the ground up as a **zero-telemetry, local-first application**:

1. **Context Isolation & Node Integration**:
   - The renderer process runs with `contextIsolation: true` and `nodeIntegration: false`.
   - Node.js APIs and OS primitives are completely unreachable from renderer scripts.
   - Communication between the renderer and main process occurs strictly through a strongly typed IPC bridge exposed via `contextBridge.exposeInMainWorld('electronAPI', ...)`.

2. **Privileged Asset Protocol (`note-asset://`)**:
   - Local media files dropped into notes are stored in `app.getPath('userData')/assets/`.
   - The custom scheme `note-asset://` is registered as privileged before the application initializes.
   - All file lookups enforce strict path resolution guards (`filePath.startsWith(assetsDir)`) to prevent directory traversal attacks (`../`).

3. **External Navigation & Link Protection**:
   - Arbitrary child window creation is denied by default (`setWindowOpenHandler`).
   - External URLs (HTTP/HTTPS) are delegated to the user's default system web browser via `shell.openExternal`, keeping untrusted web content out of Electron's runtime.

4. **Atomic File Persistence**:
   - User notes and configuration files (`notes.json`, `folders.json`, `config.json`) are written to temporary staging files first before atomic renaming (`fs.rename`), preventing data corruption during unexpected system power loss or process crashes.

---

## 🛡️ Supported Versions

We provide security patches and bug fixes for the current active release line:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `1.x.x` | ✅ Yes | Current Active Release Line |
| `< 1.0.0` | ❌ No | Deprecated Pre-releases |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or security bug in Taktil Notes, please report it responsibly rather than opening a public issue.

### Preferred Reporting Channels:
1. **GitHub Private Vulnerability Reporting**:
   - Navigate to the [Security Tab](https://github.com/Abdanio/taktil-notes/security) of the repository.
   - Click on **"Report a vulnerability"** to open an encrypted advisory draft.
2. **Email Security Contact**:
   - If you cannot use GitHub Security Advisories, send an email to: `okta.105240041@iwu.ac.id` with the subject `[SECURITY] Taktil Notes Vulnerability Report`.

### What to Include in Your Report:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction steps or a minimal proof-of-concept (PoC).
- Your operating system version (Windows, macOS, or Linux) and app version.
- Any suggested fixes or mitigations if available.

### Disclosure Timeline:
- **Initial Response**: We will acknowledge receipt of your report within **48 to 72 hours**.
- **Triage & Assessment**: We will assess the severity and work on a patch in a private branch.
- **Release & Public Credit**: Once the patch is tested and published via an updated release tag, we will publish the security advisory and publicly credit your contribution (unless you prefer to remain anonymous).
