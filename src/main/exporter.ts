import { BrowserWindow, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import zlib from 'zlib'

interface ExportOptions {
  title: string
  htmlContent: string
  markdownContent?: string
}

interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

export function setupExporter(getMainWindow: () => BrowserWindow | null): void {
  // 1. Export as Editorial Book PDF
  ipcMain.handle('exporter:exportPdf', async (_, options: ExportOptions): Promise<ExportResult> => {
    const parentWin = getMainWindow()
    const sanitizedTitle = (options.title || 'Catatan').replace(/[/\\?%*:|"<>]/g, '-').trim()

    const saveOptions = {
      title: 'Simpan PDF Buku Editorial',
      defaultPath: `${sanitizedTitle}.pdf`,
      filters: [{ name: 'Dokumen PDF', extensions: ['pdf'] }]
    }
    const { canceled, filePath } = parentWin
      ? await dialog.showSaveDialog(parentWin, saveOptions)
      : await dialog.showSaveDialog(saveOptions)

    if (canceled || !filePath) {
      return { success: false }
    }

    let printWin: BrowserWindow | null = null
    try {
      printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      const printHtml = generateEditorialHtml(options.title, options.htmlContent, true)
      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(printHtml)}`)

      // Wait a short delay for fonts to render
      await new Promise((res) => setTimeout(res, 500))

      const pdfBuffer = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          marginType: 'custom',
          top: 1,
          bottom: 1,
          left: 1,
          right: 1
        },
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size: 8pt; color: #888; font-family: serif; width: 100%; text-align: center; text-transform: uppercase; letter-spacing: 1px;">${options.title}</div>`,
        footerTemplate: `<div style="font-size: 8pt; color: #888; font-family: serif; width: 100%; text-align: center;"><span class="pageNumber"></span></div>`
      })

      await fs.writeFile(filePath, pdfBuffer)
      return { success: true, filePath }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengekspor PDF'
      }
    } finally {
      if (printWin && !printWin.isDestroyed()) {
        printWin.close()
      }
    }
  })

  // 2. Export as Standalone Offline HTML
  ipcMain.handle('exporter:exportHtml', async (_, options: ExportOptions): Promise<ExportResult> => {
    const parentWin = getMainWindow()
    const sanitizedTitle = (options.title || 'Catatan').replace(/[/\\?%*:|"<>]/g, '-').trim()

    const saveOptions = {
      title: 'Simpan Berkas HTML Mandiri',
      defaultPath: `${sanitizedTitle}.html`,
      filters: [{ name: 'Halaman Web HTML', extensions: ['html', 'htm'] }]
    }
    const { canceled, filePath } = parentWin
      ? await dialog.showSaveDialog(parentWin, saveOptions)
      : await dialog.showSaveDialog(saveOptions)

    if (canceled || !filePath) {
      return { success: false }
    }

    try {
      const fullHtml = generateEditorialHtml(options.title, options.htmlContent, false)
      await fs.writeFile(filePath, fullHtml, 'utf-8')
      return { success: true, filePath }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengekspor HTML'
      }
    }
  })

  // 3. Export as EPUB eBook
  ipcMain.handle('exporter:exportEpub', async (_, options: ExportOptions): Promise<ExportResult> => {
    const parentWin = getMainWindow()
    const sanitizedTitle = (options.title || 'Catatan').replace(/[/\\?%*:|"<>]/g, '-').trim()

    const saveOptions = {
      title: 'Simpan Buku Digital EPUB',
      defaultPath: `${sanitizedTitle}.epub`,
      filters: [{ name: 'Buku Digital EPUB', extensions: ['epub'] }]
    }
    const { canceled, filePath } = parentWin
      ? await dialog.showSaveDialog(parentWin, saveOptions)
      : await dialog.showSaveDialog(saveOptions)

    if (canceled || !filePath) {
      return { success: false }
    }

    try {
      const epubBuffer = generateEpubArchive(options.title, options.htmlContent)
      await fs.writeFile(filePath, epubBuffer)
      return { success: true, filePath }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengekspor EPUB'
      }
    }
  })
}

// Generates an elegant, publication-grade editorial HTML template
function generateEditorialHtml(title: string, bodyContent: string, forPrint: boolean): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 22mm 20mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: ${forPrint ? '0' : '48px 24px'};
      background-color: ${forPrint ? '#ffffff' : '#F9F8F5'};
      color: #242220;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.75;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 68ch;
      margin: 0 auto;
      background: #ffffff;
      padding: ${forPrint ? '0' : '56px 64px'};
      ${forPrint ? '' : 'border: 1px solid #E6E2DA; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);'}
    }
    .header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #EAE6DE;
    }
    .title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 28pt;
      font-weight: 700;
      line-height: 1.15;
      color: #171615;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }
    .meta {
      font-size: 9pt;
      color: #8C877D;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .prose p {
      margin: 1.2em 0;
    }
    /* Editorial Drop Cap on first paragraph */
    .prose > p:first-of-type::first-letter {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 3.4em;
      float: left;
      line-height: 0.8;
      margin-right: 0.12em;
      margin-top: 0.06em;
      color: #D95D39;
      font-weight: 700;
    }
    h1, h2, h3, h4 {
      font-family: 'Fraunces', Georgia, serif;
      color: #171615;
      margin-top: 1.8em;
      margin-bottom: 0.6em;
      line-height: 1.25;
    }
    h1 { font-size: 18pt; border-bottom: 1px solid #EAE6DE; padding-bottom: 0.3em; }
    h2 { font-size: 15pt; }
    h3 { font-size: 12.5pt; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      background-color: #F3EFE8;
      padding: 0.15em 0.35em;
      border-radius: 4px;
      color: #A33D21;
    }
    pre {
      background-color: #F7F5F0;
      border: 1px solid #E2DED5;
      border-radius: 8px;
      padding: 14px 18px;
      overflow-x: auto;
      margin: 1.5em 0;
    }
    pre code {
      background: none;
      padding: 0;
      color: #242220;
    }
    blockquote {
      margin: 1.5em 0;
      padding: 0.5em 1.2em;
      border-left: 3px solid #D95D39;
      background-color: rgba(217, 93, 57, 0.04);
      font-style: italic;
      color: #555047;
    }
    ul, ol {
      margin: 1em 0;
      padding-left: 1.5em;
    }
    li {
      margin: 0.4em 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5em 0;
    }
    .footer {
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid #EAE6DE;
      font-size: 9pt;
      color: #9C978E;
      text-align: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${escapeHtml(title)}</h1>
      <div class="meta">Taktil Notes • Diterbitkan ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="prose">
      ${bodyContent}
    </div>
    ${forPrint ? '' : '<div class="footer">Dibuat dengan Taktil Notes — Aplikasi Catatan Desktop Local-First</div>'}
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Minimal, zero-dependency pure Node.js ZIP / EPUB Packager
interface ZipEntry {
  path: string
  data: Buffer
  method: number // 0 = store, 8 = deflate
}

function generateEpubArchive(title: string, bodyHtml: string): Buffer {
  const cleanTitle = escapeHtml(title)
  const dateStr = new Date().toISOString().split('T')[0]

  const files: { path: string; content: string; uncompressed?: boolean }[] = [
    // 1. mimetype (MUST be first file, uncompressed, exactly 20 bytes)
    { path: 'mimetype', content: 'application/epub+zip', uncompressed: true },
    // 2. container.xml
    {
      path: 'META-INF/container.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    },
    // 3. content.opf
    {
      path: 'OEBPS/content.opf',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${cleanTitle}</dc:title>
    <dc:creator>Taktil Notes</dc:creator>
    <dc:language>id</dc:language>
    <dc:identifier id="BookID">urn:uuid:taktil-notes-${Date.now()}</dc:identifier>
    <dc:date>${dateStr}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chap1"/>
  </spine>
</package>`
    },
    // 4. toc.ncx
    {
      path: 'OEBPS/toc.ncx',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:taktil-notes-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${cleanTitle}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${cleanTitle}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`
    },
    // 5. style.css
    {
      path: 'OEBPS/style.css',
      content: `body {
  font-family: serif;
  margin: 1.5em;
  line-height: 1.6;
  color: #1a1917;
}
h1 {
  font-size: 2em;
  line-height: 1.2;
  margin-bottom: 0.8em;
  color: #111;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.3em;
}
p {
  margin: 1em 0;
  text-align: justify;
}
p.first::first-letter {
  font-size: 3em;
  float: left;
  line-height: 0.8;
  margin-right: 0.1em;
  color: #c44d2d;
  font-weight: bold;
}
blockquote {
  border-left: 3px solid #c44d2d;
  margin: 1em 0;
  padding-left: 1em;
  font-style: italic;
}
code {
  font-family: monospace;
  background: #eee;
  padding: 2px 4px;
}`
    },
    // 6. chapter1.xhtml
    {
      path: 'OEBPS/chapter1.xhtml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${cleanTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${cleanTitle}</h1>
  <div class="content">
    ${bodyHtml.replace(/<br>/g, '<br/>').replace(/<hr>/g, '<hr/>').replace(/&nbsp;/g, '&#160;')}
  </div>
</body>
</html>`
    }
  ]

  // Create in-memory zip archive
  const entries: ZipEntry[] = files.map((f) => {
    const rawBuf = Buffer.from(f.content, 'utf-8')
    if (f.uncompressed) {
      return { path: f.path, data: rawBuf, method: 0 }
    }
    const compressed = zlib.deflateRawSync(rawBuf)
    return { path: f.path, data: compressed, method: 8 }
  })

  return packZip(entries, files.map((f) => Buffer.from(f.content, 'utf-8')))
}

// Minimal ZIP specification binary packer
function packZip(entries: ZipEntry[], rawBuffers: Buffer[]): Buffer {
  const parts: Buffer[] = []
  const centralRecords: Buffer[] = []
  let offset = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const raw = rawBuffers[i]
    const pathBuf = Buffer.from(entry.path, 'utf-8')
    const crc = crc32(raw)

    // Local Header (30 bytes + path length)
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0) // Signature
    lh.writeUInt16LE(20, 4) // Version needed
    lh.writeUInt16LE(0, 6) // Flags
    lh.writeUInt16LE(entry.method, 8) // Method (0 or 8)
    lh.writeUInt16LE(0, 10) // Mod time
    lh.writeUInt16LE(0, 12) // Mod date
    lh.writeUInt32LE(crc, 14) // CRC32
    lh.writeUInt32LE(entry.data.length, 18) // Compressed size
    lh.writeUInt32LE(raw.length, 22) // Uncompressed size
    lh.writeUInt16LE(pathBuf.length, 26) // File name len
    lh.writeUInt16LE(0, 28) // Extra len

    parts.push(lh, pathBuf, entry.data)

    // Central Directory Record (46 bytes + path length)
    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0) // Signature
    cd.writeUInt16LE(20, 4) // Version made by
    cd.writeUInt16LE(20, 6) // Version needed
    cd.writeUInt16LE(0, 8) // Flags
    cd.writeUInt16LE(entry.method, 10)
    cd.writeUInt16LE(0, 12)
    cd.writeUInt16LE(0, 14)
    cd.writeUInt32LE(crc, 16)
    cd.writeUInt32LE(entry.data.length, 20)
    cd.writeUInt32LE(raw.length, 24)
    cd.writeUInt16LE(pathBuf.length, 28)
    cd.writeUInt16LE(0, 30) // Extra len
    cd.writeUInt16LE(0, 32) // Comment len
    cd.writeUInt16LE(0, 34) // Disk start
    cd.writeUInt16LE(0, 36) // Internal attr
    cd.writeUInt32LE(0, 38) // External attr
    cd.writeUInt32LE(offset, 42) // Relative offset of local header

    centralRecords.push(cd, pathBuf)

    offset += lh.length + pathBuf.length + entry.data.length
  }

  const cdStart = offset
  let cdSize = 0
  centralRecords.forEach((buf) => (cdSize += buf.length))

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // Signature
  eocd.writeUInt16LE(0, 4) // Disk num
  eocd.writeUInt16LE(0, 6) // CD start disk
  eocd.writeUInt16LE(entries.length, 8) // Num of CD entries on this disk
  eocd.writeUInt16LE(entries.length, 10) // Total CD entries
  eocd.writeUInt32LE(cdSize, 12) // Size of CD
  eocd.writeUInt32LE(cdStart, 16) // Offset of CD
  eocd.writeUInt16LE(0, 20) // Comment len

  return Buffer.concat([...parts, ...centralRecords, eocd])
}

// Standard CRC32 table calculation
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[n] = c
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}
